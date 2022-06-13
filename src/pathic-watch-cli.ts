#!/usr/bin/env node

import commandLineArgs from 'command-line-args';
import { defaultPathicWatchOptions, PathicWatchOptions } from './pathic-types';
import { pathicWatchAsync } from './pathic-watch';

const options:PathicWatchOptions=commandLineArgs([

    {name:'sourceDir',type:String,alias:'s',defaultValue:defaultPathicWatchOptions.sourceDir},
    {name:'destDirs',type:String,alias:'d',defaultValue:defaultPathicWatchOptions.destDirs,multiple:true},
    {name:'extensions',type:String,alias:'e',defaultValue:defaultPathicWatchOptions.extensions,multiple:true},
    {name:'banner',type:String,alias:'b',defaultValue:defaultPathicWatchOptions.banner},
    {name:'sync',type:Boolean,alias:'x',defaultValue:defaultPathicWatchOptions.sync},
    
]) as any;

async function main()
{
    await pathicWatchAsync(options);
}

main().then(()=>{

}).catch(r=>{
    console.error('pathic failed',r);
    process.exitCode=1;
})