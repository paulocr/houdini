'use strict'
/// <reference types="typescript/lib/tsserverlibrary" />
function init(modules) {
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
			console.log('INSIDE HOUDINI')
			// this plugin's primary goal is to add type hints to the editing experience
			// this is
			proxy.getSuggestionDiagnostics = (filename) => {
				console.log('HERE')
				// make sure we don't remove any diagnostics the language server provided
				const prior = info.languageService.getSuggestionDiagnostics(filename)
				console.log(prior)
				return prior
			}
			return proxy
		},
	}
}
module.exports = init
