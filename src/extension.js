const vscode = require('vscode')
const { getDiagnostic } = require('./diagnostics')

function activate(context) {
  const collection = vscode.languages.createDiagnosticCollection('pbx')

  if (vscode.window.activeTextEditor) updateDiagnostics(vscode.window.activeTextEditor.document, collection)
  
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor) updateDiagnostics(editor.document, collection)
    })
  )

  context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(e => updateDiagnostics(e.document, collection))
	)

	context.subscriptions.push(
		vscode.workspace.onDidCloseTextDocument(doc => collection.delete(doc.uri))
	)
}
exports.activate = activate;

function updateDiagnostics(document, collection) {
  if (document.languageId !== 'project.pbxproj') return
  
  const text = document.getText()
  const { status, ...diagnostic } = getDiagnostic(text)

  if (status === false)
    createDiagnosticAt(document, collection, diagnostic.index.offset, 'Syntax Error - Unexpected Token')
  else
    collection.set(document.uri, [])
}

function createDiagnosticAt(document, collection, index, message) {
  const range = new vscode.Range(document.positionAt(index - 1), document.positionAt(index + 1))
  collection.set(document.uri,
    [{
      code: '', message, range, source: '',
      severity: vscode.DiagnosticSeverity.Error,
      relatedInformation: [
        new vscode.DiagnosticRelatedInformation(new vscode.Location(document.uri, range), '')
      ]
    }]
  )
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
