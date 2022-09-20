#!/usr/bin/env node

import commandLineArgs from 'command-line-args';
import { defaultPathicUtilOptions, PathicUtilOptions } from './pathic-types';
import { pathicBatchBuildAsync } from './pathic-util';

const options:PathicUtilOptions=commandLineArgs([

    {name:'batchBuild',type:String,alias:'b',defaultValue:defaultPathicUtilOptions.batchBuild},
    {name:'batchBuildNpmScript',type:String,alias:'s',defaultValue:''},
    {name:'batchBuildCommand',type:String,alias:'c',defaultValue:defaultPathicUtilOptions.batchBuildCommand},
    {name:'batchInstall',type:Boolean,alias:'i',defaultValue:defaultPathicUtilOptions.batchInstall},
    {name:'exclude',type:Boolean,alias:'e',defaultValue:defaultPathicUtilOptions.exclude},
    {name:'includeIgnored',type:Boolean,alias:'g',defaultValue:defaultPathicUtilOptions.includeIgnored},
    {name:'batchUninstall',type:Boolean,alias:'u',defaultValue:defaultPathicUtilOptions.batchUninstall},
    {name:'verbose',type:Boolean,alias:'v',defaultValue:defaultPathicUtilOptions.verbose},
    
]) as any;

async function main()
{
    if(options.batchBuild || options.batchInstall || options.batchUninstall){
        
        if( !options.batchInstall &&
            !options.batchUninstall &&
            !options.batchBuildNpmScript &&
            !options.batchBuildCommand)
        {
            options.batchBuildNpmScript=defaultPathicUtilOptions.batchBuildNpmScript;
        }

        await pathicBatchBuildAsync(options);
    }
}

main().then(()=>{

}).catch(r=>{
    console.error('pathic failed',r);
    process.exitCode=1;
})