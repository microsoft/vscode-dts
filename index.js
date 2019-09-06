#!/usr/bin/env node
var https = require('https');
var fs = require('fs');
var path = require('path');
var os = require('os');
var prompts = require('prompts');
var realArgs = process.argv.slice(2);
if (realArgs.length === 0 || realArgs[0] === '-h' || realArgs[0] === '--help') {
    console.log(getHelpMessage());
}
else if (realArgs[0] === 'dev') {
    handleDev(realArgs[1]);
}
else if (realArgs[0]) {
    handleDefaultDownload(realArgs[0]);
}
function handleDev(gitTagOrBranch) {
    var url = gitTagOrBranch
        ? "https://raw.githubusercontent.com/microsoft/vscode/" + gitTagOrBranch + "/src/vs/vscode.proposed.d.ts"
        : 'https://raw.githubusercontent.com/microsoft/vscode/master/src/vs/vscode.proposed.d.ts';
    var outPath = path.resolve(process.cwd(), './vscode.proposed.d.ts');
    console.log("Downloading vscode.proposed.d.ts to " + outPath);
    download(url, outPath).then(function () {
        console.log("Please set " + toRedString("\"enableProposedApi\": true") + " in package.json.");
        console.log('Read more about proposed API at: https://code.visualstudio.com/api/advanced-topics/using-proposed-api');
    });
}
function handleDefaultDownload(gitTagOrBranch) {
    var url = "https://raw.githubusercontent.com/microsoft/vscode/" + gitTagOrBranch + "/src/vs/vscode.d.ts";
    var outPath = path.resolve(process.cwd(), './vscode.d.ts');
    console.log("Downloading vscode.d.ts to " + outPath + " from " + url);
    download(url, outPath).then(function () {
        removeNodeModulesTypes();
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
        '  - npx vscode-dts                              Print Help',
        '  - npx vscode-dts -h                           Print Help',
        '  - npx vscode-dts --help                       Print Help'
    ].join(os.EOL);
}
function download(url, outPath) {
    return new Promise(function (resolve, reject) {
        https.get(url, function (res) {
            if (res.statusCode !== 200) {
                reject("Failed to get " + url);
                return;
            }
            var outStream = fs.createWriteStream(outPath);
            outStream.on('close', function () {
                resolve();
            });
            res.pipe(outStream);
        });
    });
}
function removeNodeModulesTypes() {
    if (fs.existsSync('node_modules/vscode/vscode.d.ts')) {
        prompts({
            type: 'confirm',
            name: 'value',
            message: 'Remove conflicting vscode typing at node_modules/vscode/vscode.d.ts?'
        }).then(function (res) {
            if (res.value) {
                fs.unlinkSync('node_modules/vscode/vscode.d.ts');
                console.log('Removed node_modules/vscode/vscode.d.ts');
            }
        });
    }
    else if (fs.existsSync('node_modules/@types/vscode/index.d.ts')) {
        prompts({
            type: 'confirm',
            name: 'value',
            message: 'Remove conflicting vscode typing at node_modules/@types/vscode/index.d.ts?'
        }).then(function (res) {
            if (res.value) {
                fs.unlinkSync('node_modules/@types/vscode/index.d.ts');
                console.log('Removed node_modules/@types/vscode/index.d.ts');
            }
        });
    }
}
function toRedString(s) {
    return "\u001B[31m" + s + "\u001B[0m";
}
