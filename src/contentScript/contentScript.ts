import * as MarkdownIt from "markdown-it"
import crypto = require('crypto')

const fenceNameRegExp = /plant-?uml/i

export default function (context) {
    return {
        plugin: function (markdownIt: MarkdownIt, _options) {
            const defaultRender = markdownIt.renderer.rules.fence || function (tokens, idx, options, env, self) {
                return self.renderToken(tokens, idx, options)
            }

            markdownIt.renderer.rules.fence = function (tokens, idx, options, env, self) {
                const token = tokens[idx]
                // console.log('token', token)
                if (!fenceNameRegExp.test(token.info)) return defaultRender(tokens, idx, options, env, self)

                const randomId = crypto.randomBytes(8).toString('hex')
                // console.log(`plantuml[${randomId}] render markdown-it plugin`)

                const content = JSON.stringify(token.content)

                const sendContentToJoplinPlugin = `
                // Configure context menu
                document.getElementById('plantuml-body-${randomId}').addEventListener('mousedown', e => {
                    const menu = document.getElementById('plantuml-menu-${randomId}');
                    if(e.target && e.target.nodeName === 'IMG') {
                        // menu.style.left = e.pageX+'px';
                        // menu.style.top = e.pageY+'px';
                        menu.style.display = '';
                    } else {
                        menu.style.display = 'none';
                    }
                });
                document.getElementById('plantuml-menu-${randomId}-copyImage').addEventListener('click', async e => {
                    const img = document.querySelector("#plantuml-body-${randomId} img");
                    if(img) {
                        const response = await fetch(img.dataset.imageUrl);
                        navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': await response.blob() })
                        ]);
                    }
                });
                document.getElementById('plantuml-menu-${randomId}-copyImageAddress').addEventListener('click', e => {
                    const img = document.querySelector("#plantuml-body-${randomId} img");
                    if(img) {
                        navigator.clipboard.writeText(img.dataset.url);
                    }
                });

                // Send fence content to plugin
                webviewApi.postMessage('${context.contentScriptId}', ${content}).then((response) => {
                    document.getElementById('plantuml-body-${randomId}').innerHTML = response;
                });
                `.replace(/"/g, '&quot;')

                return `
                <div id="plantuml-root-${randomId}" class="plantUML-container" tabindex="-1">
                    <div id="plantuml-body-${randomId}" class="flex-center">
                        <div class="lds-dual-ring"></div>
                        <span>Rendering plantuml diagram...</span>
                    </div>
                    <div id="plantuml-menu-${randomId}" class="menu">
                        <ul class="menu-options">
                            <li class="menu-option"><button id="plantuml-menu-${randomId}-copyImage">Copy image</button></li>
                            <li class="menu-option"><button id="plantuml-menu-${randomId}-copyImageAddress">Copy image address</button></li>
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
