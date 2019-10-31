// const TOKENS = {
//   STRING: { type: "string", pattern: /"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/ },
//   lBracket: { type: 'lBracket', pattern: /\[/ },
//   rBracket: { type: 'rBracket', pattern: /\]/ },
//   lBrace: { type: 'lBrace', pattern: /{/ },
//   rBrace: { type: 'rBrace', pattern: /}/ },
//   lParent: { type: 'lParenthesis', pattern: /\(/ },
//   rParent: { type: 'rParenthesis', pattern: /\)/ },
// }

const P = require('../lib/parsimmon')

const PBX = P.createLanguage({
	References: () => P.regexp(/([A-Z|0-9]{32})|([A-Z|0-9]{24})|([A-Z|0-9]{10})/)
		.assert(r => {
			let hasNumber = false
			let hasLetter = false
			for (let i = 0; i < r.length; i++) {
				isNaN(Number(r[i])) ? hasLetter = true : hasNumber = true	
			}
			return hasNumber && hasLetter && (r.length === 32 || r.length === 24 || r.length === 10)
		}),
	Properties: () => P.regexp(/([a-zA-Z_][a-zA-Z0-9_]*)((.[a-zA-Z0-9_][a-zA-Z0-9_]*)+)?/),
	Path: r => P.alt(
		P.seqObj(P.string('/'), ['properties', P.alt(P.string('..'), r.Properties)], ['rest', P.alt(r.Path, P.optWhitespace)]),
		P.seqObj(['properties', P.alt(P.string('..'), r.Properties)], ['rest', r.Path])
	),
	NumberLiteral: () => P.regexp(/-?([0-9]+)((.[0-9]+)+)?/),
	StringLiteral: () => P.regexp(/"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/),
	List: r => P
		.alt(r.StringLiteral, r.References, r.Properties, r.NumberLiteral, r.Path, r.List, r.Object, P.optWhitespace)
		.trim(P.optWhitespace)
		.sepBy(P.string(','))
		.wrap(P.string('('), P.string(')')),
	Object: r => P
		.alt(r.Configuration, P.optWhitespace)
		.trim(P.optWhitespace)
		.sepBy(P.string(';'))
		.wrap(P.string('{'), P.string('}')),
	Configuration: r => P.seqObj(
		['lhs', P.alt(r.References, r.Properties, r.StringLiteral)], P.optWhitespace,
		P.string('='), P.optWhitespace,
		['rhs', P.alt(r.StringLiteral, r.References, r.Properties, r.NumberLiteral, r.Path, r.List, r.Object)]
	),
	Project: r => P
		.seqObj(
      P.optWhitespace,
			['project', r.Object],
			P.optWhitespace
		)
})

function removeComments(data) {
  let pbx = '', commentSymbol = ''
  let toInsert = true, insideString = false
  
	for (let i = 0; i < data.length; i++) {
		const element = data[i];
		if (element === '/' && data[i+1] === '/' && !insideString) {
			toInsert = false
			commentSymbol = '//'
		} else if (element === '/' && data[i+1] === '*' && !insideString) {
			toInsert = false
			commentSymbol = '/*'
		} else if (data[i-2] === '*' && data[i-1] === '/' && commentSymbol === '/*' && !insideString) {
			toInsert = true
			commentSymbol = ''
		} else if (data[i-1] === '\n' && commentSymbol === '//' && !insideString) {
			toInsert = true
			commentSymbol = ''
		} else if (element === '"' && data[i-1] !== '\\') {
			insideString = !insideString
		}
		
		pbx += toInsert ? element : ' '
  }
  
  return pbx
}

function getDiagnostic(text) {
  try {
    PBX.Project.tryParse(removeComments(text))
    return { status: true }
	} catch (error) {
    return error.result
	}
}

// function readToken (str) {
//   let i = Infinity
//   let token
//   Object.values(TOKENS).forEach((langToken) => {
//     const r = str.match(langToken.pattern)
//     if (!r || r == null) return null
//     else if (str.indexOf(r[0]) < i) {
//       i = str.indexOf(r[0])
//       token = { value: r[0], tokenPattern: langToken }
//     }
//   })
//   return [token, i]
// }

// function tokenize (input) {
//   const tokens = []
//   for (let i = 0; i < input.length;) {
//     const t = readToken(input.slice(i))
//     if (t == null || t[0] === undefined) break
//     i += t[0].value.length + t[1]
//     tokens.push({ ...t[0], index: i-1 })
//   }
//   return tokens
// }

// function getDiagnostic(text) {
//   const brackets = tokenize(text).filter(t => t.tokenPattern.type !== 'string')
//   let stack = []
				
// 	for (let i = 0; i < brackets.length; i++) {
// 		if (brackets[i].value === '(' || brackets[i].value === '[' || brackets[i].value === '{')
// 			stack.push(brackets[i])

// 		if (stack.length === 0) {
//       return { status: false, token: brackets[i], message: 'Unexpected token' }
//     }

// 		if (brackets[i].value === ')') {
// 			const x = stack.pop()
//       if (x.value === '{' || x.value === '[')
//         return { status: false, token: brackets[i], message: `Unclosed ${brackets[i].tokenPattern.type.split(1)}` }
// 		} else if (brackets[i].value === '}') {
// 			const x = stack.pop()
//       if (x.value === '(' || x.value === '[')
//         return { status: false, token: brackets[i], message: `Unclosed ${brackets[i].tokenPattern.type.split(1)}` }
// 		} else if (brackets[i].value === ']') {
// 			const x = stack.pop()
//       if (x.value === '(' || x.value === '{')
//         return { status: false, token: brackets[i], message: `Unclosed ${brackets[i].tokenPattern.type.split(1)}` }
// 		}
// 	}

// 	if (stack.length === 0)
// 		return { status: true }
// 	else
// 		return { status: false, token: brackets[brackets.length-1], message: 'Unexpected token' }
// }

module.exports = {
  getDiagnostic
}