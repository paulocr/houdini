'use strict'
const parser_1 = require('@babel/parser')
function is_layout(path) {
	return path.endsWith('/src/+layout.tsx') || path.endsWith('/src/+index.tsx')
}
function is_page(path) {
	return path.endsWith('/src/+page.tsx')
}
function parse_with_memo({ content }) {
	const key = content
	if (_memo[key]) {
		return _memo[key]
	}
	_memo[key] = parseJS(content)
	return _memo[key]
}
const _memo = {}
// we can't use the recast parser because it normalizes template strings which break the graphql function
// overload definitions
function parseJS(str) {
	// @ts-ignore: babel doesn't perfectly match recast's types (the comments don't line up)
	return (0, parser_1.parse)(str || '', {
		plugins: ['typescript', 'importAssertions'],
		sourceType: 'module',
	}).program
}
module.exports = function init(modules) {
	const ts = modules.typescript
	return {
		create(info) {
			// Set up decorator object
			const proxy = Object.create(null)
			for (let k of Object.keys(info.languageService)) {
				const x = info.languageService[k]
				// @ts-expect-error - JS runtime trickery which is tricky to type tersely
				proxy[k] = (...args) => x.apply(info.languageService, args)
			}
			function inside_props(file_name, position, source, version) {
				// first things first, get the file's ast
				const parsed = parse_with_memo({ file_name, version, content: source.getText() })
				console.log({ source, position, version })
				console.log(parsed)
				return true
			}
			console.log('HOUDINI - CREATE')
			proxy.getCompletionsAtPosition = (file_name, position, options) => {
				console.log('HOUDINI - getCompletionsAtPosition', position)
				let prior = info.languageService.getCompletionsAtPosition(
					file_name,
					position,
					options
				)
				const program = info.languageService.getProgram()
				if (!program) {
					return prior
				}
				const source_file = program.getSourceFile(file_name)
				if (!source_file) {
					return prior
				}
				// if we aren't considering a page or layout file, ignore it
				if (!is_layout(file_name) && !is_page(file_name)) {
					return prior
				}
				// if the cursor is inside of a props object
				// @ts-expect-error: version is internal
				if (inside_props(file_name, position, source_file, source_file.vesion)) {
					console.log('INSIDE')
					return {
						isGlobalCompletion: false,
						isMemberCompletion: false,
						isNewIdentifierLocation: true,
						// return an auto complete entry for every possible route
						entries: [
							{
								name: 'MyQuery',
								kind: ts.ScriptElementKind.string,
								kindModifiers: 'none',
								sortText: 'MyQuery',
								isRecommended: true,
								source: 'Houdini',
								insertText: 'MyQuery',
								replacementSpan: {
									start: position,
									length: 0,
								},
							},
						],
					}
				}
				return prior
			}
			// getQuickInfoAtPosition is called when:
			// - the user is typing in the props object and vscode wants to complete their input
			proxy.getQuickInfoAtPosition = (file_name, position) => {
				console.log('HOUDINI - getQuickInfoAtPosition', position)
				// we dont need to add anything
				return info.languageService.getQuickInfoAtPosition(file_name, position)
			}
			proxy.getCompletionEntryDetails = (...args) => {
				console.log('HOUDINI - getCompletionEntryDetails', args)
				// we dont need to add anything
				return info.languageService.getCompletionEntryDetails(...args)
			}
			return proxy
		},
	}
}
