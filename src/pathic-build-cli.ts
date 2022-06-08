#!/usr/bin/env node

import commandLineArgs from 'command-line-args';
import { pathicBuildAsync } from './pathic-build';
import { defaultPathicBuildOptions, PathicBuildOptions } from './pathic-types';

const options:PathicBuildOptions=commandLineArgs([
    
    {name:'buildConfig',type:String,alias:'b',defaultValue:defaultPathicBuildOptions.buildConfig},
    {name:'build',type:Boolean,alias:'w',defaultValue:defaultPathicBuildOptions.build},
    {name:'rmOut',type:Boolean,alias:'r',defaultValue:defaultPathicBuildOptions.rmOut},
    {name:'replacePaths',type:Boolean,alias:'p',defaultValue:defaultPathicBuildOptions.replacePaths},
    {name:'installNodeModules',type:Boolean,alias:'i',defaultValue:defaultPathicBuildOptions.installNodeModules},
    {name:'installDevDeps',type:Boolean,alias:'d',defaultValue:defaultPathicBuildOptions.installDevDeps},
    {name:'installPathModules',type:Boolean,alias:'m',defaultValue:defaultPathicBuildOptions.installPathModules},
    {name:'copyBin',type:Boolean,alias:'k',defaultValue:defaultPathicBuildOptions.copyBin},
    {name:'extraProjects',type:String,alias:'x',defaultValue:defaultPathicBuildOptions.extraProjects},
    
]) as any;

pathicBuildAsync(options).then(()=>{

}).catch(r=>{
    console.error('pathic failed',r);
    process.exitCode=1;
})