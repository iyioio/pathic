export interface PathicBuildOptions
{
    /**
     * Path to a tsconfig.json file
     * @default 'tsconfig.json'
     * @alias b
     */
    buildConfig:string;

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

    /**
     * A comma separated list of extra project paths to install node modules for.
     * @alias x
     */
    extraProjects?:string;

    /**
     * Verbose output
     * @alias v
     */
    verbose?:boolean;
}

export const defaultPathicBuildOptions:Readonly<PathicBuildOptions>=Object.freeze({
    buildConfig:'tsconfig.json',
    build:true,
    rmOut:true,
    replacePaths:true,
    installNodeModules:true,
    installDevDeps:false,
    installPathModules:true,
    copyBin:true,
});

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

    /**
     * If true the project will be setup as a library
     * @default false
     * @alias l
     */
    lib:boolean;

    /**
     * Verbose output
     * @alias v
     */
    verbose?:boolean;
}

export const defaultPathicTemplateOptions:Readonly<PathicTemplateOptions>=Object.freeze({
    autoTsConfigExtends:true,
    lib:false,
});

export interface PathicUtilOptions
{
    /**
     * Path to a directory that contains projects to build. The directory will be searched
     * recursively for directories containing a package.json
     * @alias b
     */
    batchBuild?:string;

    /**
     * If true the batchBuild will only install deps and not run the build command.
     * @alias i
     */
    batchInstall?:boolean;

    /**
     * The npm script used to build batch built project. If a project is found that has a matching
     * script the project is built.
     * @default 'build'
     * @alias s
     */
    batchBuildNpmScript?:string;

    /**
     * Overrides the build command used for batch builds
     * @alias c
     */
    batchBuildCommand?:string;

    /**
     * Verbose output
     * @alias v
     */
    verbose?:boolean;

    /**
     * Comma separated list of filenames and directory names to exclude. Excluded values are not
     * paths so slash characters can not be used.
     * @default value 'node_modules,.git'
     * @alias e
     */
    exclude?:string;

    /**
     * If true files and directories ignored by git will be included.
     * @default false
     * @alias g
     */
    includeIgnored?:boolean;

    /**
     * If true node_modules will be removed
     * @default false
     * @alias u
     */
    batchUninstall?:boolean;
}

export const defaultPathicUtilOptions:Readonly<PathicUtilOptions>=Object.freeze({
    exclude:'node_modules,.git',
    includeIgnored:false,
    removeNodeModules:false,
});

export interface PathicWatchOptions
{
    /**
     * Source directory to watch
     * @alias s
     */
    sourceDir?:string;

    /**
     * Destination directories to copy to
     * @alias d
     */
    destDirs?:string[];

    /**
     * Filters by extension
     * @alias e
     */
    extensions?:string[];

    /**
     * A banner message added to the top of copied file
     * @alias b
     */
    banner?:string;

    /**
     * If true files are only synced once then pathic-watch exists
     * @alias x
     */
    sync?:boolean;

    /**
     * Verbose output
     * @alias v
     */
    verbose?:boolean;
}

export const defaultPathicWatchOptions:Readonly<PathicWatchOptions>=Object.freeze({
});