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
    if (gitTagOrBranch === void 0) { gitTagOrBranch = 'main'; }
    var proposalNames = getEnabledApiProposals();
    if (proposalNames.length === 0) {
        console.error("No proposals in the \"enabledApiProposals\"-property of package.json found.");
        return;
    }
    for (var _i = 0, proposalNames_1 = proposalNames; _i < proposalNames_1.length; _i++) {
        var name_1 = proposalNames_1[_i];
        var url = "https://raw.githubusercontent.com/microsoft/vscode/" + gitTagOrBranch + "/src/vscode-dts/vscode.proposed." + name_1 + ".d.ts";
        var outPath = path_1["default"].resolve(process.cwd(), "./vscode.proposed." + name_1 + ".d.ts");
        console.log("Downloading vscode.proposed." + toGreenString(name_1) + ".d.ts\nTo:   " + outPath + "\nFrom: " + url);
        download(url, outPath)["catch"](function (err) { return console.error(err); });
    }
    console.log('Read more about proposed API at: https://code.visualstudio.com/api/advanced-topics/using-proposed-api');
}
function getEnabledApiProposals() {
    var dir = process.cwd();
    while (true) {
        var packageJsonPath = path_1["default"].resolve(dir, './package.json');
        try {
            var packageJson = JSON.parse(fs_1["default"].readFileSync(packageJsonPath, 'utf-8'));
            return Array.isArray(packageJson.enabledApiProposals) ? packageJson.enabledApiProposals : [];
        }
        catch (_a) {
            // continue
        }
        var next = path_1["default"].dirname(dir);
        if (next === dir) {
            return [];
        }
        else {
            dir = next;
        }
    }
}
function handleDefaultDownload(gitTagOrBranch, force) {
    // handle master->main rename for old consumers
    if (gitTagOrBranch === 'master') {
        gitTagOrBranch = 'main';
    }
    var url = "https://raw.githubusercontent.com/microsoft/vscode/" + gitTagOrBranch + "/src/vscode-dts/vscode.d.ts";
    var legacyUrl = "https://raw.githubusercontent.com/microsoft/vscode/" + gitTagOrBranch + "/src/vs/vscode.d.ts";
    var outPath = path_1["default"].resolve(process.cwd(), './vscode.d.ts');
    console.log("Downloading vscode.d.ts\nTo:   " + outPath + "\nFrom: " + url);
    download(url, outPath)["catch"](function () { return download(legacyUrl, outPath); }).then(function () {
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
        'vscode-dts: CLI utility for downloading vscode.d.ts and vscode.proposed.<proposal>.d.ts',
        '',
        'Usage:',
        '  - npx vscode-dts dev                          Download vscode.proposaled.<proposal>.d.ts files',
        '  - npx vscode-dts dev <git-tag | git-branch>   Download vscode.proposaled.<proposal>.d.ts files from git tag/branch of microsoft/vscode',
        '  - npx vscode-dts <git-tag | git-branch>       Download vscode.d.ts from git tag/branch of microsoft/vscode',
        '  - npx vscode-dts <git-tag | git-branch> -f    Download vscode.d.ts and remove conflicting types in node_modules/@types/vscode',
        '  - npx vscode-dts                              Print Help',
        '  - npx vscode-dts -h                           Print Help',
        '  - npx vscode-dts --help                       Print Help'
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
function toGreenString(s) {
    return "\u001B[32m" + s + "\u001B[0m";
}
