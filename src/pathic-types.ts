export interface PathicBuildOptions
{
    /**
     * Path to a tsconfig.json file
     * @default 'tsconfig.json'
     * @alias b
     */
    buildConfig?:string;

    /**
     * If true the tsc command fill be ran
     * @default true
     * @alias w
     */
    build:boolean;

    /**
     * If true the outDir in tsconfig will be removed before building
     * @default true
     * @alias r
     */
    rmOut:boolean;

    /**
     * If true imported paths will be replaced
     * @default true
     * @alias p
     */
    replacePaths:boolean;

    /**
     * If true a node_modules folder will be generated in the output directory. The contents
     * of the node_modules created will be a concatenation of all used modules used in paths.
     * @default true
     * @alias i
     */
    installNodeModules:boolean;

    /**
     * If true and installNodeModules is true devDependencies will be installed
     * @default false
     * @alias d
     */
    installDevDeps:boolean;

    /**
     * If true node_modules of projects referenced in paths will be installed if not present.
     * @default true
     * @alias m
     */
    installPathModules:boolean;

    /**
     * If true node_module bin items will be copied during node modules installation
     * @default true
     * @alias k
     */
    copyBin:boolean;
}

export interface PathicTemplateOptions
{
    /**
     * Target directory where a project will be created using template paramters
     * @alias t
     */
    templateTarget?:string;

    /**
     * Name that will be used
     * @default filename(templateTarget)
     * @alias n
     */
    packageName?:string;

    /**
     * If true the created tsconfig will automatically extend the first found parent tsconfig file.
     * @default true
     * @alias a
     */
    autoTsConfigExtends:boolean;
}

export const defaultPathicBuildOptions:Readonly<PathicBuildOptions>=Object.freeze({
    build:true,
    rmOut:true,
    replacePaths:true,
    installNodeModules:true,
    installDevDeps:false,
    installPathModules:true,
    copyBin:true,
});

export const defaultPathicTemplateOptions:Readonly<PathicTemplateOptions>=Object.freeze({
    autoTsConfigExtends:true
});