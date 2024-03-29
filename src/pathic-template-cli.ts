#!/usr/bin/env node

import commandLineArgs from 'command-line-args';
import { pathicTemplateAsync } from './pathic-template';
import { defaultPathicTemplateOptions, PathicTemplateOptions } from './pathic-types';

const options:PathicTemplateOptions=commandLineArgs([

    {name:'templateTarget',type:String,alias:'t',defaultValue:defaultPathicTemplateOptions.templateTarget},
    {name:'packageName',type:String,alias:'n',defaultValue:defaultPathicTemplateOptions.packageName},
    {name:'autoTsConfigExtends',type:Boolean,alias:'a',defaultValue:defaultPathicTemplateOptions.autoTsConfigExtends},
    {name:'lib',type:Boolean,alias:'l',defaultValue:defaultPathicTemplateOptions.lib},
    {name:'verbose',type:Boolean,alias:'v',defaultValue:defaultPathicTemplateOptions.verbose},
    
]) as any;

pathicTemplateAsync(options).then(()=>{

}).catch(r=>{
    console.error('pathic failed',r);
    process.exitCode=1;
})