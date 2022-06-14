import JSON5 from 'json5';
import { promises as fs } from 'node:fs';
import Path from 'node:path';
import { cmd, copyAsync, existsAsync, findProjectRootAsync, npmInstallAsync, TsConfig, verbose } from './common';
import { PathicBuildOptions } from "./pathic-types";

type Paths={[name:string]:string[]};

interface BuildCtx
{
    rootDir:string;
    mainConfig:TsConfigRef;
    outDir:string;
}

interface TsConfigRef
{
    path:string;
    dir:string;
    ourDir?:string;
    rootDir?:string;
    baseUrl?:string;
    config:TsConfig;
}

interface PathUsage
{
    name:string;
    path:string;
}

interface PathUsageEx extends PathUsage
{
    packageJson:string;
    packageLockJson:string;
    nodeModules:string;
    root:string;
}

export async function pathicBuildAsync(options:PathicBuildOptions)
{
    if(options.verbose){
        verbose(true);
    }
    
    if(!options.buildConfig){
        throw new Error('options.buildConfig required');
    }

    const configs=await loadConfigsAsync(options.buildConfig);
    const paths=getPaths(configs);

    const mainConfig=configs[0];
    if(!mainConfig.ourDir){
        throw new Error(`tsconfig.compilerOptions.outDir required. ${mainConfig.path}`)
    }

    const ctx:BuildCtx={
        rootDir:configs.reduce((p,c)=>c.rootDir||p,process.cwd()),
        outDir:mainConfig.ourDir,
        mainConfig,
    }

    if(options.build){
        await tscAsync(mainConfig,options);
    }

    const usedPaths=await Promise.all(
        (await replaceAsync(mainConfig.ourDir,paths,options,ctx))
        .map(p=>getPathUsageEx(p)));

    usedPaths.unshift(await getPathUsageEx({
        name:'main',
        path:mainConfig.dir
    }))

    if(options.extraProjects){
        let ei=0;
        const extraProjects=options.extraProjects.split(',');
        for(const p of extraProjects){
            if(!p.trim()){
                continue;
            }
            const path=Path.resolve(p);
            usedPaths.push({
                name:`extra-${ei++}`,
                path,
                packageJson:Path.join(path,'package.json'),
                packageLockJson:Path.join(path,'package-lock.json'),
                nodeModules:Path.join(path,'node_modules'),
                root:path
            })
        }
    }

    if(options.installNodeModules){
        await installNodeModulesAsync(mainConfig,usedPaths,options);
    }


}


async function getPathUsageEx(pathUsage:PathUsage):Promise<PathUsageEx>
{
    const root=await findProjectRootAsync(pathUsage.path,pathUsage.path);
    return {
        ...pathUsage,
        packageJson:Path.join(root,'package.json'),
        packageLockJson:Path.join(root,'package-lock.json'),
        nodeModules:Path.join(root,'node_modules'),
        root
    }
}

async function installNodeModulesAsync(
    config:TsConfigRef,
    usedPaths:PathUsageEx[],
    options:PathicBuildOptions)
{

    if(!config.ourDir){
        throw new Error(`config.outDir not defined for ${config.dir}`);
    }

    const nodeMods=Path.join(config.ourDir,'node_modules');
    await fs.rm(nodeMods,{recursive:true,force:true});
    await fs.mkdir(Path.join(nodeMods,'.bin'),{recursive:true});

    for(const path of usedPaths){
        await installNodeModuleAsync(config,path,nodeMods,options);
    }


}

interface PackageLockPackage
{
    _name?:string;
    dev?:boolean;
    version:string;
}
interface PackageLock {
    name?:string;
    version?:string;
    lockfileVersion?:number;
    requires?:boolean;
    packages?:{
        [name:string]:PackageLockPackage;
    }
}


async function installNodeModuleAsync(
    config:TsConfigRef,
    path:PathUsageEx,
    nodeMods:string,
    options:PathicBuildOptions)
{

    if( (await Promise
        .all([existsAsync(path.nodeModules),existsAsync(path.packageLockJson)]))
        .includes(false))
    {
        await npmInstallAsync(path.root);
    }

    const packageLock:PackageLock=JSON5.parse(
        (await fs.readFile(path.packageLockJson)).toString());


    if(!packageLock.packages){
        throw new Error(`No packages found in ${path.packageLockJson}`);
    }

    const packages:PackageLockPackage[]=[];
    for(const e in packageLock.packages){
        if(!e.trim()){
            continue;
        }
        const pkg=packageLock.packages[e];
        if(!options.installDevDeps && pkg.dev){
            continue;
        }
        const name=e.startsWith('node_modules/')?e.substring('node_modules/'.length):e;
        pkg._name=name;
        packages.push(pkg);
    }

    await Promise.all(packages.map(async pkg=>{

        const name=pkg._name;
        if(!name){
            return;
        }
        const sourcePath=Path.join(path.nodeModules,name);
        const destPath=Path.join(nodeMods,name);

        const [sourceExists,destExists]=await Promise.all([
            existsAsync(sourcePath),
            existsAsync(destPath)
        ])
        if(destExists){
            return;
        }

        if(!sourceExists){
            await npmInstallAsync(path.root,`${name}@${pkg.version}${pkg.dev?' --save-dev':''}`)
        }
        
        await fs.mkdir(Path.dirname(destPath),{recursive:true});
        await copyAsync(sourcePath,destPath);
    }));

    const binSrc=Path.join(path.nodeModules,'.bin');
    const binDest=Path.join(nodeMods,'.bin');
    if(options.copyBin && await existsAsync(binSrc) && !existsAsync(binDest)){
        await Promise.all((await fs.readdir(binSrc)).map(async f=>{
            const src=Path.join(binSrc,f);
            const dest=Path.join(binDest,f);
            if(!await existsAsync(dest)){
                await copyAsync(src,dest);
            }
        }));
    }



}

