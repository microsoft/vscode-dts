#!/usr/bin/env node

const https = require('https')
const fs = require('fs')
const path = require('path')
const os = require('os')

const PROPOSED_DTS_URL = 'https://raw.githubusercontent.com/microsoft/vscode/master/src/vs/vscode.proposed.d.ts'

const realArgs = process.argv.slice(2)

if (realArgs.length === 0 || realArgs[0] === '-h' || realArgs[0] === '--help') {
  console.log(printHelp())
} else if (realArgs[0] === 'dev') {
  const outPath = path.resolve(process.cwd(), './vscode.proposed.d.ts')
  console.log(`Downloading vscode.proposed.d.ts to ${outPath}`)
  download(PROPOSED_DTS_URL, outPath).then(() => {
    console.log('Please set "enableProposedApi": true in package.json.')
    console.log('Read more about proposed API at: https://code.visualstudio.com/api/advanced-topics/using-proposed-api')
  })
} else if (realArgs[0]) {
  const url = `https://raw.githubusercontent.com/microsoft/vscode/${realArgs[0]}/src/vs/vscode.d.ts`
  const outPath = path.resolve(process.cwd(), './vscode.d.ts')
  console.log(`Downloading vscode.d.ts to ${outPath} from ${url}`)
  download(url, outPath)
}

function printHelp() {
  return [
    'vscode-dts: CLI utility for downloading vscode.d.ts and vscode.proposed.d.ts',
    '',
    'Usage:',
    '  - npx vscode-dts dev            Download vscode.proposed.d.ts',
    '  - npx vscode-dts <git-tag>      Download vscode.d.ts from git tag of microsoft/vscode',
    '  - npx vscode-dts <git-branch>   Download vscode.d.ts from git branch of microsoft/vscode',
    '  - npx vscode-dts                Print Help',
    '  - npx vscode-dts -h             Print Help',
    '  - npx vscode-dts --help         Print Help'
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
