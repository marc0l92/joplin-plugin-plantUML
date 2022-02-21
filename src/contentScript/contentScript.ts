import * as MarkdownIt from "markdown-it"
import crypto = require('crypto')
import { tmpdir } from 'os'
import { sep } from 'path'

const diagramsTempDir = `${tmpdir}${sep}joplin-plantUml2-plugin${sep}`

const fenceNameRegExp = /^plant-?uml$/i

export default function (context: { contentScriptId: string }) {
    return {
        plugin: function (markdownIt: MarkdownIt, _options) {
            const defaultRender = markdownIt.renderer.rules.fence || function (tokens, idx, options, env, self) {
                return self.renderToken(tokens, idx, options)
            }

            markdownIt.renderer.rules.fence = function (tokens, idx, options, env, self) {
                const token = tokens[idx]
                // console.log('token', token)
                if (!fenceNameRegExp.test(token.info)) return defaultRender(tokens, idx, options, env, self)

                const diagramId = crypto.createHash('sha1').update(token.content).digest('hex')
                // console.log(`plantuml[${diagramId}] render markdown-it plugin`)

                const pluginRequest = JSON.stringify({ content: token.content, id: diagramId })

                const sendContentToJoplinPlugin = `
                // Configure context menu
                document.getElementById('plantuml-body-${diagramId}').addEventListener('mousedown', e => {
                    const menu = document.getElementById('plantuml-menu-${diagramId}');
                    if(e.button === 2) {
                        menu.style.display = '';
                    } else {
                        menu.style.display = 'none';
                    }
                });
                document.getElementById('plantuml-menu-${diagramId}-copyImage').addEventListener('click', async e => {
                    const img = document.querySelector("#plantuml-body-${diagramId}>div>*:first-child");
                    if(img) {
                        const response = await fetch(img.dataset.imageUrl);
                        navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': await response.blob() })
                        ]);
                    }
                });
                document.getElementById('plantuml-menu-${diagramId}-copyImageAddress').addEventListener('click', e => {
                    const img = document.querySelector("#plantuml-body-${diagramId}>div>*:first-child");
                    if(img) {
                        navigator.clipboard.writeText(img.dataset.url);
                    }
                });

                // Send fence content to plugin
                webviewApi.postMessage('${context.contentScriptId}', ${pluginRequest}).then((response) => {
                   document.getElementById('plantuml-body-${diagramId}').innerHTML = response;
                   document.getElementById('plantuml-menu-${diagramId}').style = "";
                });
                `.replace(/"/g, '&quot;')

                return `
                <div id="plantuml-root-${diagramId}" class="plantUML-container" tabindex="-1">
                    <div class="hidden" style="display:none">
                        <pre>
\`\`\`plantuml
${token.content}\`\`\`</pre>
                    </div>
                    <div id="plantuml-body-${diagramId}" class="flex-center">
                        <object data="${diagramsTempDir}${diagramId}.svg" type="image/svg+xml"></object>
                        <object data="${diagramsTempDir}${diagramId}.png" type="image/png"></object>
                    </div>
                    <div id="plantuml-menu-${diagramId}" class="menu" style="display:none">
                        <div class="menu-options">
                            <div class="menu-option"><input id="plantuml-menu-${diagramId}-copyImage" value="Copy image" /></div>
                            <div class="menu-option"><input id="plantuml-menu-${diagramId}-copyImageAddress" value="Copy image address" /></div>
                        </div>
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
