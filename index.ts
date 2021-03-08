#!/usr/bin/env node

import https from 'https'
import fs from 'fs'
import path from 'path'
import os from 'os'
import prompts from 'prompts'
import minimist from 'minimist'
import rimraf from 'rimraf'

const argv = minimist(process.argv.slice(2))

if (argv._.length === 0 || argv['h'] || argv['help']) {
  console.log(getHelpMessage())
} else if (argv._[0] === 'dev') {
  handleDev(argv._[1])
} else if (argv._[0]) {
  handleDefaultDownload(argv._[0], argv['f'])
}

function handleDev(gitTagOrBranch?: string) {
  const url = gitTagOrBranch
    ? `https://raw.githubusercontent.com/microsoft/vscode/${gitTagOrBranch}/src/vs/vscode.proposed.d.ts`
    : 'https://raw.githubusercontent.com/microsoft/vscode/main/src/vs/vscode.proposed.d.ts'
  const outPath = path.resolve(process.cwd(), './vscode.proposed.d.ts')
  console.log(`Downloading vscode.proposed.d.ts\nTo:   ${outPath}\nFrom: ${url}`)

  download(url, outPath).then(() => {
    console.log(`Please set ${toRedString(`"enableProposedApi": true`)} in package.json.`)
    console.log('Read more about proposed API at: https://code.visualstudio.com/api/advanced-topics/using-proposed-api')
  })
}

function handleDefaultDownload(gitTagOrBranch: string, force?: boolean) {
  // handle master->main rename for old consumers
  if (gitTagOrBranch === 'master') {
    gitTagOrBranch = 'main';
  }

  const url = `https://raw.githubusercontent.com/microsoft/vscode/${gitTagOrBranch}/src/vs/vscode.d.ts`
  const outPath = path.resolve(process.cwd(), './vscode.d.ts')
  console.log(`Downloading vscode.d.ts\nTo:   ${outPath}\nFrom: ${url}`)

  download(url, outPath).then(() => {
    if (force) {
      forceRemoveNodeModulesTypes()
    } else {
      removeNodeModulesTypes()
    }
  })
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
    '  - npx vscode-dts --help                       Print Help'
  ].join(os.EOL)
}

function download(url, outPath) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode !== 200) {
        reject(`Failed to get ${url}`)
        return
      }

      const outStream = fs.createWriteStream(outPath)
      outStream.on('close', () => {
        resolve()
      })

      res.pipe(outStream)
    })
  })
}

function forceRemoveNodeModulesTypes() {
  if (fs.existsSync('node_modules/vscode/vscode.d.ts')) {
    fs.unlinkSync('node_modules/vscode/vscode.d.ts')
    console.log('Removed node_modules/vscode/vscode.d.ts')
  } else if (fs.existsSync('node_modules/@types/vscode/index.d.ts')) {
    rimraf('node_modules/@types/vscode', err => {
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
        rimraf('node_modules/@types/vscode', err => {
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
