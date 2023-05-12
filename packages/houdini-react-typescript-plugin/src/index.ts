/// <reference types="typescript/lib/tsserverlibrary" />

function init(modules: { typescript: typeof import('typescript/lib/tsserverlibrary') }) {
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

			// this plugin's primary goal is to add type hints to the editing experience
			// this is
			proxy.getSuggestionDiagnostics = (filename: string): ts.DiagnosticWithLocation[] => {
				// make sure we don't remove any diagnostics the language server provided
				const prior = info.languageService.getSuggestionDiagnostics(filename)
				console.log(prior)

				return prior
			}

			return proxy
		},
	}
}

// @ts-ignore
export = init
