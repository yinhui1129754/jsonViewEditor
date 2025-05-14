// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
// import rawViewerHtml from "./../assets/out/editor.html";
import path from 'path';
import fs from "fs"
function replaceScriptSrc(html: string, transformFn: any) {
	const regex = /(<script\b[^>]*\s)src\s*=\s*(['"])(.*?)\2/gi;
	return html.replace(regex, (match, prefix, quote, oldSrc) => {
		const newSrc = transformFn(oldSrc); // 调用自定义转换函数
		return `${prefix}src=${quote}${newSrc}${quote}`;
	});
}
function createWebView(context: vscode.ExtensionContext, name?: string) {
	// var pannel = vscode.window.createWebviewPanel("1", "test", vscode.ViewColumn.One)
	// 创建Webview面板
	const panel = vscode.window.createWebviewPanel(
		name || 'jsonEditor', // 视图类型标识
		name || 'JSON Editor', // 面板标题
		vscode.ViewColumn.One, // 显示在编辑器哪个位置
		{
			enableScripts: true, // 启用JavaScript
			retainContextWhenHidden: true,
			// retainContextWhenHidden: true // 保持状态（可选）

		}
	);

	const baseDir = path.join(context.extensionPath, 'assets', 'out');

	// 读取HTML文件内容
	const htmlPath = path.join(baseDir, 'editor.html');
	let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

	htmlContent = replaceScriptSrc(htmlContent, (oldSrc: string) => {
		const fullPath = path.join(baseDir, oldSrc);
		// 转换为Webview安全URI

		const uri = panel.webview.asWebviewUri(vscode.Uri.file(fullPath));
		return uri.toString()
	})


	// // 正则匹配并替换所有script标签的src
	// htmlContent = htmlContent.replace(
	// 	/<script\s+.*?src=(['"])(.*?)\1.*?>/gi,
	// 	(match, quote, src) => {
	// 		console
	// 		// 拼接完整本地路径
	// 		const fullPath = path.join(baseDir, src);
	// 		// 转换为Webview安全URI
	// 		const uri = panel.webview.asWebviewUri(vscode.Uri.file(fullPath));
	// 		// 替换原路径
	// 		return `<script src=${quote}${uri}${quote}>`;
	// 	}
	// );

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


	panel.iconPath = {
		light: vscode.Uri.file(context.asAbsolutePath("assets/json.svg")), // 亮色主题图标
		dark: vscode.Uri.file(context.asAbsolutePath("assets/json.svg"))  // 暗色主题图标
	}
	panel.webview.html = htmlContent

	return panel
}

async function modifyFileWithVSCodeAPI(uri: vscode.Uri, content: string) {
	try {
		// 使用 VS Code API 读取文件
		const document = await vscode.workspace.openTextDocument(uri);

		// 创建编辑构建器
		const edit = new vscode.WorkspaceEdit();

		// 替换整个文件内容
		const fullRange = new vscode.Range(
			document.positionAt(0),
			document.positionAt(document.getText().length)
		);

		edit.replace(uri, fullRange, content);

		// 应用编辑并保存文件
		const success = await vscode.workspace.applyEdit(edit);
		if (success) {
			await document.save();
			vscode.window.showInformationMessage('文件已修改并保存');
		} else {
			vscode.window.showErrorMessage('修改文件失败');
		}
	} catch (error) {
		console.error('保存文件时出错:', error);
		vscode.window.showErrorMessage('保存文件时出错: ' + error);
	}
}
function rightMenuEditor(context: vscode.ExtensionContext, uri: vscode.Uri) {

	var pathObj = path.parse(uri.fsPath)
	var panel = createWebView(context, pathObj.name + pathObj.ext)
	var jsonContent = fs.readFileSync(uri.fsPath, "utf-8")
	var isLoaded = false
	var isServer = false
	panel.webview.onDidReceiveMessage(
		message => {
			switch (message.command) {
				case "error": {
					console.error('Webview 错误:', message.data);
					// 或输出到 VS Code 的输出面板
					vscode.window.showErrorMessage(`Webview 错误: ${message.data.message}`);
					break;
				}
				case "getJson": {
					break;
				}
				case "changeJson": {
					if (isServer === true) {
						isServer = false
						break;
					}
					if (!isLoaded) {
						break;
					}
					// fs.writeFileSync(uri.fsPath, message.json)
					modifyFileWithVSCodeAPI(uri, message.json)
					break;
				}
				case "loaded": {

					isServer = true

					isLoaded = true
					panel.webview.postMessage({
						command: "setJson",
						json: jsonContent
					})
					break;
				}
				case 'updateContent': {

					vscode.window.showInformationMessage(message.text);
					// 更新文件内容或执行其他操作
					break;
				}
			}
		},
		undefined,
		context.subscriptions
	);
}
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "jsonvieweditor" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('jsonvieweditor.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('开始创建编辑器。');

		createWebView(context)
	});
	const menuDisposable = vscode.commands.registerCommand(
		'jsonvieweditor.openWithCustomViewer',
		(uri: vscode.Uri) => {
			if (uri) {

				// 处理文件URI（例如打开文件、显示自定义视图等）
				vscode.window.showInformationMessage(
					`正在打开: ${uri.fsPath}`
				);
				rightMenuEditor(context, uri)
			}
		}
	);

	context.subscriptions.push(disposable, menuDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
