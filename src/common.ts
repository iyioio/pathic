import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import Path from 'node:path';
import { CompilerOptions } from 'typescript';


export interface TsConfig{
    extends?:string;
    compilerOptions?:CompilerOptions;
    exclude?:string[];
}

export async function findProjectRootAsync(path:string, oPath:string, rootFile='package.json'):Promise<string>
{
    if(!path){
        throw new Error(`Project root not found for ${oPath}`)
    }
    if(await existsAsync(Path.join(path,rootFile))){
        return path;
    }
    if(path==='/' || path==='\\'){
        throw new Error(`Project root not found for ${oPath}`)
    }
    return await findProjectRootAsync(Path.dirname(path),oPath,rootFile);
}


export async function copyAsync(src:string,dest:string)
{
    const stats=await fs.lstat(src);
    if(stats.isDirectory()){
        await fs.mkdir(dest);
        await Promise.all((await fs.readdir(src))
            .map(p=>copyAsync(Path.join(src,p),Path.join(dest,p))))
    }else if(stats.isSymbolicLink()){
        const link=await fs.readlink(src);
        await fs.symlink(link,dest);
    }else{
        if(fs.cp){
            await fs.cp(src,dest);
        }else{
            await cmd(`cp "${src}" "${dest}"`);
        }
    }
}

export async function npmInstallAsync(root:string, extra='')
{
    const cwd=process.cwd();
    try{
        process.chdir(root);
        console.info(`Installing node_modules in ${root}`)
        await cmd('npm install'+(extra?' '+extra:''));
    }finally{
        process.chdir(cwd);
    }
}

export async function existsAsync(path:string):Promise<boolean>
{
    try{
        await fs.access(path);
        return true;
    }catch{
        return false;
    }
}


export function cmd(cmd:string,silent=false,ignoreErrors=false):Promise<string>
{
    return new Promise<string>((r,j)=>{
        if(!silent){
            console.info('> '+cmd);
        }
        exec(cmd,(error,stdout,stderr)=>{
            if(error){
                if(!silent){
                    console.error('| '+error);
                }
                if(ignoreErrors){
                    r('');
                }else{
                    j(error);
                }
            }else{
                if(!silent){
                    console.info('| '+stdout);
                    if(stderr){
                        console.warn('| '+stderr);
                    }
                }
                r(stdout?.trim()||'');
            }
        })
    })
}