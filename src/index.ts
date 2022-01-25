import joplin from 'api'
import { ContentScriptType } from 'api/types'
import { ChangeEvent } from 'api/JoplinSettings'
import { MenuItem, MenuItemLocation } from 'api/types'
import { Settings, Diagram } from './settings'
import { PlantUMLRenderer } from './plantUMLRenderer'
import { View } from './view'
import { ObjectsCache } from './objectsCache'
import { resolve } from 'path'
import { tmpdir } from 'os'
import { sep } from 'path'
const fs = joplin.require('fs-extra')


const Config = {
    MarkdownFenceId: 'plantuml',
    DiagramsCacheFolder: `${tmpdir}${sep}joplin-plantUml2-plugin${sep}`,
}

const Templates = {
    Fence: '```plantuml\n\n```',
}

const CommandsId = {
    Fence: 'plantUML-fenceTemplate',
}

function clearDiskCache(): void {
    fs.rmdirSync(Config.DiagramsCacheFolder, { recursive: true })
    fs.mkdirSync(Config.DiagramsCacheFolder, { recursive: true })
}

function addDiagramHeader(diagram: string, header: string): string {
    if (diagram[0] === '@') {
        const endOfFirstLine = diagram.indexOf('\n') + 1
        return diagram.slice(0, endOfFirstLine) + header + '\n' + diagram.slice(endOfFirstLine)
    } else {
        return header + '\n' + diagram
    }
}

async function readFileContent(filename: string): Promise<string> {
    let content = ''
    if (filename) {
        try {
            const absolutePath = resolve(filename)
            content = await fs.readFile(absolutePath, 'utf8')
        } catch (e) {
            console.error('DiagramHeader file reading error:', e)
        }
    }
    return content
}

function writeTempImage(id: string, content: string, format: string): void {
    switch (format) {
        case 'svg':
            const filePathSvg = `${Config.DiagramsCacheFolder}${id}.svg`
            fs.writeFile(filePathSvg, content, 'base64')
            break
        case 'png':
            const filePathPng = `${Config.DiagramsCacheFolder}${id}.png`
            fs.writeFile(filePathPng, content, 'base64')
            break
    }
}

joplin.plugins.register({
    onStart: async function () {
        const settings = new Settings()
        const plantUMLRenderer = new PlantUMLRenderer(settings)
        const view = new View(settings)
        const cache = new ObjectsCache()

        // Clean and create cache folder
        clearDiskCache()

        /**
         * Register Commands
         */

        // Register settings
        settings.register()
        joplin.settings.onChange(async (event: ChangeEvent) => {
            await settings.read(event)
            cache.clear()
            clearDiskCache()
        })

        // Register command
        await joplin.commands.register({
            name: CommandsId.Fence,
            label: 'Insert PlantUML block template',
            iconName: 'fa fa-pencil',
            execute: async () => {
                await joplin.commands.execute('insertText', Templates.Fence)
            },
        })

        // Register menu
        const commandsSubMenu: MenuItem[] = Object.values(CommandsId).map(command => ({ commandName: command }))
        await joplin.views.menus.create('menu-plantUML', 'PlantUML', commandsSubMenu, MenuItemLocation.Tools)


        // Content Scripts
        await joplin.contentScripts.register(
            ContentScriptType.MarkdownItPlugin,
            Config.MarkdownFenceId,
            './contentScript/contentScript.js',
        )

        /**
         * Messages handling
         */
        await joplin.contentScripts.onMessage(Config.MarkdownFenceId, async (request: { id: string, content: string }) => {
            // console.log('PlantUML definition:', message)

            let outputHtml = ''
            try {
                const diagramHeader = await readFileContent(settings.get('diagramHeaderFile'))
                request.content = addDiagramHeader(request.content, diagramHeader)
                let diagram: Diagram = cache.getCachedObject(request.content)
                if (!diagram) {
                    diagram = await plantUMLRenderer.execute(request.content)
                    cache.addCachedObject(request.content, diagram)
                    writeTempImage(request.id, diagram.blob, settings.get('renderingFormats'))
                }
                outputHtml += view.render(diagram)
            } catch (err) {
                outputHtml += view.renderError(request.content, err)
            }
            return outputHtml
        })
    },
})
