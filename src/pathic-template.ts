import JSON5 from 'json5';
import { promises as fs } from "node:fs";
import Path from 'node:path';
import { cmd, existsAsync, findProjectRootAsync, TsConfig, verbose } from "./common";
import { PathicTemplateOptions } from "./pathic-types";

export async function pathicTemplateAsync(options:PathicTemplateOptions)
{
    if(options.verbose){
        verbose(true);
    }
    if(!options.templateTarget){
        throw new Error('options.templateTarget required');
    }
    const targetDir=Path.resolve(options.templateTarget);

    if(await existsAsync(targetDir)){
        throw new Error(`${targetDir} already exists`);
    }
    await fs.mkdir(targetDir,{recursive:true});

    const packageName=options.packageName||Path.basename(targetDir);
    const nParts=packageName.split('/');
    const pFileName=nParts[nParts.length-1];

    const cwd=process.cwd();
    try{

        process.chdir(targetDir);

        const promises:Promise<any>[]=[];

        const tsConfig=await getTsConfigAsync(targetDir,options.autoTsConfigExtends);
        promises.push(fs.writeFile('tsconfig.json',JSON.stringify(tsConfig,null,4)));
        const monoRoot=tsConfig.extends?Path.resolve(Path.dirname(tsConfig.extends)):targetDir;

        if(options.lib && tsConfig.extends){
            promises.push(addAsLibAsync(
                packageName,
                Path.relative(
                    Path.resolve(Path.dirname(tsConfig.extends)),
                    Path.resolve('index')),
                tsConfig.extends));
        }

        const packageJson=await getPackageJsonAsync(packageName,pFileName,targetDir,monoRoot);
        promises.push(fs.writeFile('package.json',JSON.stringify(packageJson,null,4)));

        promises.push(fs.writeFile('index.ts',`export * from './${pFileName}';\n`));
        promises.push(fs.writeFile(`${pFileName}.ts`,`export const packageName='${packageName}';\n`));
        promises.push(fs.writeFile(`.gitignore`,'node_modules/\ndist/\n'));

        await Promise.all(promises);

        await cmd('npm install @types/node typescript @iyio/pathic --save-dev');

        // tmp - move to templating system
        await cmd('npm install @types/aws-lambda @types/aws-sdk --save-dev');
        
        
    }finally{
        process.chdir(cwd);
    }
}

async function addAsLibAsync(packageName:string,path:string,rootTsConfig:string)
{
    const config:TsConfig=JSON5.parse((await fs.readFile(rootTsConfig)).toString());
    if(!config.compilerOptions){
        config.compilerOptions={};
    }
    if(!config.compilerOptions.paths){
        config.compilerOptions.paths={}
    }
    config.compilerOptions.paths[packageName]=[path];
    await fs.writeFile(rootTsConfig,JSON.stringify(config,null,4));
}

async function getPackageJsonAsync(projectName:string,pFileName:string,targetDir:string,monoRoot:string)
{

    const json:any={
        name: projectName,
        version:"0.0.1",
        description:"",
        main:'dist/'+Path.relative(monoRoot,Path.join(targetDir,'index.js')),
        types:'dist/'+Path.relative(monoRoot,Path.join(targetDir,'index.d.ts')),
        files:[
            "dist"
        ],
        scripts:{
            build:"pathic-build",
            "build-publish":"pathic-build && npm publish"
        },
        keywords:[],
        author:"",
        license:"",
    }

    
    
    const gitRemote=await cmd('git remote -v',false,true);
    const remoteMatch=/origin\s+(\S+)/.exec(gitRemote);
    if(remoteMatch){
        json.repository={
            type:'git',
            url:remoteMatch[1]
        }
    }

    return json;
}


async function getTsConfigAsync(targetDir:string, autoExtend:boolean):Promise<TsConfig>
{

    let ext:string|undefined;
    if(autoExtend){
        try{
            const root=await findProjectRootAsync(targetDir,targetDir,'tsconfig.json');
            if(root){
                const rootTs=Path.join(root,'tsconfig.json');
                ext=Path.relative(targetDir,rootTs);
            }
        }catch{}
    }

    return {
        "extends": ext,
        "compilerOptions": {
            "target": "ES2018" as any,
            "module": "commonjs" as any,
            "lib": [
                "es2018"
            ],
            "declaration": true,
            "strict": true,
            "noImplicitAny": true,
            "strictNullChecks": true,
            "noImplicitThis": true,
            "alwaysStrict": true,
            "noUnusedLocals": false,
            "noUnusedParameters": false,
            "noImplicitReturns": true,
            "noFallthroughCasesInSwitch": false,
            "inlineSourceMap": true,
            "inlineSources": true,
            "experimentalDecorators": true,
            "strictPropertyInitialization": false,
            "typeRoots": [
                "./node_modules/@types"
            ],
            "outDir": "./dist"
        },
        "exclude": [
            "node_modules",
            "dist",
        ]
    }
}