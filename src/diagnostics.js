const P = require('../lib/parsimmon')

const PBX = P.createLanguage({
	PropertyRef: () => P.regexp(/([a-zA-Z0-9_][a-zA-Z0-9_]*)((.[a-zA-Z0-9_][a-zA-Z0-9_]*)+)?/),
	Path: r => P.alt(
		P.seqObj(P.string('/'), ['properties', P.alt(P.string('..'), r.PropertyRef)], ['rest', P.alt(r.Path, P.optWhitespace)]),
		P.seqObj(['properties', P.alt(P.string('..'), r.PropertyRef)], ['rest', r.Path])
	),
	NumberLiteral: () => P.regexp(/-?([0-9]+)((.[0-9]+)+)?/),
	StringLiteral: () => P.regexp(/"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/),
	List: r => P
		.alt(r.StringLiteral, r.PropertyRef, r.NumberLiteral, r.Path, r.List, r.Object, P.optWhitespace)
		.trim(P.optWhitespace)
		.sepBy(P.string(','))
		.wrap(P.string('('), P.string(')')),
	Object: r => P
		.alt(r.Configuration, P.optWhitespace)
		.trim(P.optWhitespace)
		.sepBy(P.string(';'))
		.wrap(P.string('{'), P.string('}')),
	Configuration: r => P.seqObj(
		['lhs', P.alt(r.PropertyRef, r.StringLiteral)], P.optWhitespace,
		P.string('='), P.optWhitespace,
		['rhs', P.alt(r.StringLiteral, r.PropertyRef, r.NumberLiteral, r.Path, r.List, r.Object)]
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

module.exports = {
  getDiagnostic
}
