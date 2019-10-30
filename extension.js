const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('Congratulations, your extension "Lint Pbx" is now active!');

  const collection = vscode.languages.createDiagnosticCollection('pbx');
  updateDiagnostics(vscode.window.activeTextEditor.document, collection)
	// let disposable = vscode.commands.registerCommand('extension.lintPbx', function () {
	// 	vscode.window.showInformationMessage('Lint World!');
	// });

	// context.subscriptions.push(disposable);
}
exports.activate = activate;

function updateDiagnostics(document, collection) {
  const text = document.getText()
  const tokens = tokenize(text).filter(t => t.tokenPattern.type !== 'string')

  let openBrackets = tokens.filter(t => t.tokenPattern.type[0] === 'l')
  let closeBrackets = tokens.filter(t => t.tokenPattern.type[0] === 'r')

}

// function updateDiagnostics(document, collection) {
//   const text = document.getText()
//   const tokens = tokenize(text).filter(t => t.tokenPattern.type !== 'string')
//   let openedStack = []
//   tokens.forEach(t => {
//     const type = t.tokenPattern.type
//     if (type === 'lBracket' || type === 'lBrace' || type === 'lParenthesis')
//       openedStack.push(t) 
//     else if (openedStack.length === 0)
//       return createDiagnosticAt(document, collection, t, 'Missing close brackets')
//     else {
//       let lastTokenType = openedStack.pop().tokenPattern.type
//       if (lastTokenType.slice(1) !== type.slice(1)) return createDiagnosticAt(document, collection, t, 'Missing close brackets') 
//     }
//   })
// }

function createDiagnosticAt(document, collection, token, message) {
  const range = new vscode.Range(document.positionAt(token.index), document.positionAt(token.index + 2))
  collection.set(document.uri, [{
    code: '',
    message,
    range: range,
    severity: vscode.DiagnosticSeverity.Error,
    source: '',
    relatedInformation: [
      new vscode.DiagnosticRelatedInformation(new vscode.Location(document.uri, range), '')
    ]
  }]);
}

const TOKENS = {
  STRING: { type: "string", pattern: /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/ },
  lBracket: { type: 'lBracket', pattern: /\[/ },
  rBracket: { type: 'rBracket', pattern: /\]/ },
  lBrace: { type: 'lBrace', pattern: /{/ },
  rBrace: { type: 'rBrace', pattern: /}/ },
  lParent: { type: 'lParenthesis', pattern: /\(/ },
  rParent: { type: 'rParenthesis', pattern: /\)/ },
}

function readToken (str) {
  let i = Infinity
  let token
  Object.values(TOKENS).forEach((langToken) => {
    const r = str.match(langToken.pattern)
    if (!r || r == null) return null
    else if (str.indexOf(r[0]) < i) {
      i = str.indexOf(r[0])
      token = { value: r[0], tokenPattern: langToken }
    }
  })
  return [token, i]
}

function tokenize (input) {
  const tokens = []
  for (let i = 0; i < input.length;) {
    const t = readToken(input.slice(i))
    if (t == null || t[0] === undefined) break
    i += t[0].value.length + t[1]
    tokens.push({ ...t[0], index: i-1 })
  }
  return tokens
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
