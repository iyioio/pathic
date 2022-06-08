import { promises as fs } from "fs";
import JSON5 from 'json5';
import Path from "path";
import { cmd, existsAsync } from "./common";
import { PathicUtilOptions } from "./pathic-types";

const exclude=['node_modules','dist','out']


export async function pathicBatchBuildAsync(options:PathicUtilOptions)
{
    if(!options.batchBuild){
        throw new Error('options.batchBuild required');
    }

    await tryBuildAsync(options.batchBuild,options);

}

async function tryBuildAsync(dir:string,options:PathicUtilOptions)
{
    if(await existsAsync(Path.join(dir,'package.json'))){
        await buildAsync(dir,options);
    }else{
        await Promise.all(
            (await fs.readdir(dir))
            .filter(p=>!exclude.includes(p.toLowerCase()))
            .map(p=>tryBuildAsync(Path.join(dir,p),options))
        )
    }
}


async function buildAsync(dir:string,options:PathicUtilOptions)
{
    let buildCmd:string;
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
    }else{
        return;
    }
    if(!await existsAsync(Path.join(dir,'node_modules'))){
        await cmd(`cd ${dir} && npm ci`);
    }
    if(!options.batchInstall){
        await cmd(`cd ${dir} && ${buildCmd}`);
    }
}