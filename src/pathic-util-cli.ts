#!/usr/bin/env node

import commandLineArgs from 'command-line-args';
import { defaultPathicUtilOptions, PathicUtilOptions } from './pathic-types';
import { pathicBatchBuildAsync } from './pathic-util';

const options:PathicUtilOptions=commandLineArgs([

    {name:'batchBuild',type:String,alias:'b',defaultValue:defaultPathicUtilOptions.batchBuild},
    {name:'batchBuildNpmScript',type:String,alias:'s',defaultValue:defaultPathicUtilOptions.batchBuildNpmScript},
    {name:'batchBuildCommand',type:String,alias:'c',defaultValue:defaultPathicUtilOptions.batchBuildCommand},
    {name:'batchInstall',type:Boolean,alias:'i',defaultValue:defaultPathicUtilOptions.batchInstall},
    
]) as any;

async function main()
{
    if(options.batchBuild){
        await pathicBatchBuildAsync(options);
    }
}

main().then(()=>{

}).catch(r=>{
    console.error('pathic failed',r);
    process.exitCode=1;
})