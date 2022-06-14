import { promises as fs } from 'node:fs';
import Path from 'node:path';
import { existsAsync } from "./common";
import { PathicWatchOptions } from "./pathic-types";


export async function pathicWatchAsync(options:PathicWatchOptions)
{
    const dir=options.sourceDir;
    if(!dir){
        throw new Error('--sourceDir required');
    }

    const exts=options.extensions;

    const targets=options.destDirs||[];

    console.log(
        `${dir} (${exts?exts.map(e=>'*'+e).join(', '):'*'}) -> (\n`+
        `${targets.map(t=>'    '+t).join('\n')}\n)`)


    await syncDir(dir,targets,exts,options);

    if(options.sync){
        return;
    }

    try{
        const watcher=fs.watch(dir);
        for await (const event of watcher){
            if(exts && !exts.some(e=>event.filename.toLowerCase().endsWith(e))){
                continue;
            }
            console.log(event);
            if(event.eventType==='change'){
                await Promise.all(targets
                    .map(t=>copy(Path.join(dir,event.filename),Path.join(t,event.filename),options)))
            }else if(event.eventType==='rename'){
                await syncDir(dir,targets,exts,options);
            }
        }
    }catch(err:any){
        if (err.name==='AbortError'){
            return;
        }
        throw err;
    }
}

async function syncDir(dir:string,targets:string[],exts:string[]|undefined,options:PathicWatchOptions)
{
    const startingFiles=filter(await fs.readdir(dir),exts);

    await Promise.all(targets.map(async t=>{
        console.log(`Sync ${t}`)
        await fs.rm(t,{recursive:true,force:true});
        await fs.mkdir(t,{recursive:true});
        await Promise.all(startingFiles.map(f=>copy(Path.join(dir,f),Path.join(t,f),options)))
    }))
}


function filter(ary:string[],exts:string[]|undefined){
    if(!exts){
        return ary;
    }
    return ary.filter(p=>exts.some(e=>p.toLowerCase().endsWith(e)))
}

async function copy(src:string,dest:string,options:PathicWatchOptions){
    if(await existsAsync(src)){
        console.log(`${src} -> ${dest}`);
        const content=
            (options.banner?'/* '+options.banner+' */\n':'')+
            `/* This is a readonly copy of file://${Path.resolve(src)} */\n\n`+
            (await fs.readFile(src)).toString();
        if(await existsAsync(dest)){
            await fs.chmod(dest,0o222);
        }
        await fs.writeFile(dest,content);
        await fs.chmod(dest,0o444);
    }else{
        console.log(`delete ${dest}`);
        await fs.chmod(dest,0o222);
        await fs.rm(dest,{force:true})
    }
}