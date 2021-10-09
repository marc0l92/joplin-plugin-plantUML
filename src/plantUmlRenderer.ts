import { Settings, SettingDefaults } from "./settings"
// const plantumlLocalRenderer = require('node-plantuml');
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



    async execute(definition: string): Promise<any> {
        let encodedDefinition
        const renderingFormatUrl = this._settings.get('renderingFormats')
        switch (this._settings.get('renderingType')) {
            case 'public':
                encodedDefinition = plantumlEncoder.encode(definition)
                return SettingDefaults.RenderingServer + '/' + renderingFormatUrl + '/' + encodedDefinition
            case 'private':
                encodedDefinition = plantumlEncoder.encode(definition)
                return this._settings.get('renderingServer') + '/' + renderingFormatUrl + '/' + encodedDefinition
            case 'local':
                return 'plantUML renderer local: ' + definition
            default:
                throw 'renderingType not implemented: ' + this._settings.get('renderingType')
        }
        // const url: URL = new URL(this._settings.get('jiraHost') + this._settings.apiBasePath + '/issue/' + issue)
        // const requestHeaders: HeadersInit = new Headers
        // if (this._settings.get('username')) {
        //     requestHeaders.set('Authorization', 'Basic ' + btoa(this._settings.get('username') + ':' + this._settings.get('password')))
        // }
        // const options: RequestInit = {
        //     method: 'GET',
        //     headers: requestHeaders,
        // }

        // let response: Response
        // try {
        //     response = await this.fetchWithTimeout(url.toString(), options)
        // } catch (e) {
        //     console.error('JiraClient::getIssue::response', e.name, e)
        //     if (e.name === 'AbortError') {
        //         throw 'Request timeout'
        //     }
        //     throw 'Request error'
        // }

        // if (response.status === 200) {
        //     // console.info('response', response)
        //     try {
        //         return response.json()
        //     } catch (e) {
        //         console.error('JiraClient::getIssue::parsing', response, e)
        //         throw 'The API response is not a JSON. Please check the host configured in the plugin options.'
        //     }
        // } else {
        //     console.error('JiraClient::getIssue::error', response)
        //     let responseJson: any
        //     try {
        //         responseJson = await response.json()
        //     } catch (e) {
        //         throw 'HTTP status ' + response.status
        //     }
        //     throw responseJson['errorMessages'].join('\n')
        // }

    }
}
