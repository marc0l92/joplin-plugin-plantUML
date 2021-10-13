import joplin from 'api'
import { ContentScriptType } from 'api/types'
import { ChangeEvent } from 'api/JoplinSettings'
import { MenuItem, MenuItemLocation } from 'api/types'
import { Settings, Diagram } from './settings'
import { PlantUMLRenderer } from './plantUMLRenderer'
import { View } from './view'
import { ObjectsCache } from './objectsCache'


enum Config {
    MarkdownFenceId = '1plantuml',
}

const Templates = {
    Fence: '```plantuml\n\n```',
}

const CommandsId = {
    Fence: 'plantUML-fenceTemplate',
}

joplin.plugins.register({
    onStart: async function () {
        const settings = new Settings()
        const plantUMLRenderer = new PlantUMLRenderer(settings)
        const view = new View(settings)
        const cache = new ObjectsCache()

        /**
         * Register Commands
         */

        // Register settings
        settings.register();
        joplin.settings.onChange(async (event: ChangeEvent) => {
            await settings.read(event)
            cache.clear()
        })

        // Register command
        await joplin.commands.register({
            name: CommandsId.Fence,
            label: 'PlantUML: Insert PlantUML block template',
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
        await joplin.contentScripts.onMessage(Config.MarkdownFenceId, async (message: string) => {
            console.log('PlantUML definition:', message)

            let outputHtml = ''
            try {
                let diagram: Diagram = cache.getCachedObject(message)
                if (!diagram) {
                    diagram = await plantUMLRenderer.execute(message)
                    cache.addCachedObject(message, diagram)
                }
                outputHtml += view.render(diagram)
            } catch (err) {
                outputHtml += view.renderError(message, err)
            }
            return outputHtml
        })
    },
})
