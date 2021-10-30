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
                    if(e.target && e.target.nodeName === 'IMG') {
                        menu.style.display = '';
                    } else {
                        menu.style.display = 'none';
                    }
                });
                document.getElementById('plantuml-menu-${diagramId}-copyImage').addEventListener('click', async e => {
                    const img = document.querySelector("#plantuml-body-${diagramId} img");
                    if(img) {
                        const response = await fetch(img.dataset.imageUrl);
                        navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': await response.blob() })
                        ]);
                    }
                });
                document.getElementById('plantuml-menu-${diagramId}-copyImageAddress').addEventListener('click', e => {
                    const img = document.querySelector("#plantuml-body-${diagramId} img");
                    if(img) {
                        navigator.clipboard.writeText(img.dataset.url);
                    }
                });

                // Send fence content to plugin
                webviewApi.postMessage('${context.contentScriptId}', ${pluginRequest}).then((response) => {
                   document.getElementById('plantuml-body-${diagramId}').innerHTML = response;
                });
                `.replace(/"/g, '&quot;')

                return `
                <div id="plantuml-root-${diagramId}" class="plantUML-container" tabindex="-1">
                    <div id="plantuml-body-${diagramId}" class="flex-center">
                        <object data="${diagramsTempDir}${diagramId}.svg" type="image/svg+xml"></object>
                        <object data="${diagramsTempDir}${diagramId}.png" type="image/png"></object>
                    </div>
                    <div id="plantuml-menu-${diagramId}" class="menu">
                        <ul class="menu-options">
                            <li class="menu-option"><button id="plantuml-menu-${diagramId}-copyImage">Copy image</button></li>
                            <li class="menu-option"><button id="plantuml-menu-${diagramId}-copyImageAddress">Copy image address</button></li>
                        </ul>
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
