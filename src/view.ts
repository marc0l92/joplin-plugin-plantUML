import { Settings } from "./settings"

export class View {
    private _settings: Settings

    constructor(settings: Settings) {
        this._settings = settings
    }

    renderImage(imageUrl: any): string {
        console.log('renderImage', imageUrl, this._settings)
        return `<img alt="PlantUML Diagram" src="${imageUrl}" />`
    }

    renderError(query: string, error: string): string {
        console.log('renderError', query, error)
        // const template = Templater(Templates.error)

        // return template({
        //     query: query,
        //     error: error.toString(),
        // })
        return 'renderError: ' + error
    }
}
