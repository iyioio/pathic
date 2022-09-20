import JSON5 from 'json5';
import { promises as fs } from "node:fs";
import Path from "node:path";
import { cmd, existsAsync, isGitIgnoredAsync, verbose } from "./common";
import { PathicUtilOptions } from "./pathic-types";


export async function pathicBatchBuildAsync(options:PathicUtilOptions)
{
    if(options.verbose){
        verbose(true);
    }
    if(!options.batchBuild){
        throw new Error('options.batchBuild required');
    }

    const exclude=options.exclude?.split(',').map(e=>e.trim().toLocaleLowerCase())??[];

    await tryBuildAsync(options.batchBuild,options,exclude,true);

}

async function tryBuildAsync(dir:string,options:PathicUtilOptions,exclude:string[],first:boolean)
{
    const [packageExists,ignored,files]=await Promise.all([
        existsAsync(Path.join(dir,'package.json')),
        (first || options.includeIgnored)?false:isGitIgnoredAsync(dir),
        fs.readdir(dir)
    ]);

    if(ignored){
        return;
    }
    
    if(packageExists){
        await buildAsync(dir,options);
    }

    
    for(const p of files){
        if(exclude.includes(p.toLowerCase())){
            continue;
        }
        const path=Path.join(dir,p);
        const stat=await fs.stat(path);
        if(!stat.isDirectory()){
            continue;
        }
        await tryBuildAsync(path,options,exclude,false);
    }
}


async function buildAsync(dir:string,options:PathicUtilOptions)
{
    let buildCmd:string='';
    if(options.batchBuildCommand){
        buildCmd=options.batchBuildCommand;
    }else if(options.batchBuildNpmScript){
        const packagePath=Path.join(dir,'package.json');
        const pkg=JSON5.parse((await fs.readFile(packagePath)).toString());
        if(!pkg.scripts?.[options.batchBuildNpmScript]){
            console.info(
                `${packagePath} do not define the ${options.batchBuildNpmScript} `+
                'script and is being skipped')
            return;
        }
        buildCmd='npm run '+options.batchBuildNpmScript;
    }else if(!options.batchInstall && !options.batchUninstall){
        return;
    }
    const nmp=Path.join(dir,'node_modules');
    let nodeModulesExists=await existsAsync(nmp);
    if(options.batchUninstall && nodeModulesExists){
        console.info(`Removing node_modules - ${nmp}`);
        await fs.rm(nmp,{recursive:true,force:true});
        nodeModulesExists=false;
    }
    if(!nodeModulesExists && (options.batchInstall || buildCmd)){
        console.info(`Installing node_modules - ${dir}/package.json`);
        await cmd(`cd ${dir} && npm ci`,!verbose());
    }
    if(buildCmd){
        console.info(`Building package - ${dir} - ${buildCmd}`);
        await cmd(`cd ${dir} && ${buildCmd}`,!verbose());
    }
}