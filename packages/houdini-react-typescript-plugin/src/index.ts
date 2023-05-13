import { parse as parseJavascript } from '@babel/parser'
import type { Program } from '@babel/types'

/// <reference types="typescript/lib/tsserverlibrary" />

// @ts-ignore
export = function init(modules: { typescript: typeof import('typescript/lib/tsserverlibrary') }) {
	const ts = modules.typescript

	return {
		create(info: ts.server.PluginCreateInfo) {
			// Set up decorator object
			const proxy: ts.LanguageService = Object.create(null)
			for (let k of Object.keys(info.languageService) as Array<keyof ts.LanguageService>) {
				const x = info.languageService[k]!
				// @ts-expect-error - JS runtime trickery which is tricky to type tersely
				proxy[k] = (...args: Array<{}>) => x.apply(info.languageService, args)
			}

			function inside_props(
				file_name: string,
				position: number,
				source: ts.Node,
				version: string
			): boolean {
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
			proxy.getQuickInfoAtPosition = (file_name: string, position: number) => {
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

function is_layout(path: string) {
	return path.endsWith('/src/+layout.tsx') || path.endsWith('/src/+index.tsx')
}

function is_page(path: string) {
	return path.endsWith('/src/+page.tsx')
}

function parse_with_memo({
	content,
}: {
	file_name: string
	version: string
	content: string
}): Program {
	const key = content
	if (_memo[key]) {
		return _memo[key]
	}

	_memo[key] = parseJS(content)

	return _memo[key]
}
const _memo: Record<string, Program> = {}

// we can't use the recast parser because it normalizes template strings which break the graphql function
// overload definitions
function parseJS(str: string): Program {
	// @ts-ignore: babel doesn't perfectly match recast's types (the comments don't line up)
	return parseJavascript(str || '', {
		plugins: ['typescript', 'importAssertions'],
		sourceType: 'module',
	}).program
}
