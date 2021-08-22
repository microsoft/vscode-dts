#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var https_1 = __importDefault(require("https"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var os_1 = __importDefault(require("os"));
var prompts_1 = __importDefault(require("prompts"));
var minimist_1 = __importDefault(require("minimist"));
var rimraf_1 = __importDefault(require("rimraf"));
var argv = minimist_1["default"](process.argv.slice(2));
if (argv._.length === 0 || argv['h'] || argv['help']) {
    console.log(getHelpMessage());
}
else if (argv._[0] === 'dev') {
    handleDev(argv._[1]);
}
else if (argv._[0]) {
    handleDefaultDownload(argv._[0], argv['f']);
}
function handleDev(gitTagOrBranch) {
    var url = gitTagOrBranch
        ? "https://raw.githubusercontent.com/microsoft/vscode/" + gitTagOrBranch + "/src/vs/vscode.proposed.d.ts"
        : 'https://raw.githubusercontent.com/microsoft/vscode/main/src/vs/vscode.proposed.d.ts';
    var outPath = path_1["default"].resolve(process.cwd(), './vscode.proposed.d.ts');
    console.log("Downloading vscode.proposed.d.ts\nTo:   " + outPath + "\nFrom: " + url);
    download(url, outPath).then(function () {
        if (!isProposedApiEnabled()) {
            console.log("Please set " + toRedString("\"enableProposedApi\": true") + " in package.json.");
        }
        console.log('Read more about proposed API at: https://code.visualstudio.com/api/advanced-topics/using-proposed-api');
    });
}
function isProposedApiEnabled() {
    try {
        var packageJsonPath = path_1["default"].resolve(process.cwd(), './package.json');
        var packageJson = JSON.parse(fs_1["default"].readFileSync(packageJsonPath, 'utf-8'));
        return !!packageJson.enableProposedApi;
    }
    catch (_a) {
        return false;
    }
}
function handleDefaultDownload(gitTagOrBranch, force) {
    // handle master->main rename for old consumers
    if (gitTagOrBranch === 'master') {
        gitTagOrBranch = 'main';
    }
    var url = "https://raw.githubusercontent.com/microsoft/vscode/" + gitTagOrBranch + "/src/vs/vscode.d.ts";
    var outPath = path_1["default"].resolve(process.cwd(), './vscode.d.ts');
    console.log("Downloading vscode.d.ts\nTo:   " + outPath + "\nFrom: " + url);
    download(url, outPath).then(function () {
        if (force) {
            forceRemoveNodeModulesTypes();
        }
        else {
            removeNodeModulesTypes();
        }
    });
}
function getHelpMessage() {
    return [
        'vscode-dts: CLI utility for downloading vscode.d.ts and vscode.proposed.d.ts',
        '',
        'Usage:',
        '  - npx vscode-dts dev                          Download vscode.proposed.d.ts',
        '  - npx vscode-dts dev <git-tag | git-branch>   Download vscode.proposed.d.ts from git tag/branch of microsoft/vscode',
        '  - npx vscode-dts <git-tag | git-branch>       Download vscode.d.ts from git tag/branch of microsoft/vscode',
        '  - npx vscode-dts <git-tag | git-branch> -f    Download vscode.d.ts and remove conflicting types in node_modules/@types/vscode',
        '  - npx vscode-dts                              Print Help',
        '  - npx vscode-dts -h                           Print Help',
        '  - npx vscode-dts --help                       Print Help',
    ].join(os_1["default"].EOL);
}
function download(url, outPath) {
    return new Promise(function (resolve, reject) {
        https_1["default"].get(url, function (res) {
            if (res.statusCode !== 200) {
                reject("Failed to get " + url);
                return;
            }
            var outStream = fs_1["default"].createWriteStream(outPath);
            outStream.on('close', function () {
                resolve();
            });
            res.pipe(outStream);
        });
    });
}
function forceRemoveNodeModulesTypes() {
    if (fs_1["default"].existsSync('node_modules/vscode/vscode.d.ts')) {
        fs_1["default"].unlinkSync('node_modules/vscode/vscode.d.ts');
        console.log('Removed node_modules/vscode/vscode.d.ts');
    }
    else if (fs_1["default"].existsSync('node_modules/@types/vscode/index.d.ts')) {
        rimraf_1["default"]('node_modules/@types/vscode', function (err) {
            if (err) {
                console.error('Failed to remove node_modules/@types/vscode');
                console.error(err);
            }
            else {
                console.log('Removed node_modules/@types/vscode');
            }
        });
    }
}
function removeNodeModulesTypes() {
    if (fs_1["default"].existsSync('node_modules/vscode/vscode.d.ts')) {
        prompts_1["default"]({
            type: 'confirm',
            name: 'value',
            message: 'Remove conflicting vscode typing at node_modules/vscode/vscode.d.ts?'
        }).then(function (res) {
            if (res.value) {
                fs_1["default"].unlinkSync('node_modules/vscode/vscode.d.ts');
                console.log('Removed node_modules/vscode/vscode.d.ts');
            }
        });
    }
    else if (fs_1["default"].existsSync('node_modules/@types/vscode/index.d.ts')) {
        prompts_1["default"]({
            type: 'confirm',
            name: 'value',
            message: 'Remove conflicting vscode typing at node_modules/@types/vscode?'
        }).then(function (res) {
            if (res.value) {
                rimraf_1["default"]('node_modules/@types/vscode', function (err) {
                    if (err) {
                        console.error('Failed to remove node_modules/@types/vscode');
                        console.error(err);
                    }
                    else {
                        console.log('Removed node_modules/@types/vscode');
                    }
                });
            }
        });
    }
}
function toRedString(s) {
    return "\u001B[31m" + s + "\u001B[0m";
}
