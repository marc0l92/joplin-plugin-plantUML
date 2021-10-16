import { Settings, SettingDefaults, Diagram } from "./settings"
const plantumlEncoder = require('plantuml-encoder')

enum Config {
    Timeout = 5000,
}

export class PlantUMLRenderer {
    private _settings: Settings

    constructor(settings: Settings) {
        this._settings = settings
    }

    async fetchWithTimeout(resource, options) {
        const { timeout = Config.Timeout } = options

        const controller = new AbortController()
        const id = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        })
        clearTimeout(id)

        return response
    }

    async fetchBlob(url: string): Promise<string> {
        let response: Response
        try {
            response = await this.fetchWithTimeout(url, {})
        } catch (e) {
            console.error('PlantUML::fetchBlob::error', e.name, e)
            if (e.name === 'AbortError') {
                throw 'Request timeout'
            }
            throw 'Request error'
        }

        if (response.status === 200 || response.status === 400) {
            console.info('PlantUML::fetchBlob::response', response)
            const arrayBuffer = await (await response.blob()).arrayBuffer()
            return Buffer.from(arrayBuffer).toString('base64')
        } else {
            console.error('PlantUML::fetchBlob::error', response)
            throw `${response.status} - ${response.statusText}`
        }
    }


    async execute(definition: string): Promise<Diagram> {
        let encodedDefinition: string
        let url: string
        let imageUrl: string
        const renderingFormatUrl = this._settings.get('renderingFormats')
        switch (this._settings.get('renderingType')) {
            case 'public':
                encodedDefinition = plantumlEncoder.encode(definition)
                url = SettingDefaults.RenderingServer + '/' + renderingFormatUrl + '/' + encodedDefinition
                imageUrl = SettingDefaults.RenderingServer + '/png/' + encodedDefinition
                return { url: url, blob: await this.fetchBlob(url), imageUrl: imageUrl }
            case 'private':
                encodedDefinition = plantumlEncoder.encode(definition)
                url = this._settings.get('renderingServer') + '/' + renderingFormatUrl + '/' + encodedDefinition
                imageUrl = this._settings.get('renderingServer') + '/png/' + encodedDefinition
                return { url: url, blob: await this.fetchBlob(url), imageUrl: imageUrl }
            default:
                throw 'renderingType not implemented: ' + this._settings.get('renderingType')
        }
    }
}
