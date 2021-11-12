# vscode-dts

CLI utility for downloading vscode.d.ts and vscode.proposed.d.ts

## Usage

```bash
 ~ > npx vscode-dts
vscode-dts: CLI utility for downloading vscode.d.ts and vscode.proposed.<proposal>.d.ts

Usage:
  - npx vscode-dts dev                          Download vscode.proposaled.<proposal>.d.ts files
  - npx vscode-dts dev <git-tag | git-branch>   Download vscode.proposaled.<proposal>.d.ts files from git tag/branch of microsoft/vscode
  - npx vscode-dts <git-tag | git-branch>       Download vscode.d.ts from git tag/branch of microsoft/vscode
  - npx vscode-dts <git-tag | git-branch> -f    Download vscode.d.ts and remove conflicting types in node_modules/@types/vscode
  - npx vscode-dts                              Print Help
  - npx vscode-dts -h                           Print Help
  - npx vscode-dts --help                       Print Help
```

## License

[MIT](LICENSE)

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
