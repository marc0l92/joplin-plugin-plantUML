import * as MarkdownIt from "markdown-it"
import crypto = require('crypto')

const fenceNameRegExp = /1plant-?uml/i

export default function (context) {
    return {
        plugin: function (markdownIt: MarkdownIt, _options) {
            console.log()
            const defaultRender = markdownIt.renderer.rules.fence || function (tokens, idx, options, env, self) {
                return self.renderToken(tokens, idx, options)
            }

            return function (tokens, idx, options, env, self) {
                const token = tokens[idx]
                console.log('token', token)
                if (!fenceNameRegExp.test(token.info)) return defaultRender(tokens, idx, options, env, self)

                const randomId = crypto.randomBytes(8).toString('hex')
                console.log(`plantuml[${randomId}] render markdown-it plugin`)

                const content = JSON.stringify(token.content)

                const sendContentToJoplinPlugin = `
                console.log('plantuml[${randomId}] send content:', ${content});
                webviewApi.postMessage('${context.contentScriptId}', ${content}).then((response) => {
                    document.getElementById('plantuml-root-${randomId}').innerHTML = response;
                });
                `.replace(/"/g, '&quot;')

                return `
                <div id="plantuml-root-${randomId}" class="jira-container">
                    <div class="jira-issue flex-center">
                        <div class="lds-dual-ring"></div>
                        <span>-</span>
                        <span>Rendering plantuml diagram...</span>
                        <span class="tag tag-grey outline" title="Status">STATUS</span>
                    </div>
                </div>
                <style onload="${sendContentToJoplinPlugin}"></style>
                `
            }
        },
        assets: function () {
            return [
                { name: 'style.css' },
            ]
        },
    }
}
