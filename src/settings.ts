import joplin from 'api'
import { ChangeEvent } from 'api/JoplinSettings'
import { SettingItem, SettingItemType } from 'api/types'

export interface Diagram {
    url: string,
    blob: string,
    imageUrl: string,
}

interface SettingsConfig {
    [key: string]: SettingItem,
}

export const SettingDefaults = {
    RenderingServer: 'http://www.plantuml.com/plantuml',
    RenderingType: { public: "Official public server", private: "Private server" },
    RenderingFormats: { svg: 'Vector Image (svg)', png: 'Raster Image (png)', txt: 'AsciiArt (txt)', },
}

export class Settings {

    // Settings definitions
    private _config: SettingsConfig = {
        renderingType: {
            value: Object.keys(SettingDefaults.RenderingType)[0],
            type: SettingItemType.String,
            section: 'plantUML.settings',
            public: true,
            advanced: false,
            isEnum: true,
            options: SettingDefaults.RenderingType,
            label: 'Rendering: Type',
            description: 'Type of renderer used to parse the PlantUML syntax and create the image. ' + SettingDefaults.RenderingType.public + ': ' + SettingDefaults.RenderingServer + ' ; ' + SettingDefaults.RenderingType.private + ': Host taken from the next option',
        },
        renderingServer: {
            value: SettingDefaults.RenderingServer,
            type: SettingItemType.String,
            section: 'plantUML.settings',
            public: true,
            advanced: false,
            label: 'Rendering: Private server host (optional)',
            description: 'Private rendering server for plantUML. This server is used only if the Rendering Type is "' + SettingDefaults.RenderingType.private + '"',
        },
        renderingFormats: {
            value: Object.keys(SettingDefaults.RenderingFormats)[0],
            type: SettingItemType.String,
            section: 'plantUML.settings',
            public: true,
            advanced: false,
            isEnum: true,
            options: SettingDefaults.RenderingFormats,
            label: 'Rendering: Output image format',
            description: 'Type of image format generated while rendering the diagram.',
        },
    }

    // Checks on the settings
    private _checks = {
        renderingServer(host: string) {
            return host.replace(/\/$/, '')
        },
    }

    // Getters
    get(key: string): any {
        if (key in this._config) {
            return this._config[key].value
        }
        throw 'Setting not found: ' + key
    }
    toObject(): any {
        return Object.keys(this._config).reduce((result, key) => {
            result[key] = this._config[key].value
            return result
        }, {})
    }

    // Register settings
    async register() {
        await joplin.settings.registerSection('plantUML.settings', {
            label: 'PlantUML',
            iconName: 'fa fa-project-diagram',
            description: 'PlantUML allows you to render UML diagrams using the syntax defined at https://plantuml.com. For more info on the plugin: https://github.com/marc0l92/joplin-plugin-plantUML#readme'
        })

        await joplin.settings.registerSettings(this._config)

        // Initially read settings
        await this.read();
    }

    // Get setting on change
    private async getOrDefault(event: ChangeEvent, localVar: any, setting: string): Promise<any> {
        if (!event || event.keys.includes(setting)) {
            return await joplin.settings.value(setting)
        }
        return localVar;
    }

    // Store settings on change
    async read(event?: ChangeEvent) {
        for (let key in this._config) {
            this._config[key].value = await this.getOrDefault(event, this._config[key].value, key)
            if (key in this._checks) {
                this._config[key].value = this._checks[key](this._config[key].value)
                await joplin.settings.setValue(key, this._config[key].value)
            }
        }
    }
}