async function replaceAsync(
    rPath:string,
    paths:Paths,
    options:PathicBuildOptions,
    ctx:BuildCtx,
    usedPaths:PathUsage[]=[]):Promise<PathUsage[]>
{
    const stats=await fs.stat(rPath);
    if(stats.isDirectory()){
        const files=await fs.readdir(rPath);

        await Promise.all(files.map(f=>replaceAsync(Path.join(rPath,f),paths,options,ctx,usedPaths)));
    }else{
        await replaceFileAsync(rPath,paths,usedPaths,options,ctx);
    }

    return usedPaths;
}

async function replaceFileAsync(
    path:string,
    paths:Paths,
    usedPaths:PathUsage[],
    options:PathicBuildOptions,
    ctx:BuildCtx)
{
    if(!path.toLowerCase().endsWith('.js')){
        return;
    }
    const content=(await fs.readFile(path)).toString();

    let changed=false;
    const replaced=content.replace(
        /\W(require\(\s*['"])([^'"]+)(['"]\s*\))/g,
        (match,start,requirePath,end)=>
    {
        if(paths[requirePath]){
            const fullPath=paths[requirePath][0];
            if(!usedPaths.some(p=>p.name===requirePath)){
                usedPaths.push({
                    name:requirePath,
                    path:fullPath
                })
            }
            changed=true;
            if(options.replacePaths){
                const target=path;
                const newPath=
                    Array<string>(strCount(target.substring(ctx.outDir.length),'/')-1)
                    .fill('..').join('/')+
                    fullPath.substring(ctx.rootDir.length);
                return start+newPath+end;
            }else{
                return match;
            }
        }else{
            return match;
        }
    });

    if(changed){
        await fs.writeFile(path,replaced);
    }
    
}

function getPaths(configs:TsConfigRef[]):Paths
{
    const paths:Paths={};

    for(const config of configs){
        const co=config.config.compilerOptions;
        if(!co?.paths || !config.baseUrl){
            continue;
        }


        for(const name in co.paths){
            if(!paths[name]){
                paths[name]=[];
            }
            for(const p of co.paths[name]){
                paths[name].push(Path.join(config.baseUrl,p))
            }
        }
    }

    return paths;
}

async function loadConfigsAsync(path:string, configs:TsConfigRef[]=[]):Promise<TsConfigRef[]>
{
    if(!path.toLowerCase().endsWith('.json')){
        path+='.json';
    }
    path=Path.resolve(path);
    const dir=Path.dirname(path);

    const config:TsConfig=JSON5.parse((await fs.readFile(path)).toString());

    configs.push({
        path,
        dir,
        ourDir:config.compilerOptions?.outDir?
            Path.join(dir,config.compilerOptions.outDir):undefined,
        baseUrl:config.compilerOptions?.baseUrl?
            Path.join(dir,config.compilerOptions.baseUrl):undefined,
        rootDir:config.compilerOptions?.rootDir?
            Path.join(dir,config.compilerOptions.rootDir):undefined,
        config
    });

    if(config.extends){
        await loadConfigsAsync(Path.join(Path.dirname(path),config.extends),configs);
    }

    return configs;
}

async function tscAsync(config:TsConfigRef, options:PathicBuildOptions)
{
    const outDir=config.config.compilerOptions?.outDir;
    if(!outDir){
        throw new Error(`tsconfig.compilerOptions.outDir required. ${config.path}`)
    }
    const cwd=process.cwd();
    try{

        process.chdir(config.dir);

        if(options.rmOut){
            await fs.rm(outDir,{recursive:true,force:true});
        }

        await cmd(`tsc --project ${config.path}`);

    }finally{
        process.chdir(cwd);
    }
}

function strCount(str:string,char:string)
{
    let c=0;
    for(let i=0;i<str.length;i++){
        if(str[i]===char){
            c++;
        }
    }
    return c;
}