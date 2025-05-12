// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
// import rawViewerHtml from "./../assets/out/editor.html";
import path from 'path';
import fs from "fs"
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "jsonvieweditor" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('jsonvieweditor.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from JsonViewEditor!');

		// var pannel = vscode.window.createWebviewPanel("1", "test", vscode.ViewColumn.One)
		// 创建Webview面板
		const panel = vscode.window.createWebviewPanel(
			'jsonEditor', // 视图类型标识
			'JSON Editor', // 面板标题
			vscode.ViewColumn.One, // 显示在编辑器哪个位置
			{
				enableScripts: true, // 启用JavaScript

				// retainContextWhenHidden: true // 保持状态（可选）
			}
		);

		const baseDir = path.join(context.extensionPath, 'assets', 'out');

		// 读取HTML文件内容
		const htmlPath = path.join(baseDir, 'editor.html');
		let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

		// 正则匹配并替换所有script标签的src
		htmlContent = htmlContent.replace(
			/<script\s+.*?src=(['"])(.*?)\1.*?>/gi,
			(match, quote, src) => {
				// 拼接完整本地路径
				const fullPath = path.join(baseDir, src);
				// 转换为Webview安全URI
				const uri = panel.webview.asWebviewUri(vscode.Uri.file(fullPath));
				// 替换原路径
				return `<script src=${quote}${uri}${quote}>`;
			}
		);

		// 类似替换link标签（CSS）
		htmlContent = htmlContent.replace(
			/<link\s+.*?href=(['"])(.*?)\1.*?>/gi,
			(match, quote, href) => {
				const fullPath = path.join(baseDir, href);
				const uri = panel.webview.asWebviewUri(vscode.Uri.file(fullPath));
				return `<link href=${quote}${uri}${quote} rel="stylesheet">`;
			}
		);

		const scriptUri = panel.webview.asWebviewUri(
			vscode.Uri.file(path.join(context.extensionPath, 'assets/utils.js'))
		);

		htmlContent = ` <script>
        window.vscodeBaseUri = '${panel.webview.asWebviewUri(
			vscode.Uri.file(baseDir)
		)}';
      </script>
      <script src="${scriptUri}"></script>${htmlContent}`
		panel.webview.html = htmlContent
		panel.webview.onDidReceiveMessage((message) => {
			if (message.command === 'error') {
				console.error('Webview 错误:', message.data);
				// 或输出到 VS Code 的输出面板
				vscode.window.showErrorMessage(`Webview 错误: ${message.data.message}`);
			}
		});
	});
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
