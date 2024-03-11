#!/usr/bin/env node

import https from 'https'
import fs from 'fs'
import path from 'path'
import os from 'os'
import prompts from 'prompts'
import minimist from 'minimist'
import { HttpsProxyAgent } from 'https-proxy-agent'
import * as url from "url"

const argv = minimist(process.argv.slice(2))

if (argv._.length === 0 || argv['h'] || argv['help']) {
  console.log(getHelpMessage())
} else if (argv._[0] === 'dev') {
  handleDev(argv._[1])
} else if (argv._[0]) {
  handleDefaultDownload(argv._[0], argv['f'])
}

function handleDev(gitTagOrBranch: string = 'main') {

  const proposalNames = getEnabledApiProposals();
  if (proposalNames.length === 0) {
    console.error(`No proposals in the "enabledApiProposals"-property of package.json found.`)
    return;
  }

  for (const name of proposalNames) {
    const url = `https://raw.githubusercontent.com/microsoft/vscode/${gitTagOrBranch}/src/vscode-dts/vscode.proposed.${name}.d.ts`
    const outPath = path.resolve(process.cwd(), `./vscode.proposed.${name}.d.ts`)
    console.log(`Downloading vscode.proposed.${toGreenString(name)}.d.ts\nTo:   ${outPath}\nFrom: ${url}`)

    download(url, outPath).catch(err => console.error(err))
  }

  console.log('Read more about proposed API at: https://code.visualstudio.com/api/advanced-topics/using-proposed-api')
}

function getEnabledApiProposals(): string[] {
  let dir = process.cwd();
  while (true) {
    const packageJsonPath = path.resolve(dir, './package.json');
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
      return Array.isArray(packageJson.enabledApiProposals) ? packageJson.enabledApiProposals : []
    } catch {
      // continue
    }

    const next = path.dirname(dir);
    if (next === dir) {
      return [];
    } else {
      dir = next;
    }
  }
}

function handleDefaultDownload(gitTagOrBranch: string, force?: boolean) {
  // handle master->main rename for old consumers
  if (gitTagOrBranch === 'master') {
    gitTagOrBranch = 'main'
  }

  const url = `https://raw.githubusercontent.com/microsoft/vscode/${gitTagOrBranch}/src/vscode-dts/vscode.d.ts`
  const legacyUrl = `https://raw.githubusercontent.com/microsoft/vscode/${gitTagOrBranch}/src/vs/vscode.d.ts`
  const outPath = path.resolve(process.cwd(), './vscode.d.ts')
  console.log(`Downloading vscode.d.ts\nTo:   ${outPath}\nFrom: ${url}`)

  download(url, outPath).catch(() => download(legacyUrl, outPath)).then(() => {
    if (force) {
      forceRemoveNodeModulesTypes()
    } else {
      removeNodeModulesTypes()
    }
  })
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
  ].join(os.EOL)
}

function download(link: string, outPath: string) {

  return new Promise<void>((resolve, reject) => {

    const options: https.RequestOptions = url.parse(link);

    const httpsProxy =
      process.env.https_proxy || process.env.HTTPS_PROXY || process.env.all_proxy || process.env.ALL_PROXY

    if (httpsProxy) {
      options.agent = new HttpsProxyAgent(httpsProxy);
    }

    https.get(options, (res) => {
      if (res.statusCode !== 200) {
        reject(`Failed to get ${link}`)
        return
      }

      const outStream = fs.createWriteStream(outPath)
      outStream.on('close', () => {
        resolve()
      })

      res.pipe(outStream)
    });
  })
}

function forceRemoveNodeModulesTypes() {
  if (fs.existsSync('node_modules/vscode/vscode.d.ts')) {
    fs.unlinkSync('node_modules/vscode/vscode.d.ts')
    console.log('Removed node_modules/vscode/vscode.d.ts')
  } else if (fs.existsSync('node_modules/@types/vscode/index.d.ts')) {
    fs.rm('node_modules/@types/vscode', { force: true, recursive: true }, err => {
      if (err) {
        console.error('Failed to remove node_modules/@types/vscode')
        console.error(err)
      } else {
        console.log('Removed node_modules/@types/vscode')
      }
    })
  }
}

function removeNodeModulesTypes() {
  if (fs.existsSync('node_modules/vscode/vscode.d.ts')) {
    prompts({
      type: 'confirm',
      name: 'value',
      message: 'Remove conflicting vscode typing at node_modules/vscode/vscode.d.ts?'
    }).then(res => {
      if (res.value) {
        fs.unlinkSync('node_modules/vscode/vscode.d.ts')
        console.log('Removed node_modules/vscode/vscode.d.ts')
      }
    })
  } else if (fs.existsSync('node_modules/@types/vscode/index.d.ts')) {
    prompts({
      type: 'confirm',
      name: 'value',
      message: 'Remove conflicting vscode typing at node_modules/@types/vscode?'
    }).then(res => {
      if (res.value) {
        fs.rm('node_modules/@types/vscode', { force: true, recursive: true }, err => {
          if (err) {
            console.error('Failed to remove node_modules/@types/vscode')
            console.error(err)
          } else {
            console.log('Removed node_modules/@types/vscode')
          }
        })
      }
    })
  }
}

function toRedString(s: string) {
  return `\x1b[31m${s}\x1b[0m`
}

function toGreenString(s: string) {
  return `\x1b[32m${s}\x1b[0m`
}
