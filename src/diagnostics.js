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

function getDiagnostic(text) {
  const brackets = tokenize(text).filter(t => t.tokenPattern.type !== 'string')
  let stack = []
				
	for (let i = 0; i < brackets.length; i++) {
		if (brackets[i].value === '(' || brackets[i].value === '[' || brackets[i].value === '{')
			stack.push(brackets[i])

		if (stack.length === 0) {
      return { status: false, token: brackets[i], message: 'Unexpected token' }
    }

		if (brackets[i].value === ')') {
			const x = stack.pop()
      if (x.value === '{' || x.value === '[')
        return { status: false, token: brackets[i], message: `Unclosed ${brackets[i].tokenPattern.type.split(1)}` }
		} else if (brackets[i].value === '}') {
			const x = stack.pop()
      if (x.value === '(' || x.value === '[')
        return { status: false, token: brackets[i], message: `Unclosed ${brackets[i].tokenPattern.type.split(1)}` }
		} else if (brackets[i].value === ']') {
			const x = stack.pop()
      if (x.value === '(' || x.value === '{')
        return { status: false, token: brackets[i], message: `Unclosed ${brackets[i].tokenPattern.type.split(1)}` }
		}
	}

	if (stack.length === 0)
		return { status: true }
	else
		return { status: false, token: brackets[brackets.length-1], message: 'Unexpected token' }
}

module.exports = {
  getDiagnostic
}