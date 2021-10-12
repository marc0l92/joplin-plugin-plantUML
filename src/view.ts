import { Settings } from "./settings"

export class View {
    private _settings: Settings

    constructor(settings: Settings) {
        this._settings = settings
    }

    renderSvg(imageData: any): string {
        console.log('renderImage', imageData, this._settings)
        return `<div class="flex-center"><img alt="PlantUML Diagram" src="data:image/svg+xml;base64,${imageData}" /></div>`
    }

    renderPng(imageData: any): string {
        console.log('renderImage', imageData, this._settings)
        return `<div class="flex-center"><img alt="PlantUML Diagram" src="data:image/png;base64,${imageData}" /></div>`
    }

    renderAsciArt(asciArt: any): string {
        console.log('renderAsciArt', asciArt, this._settings)
        return `<div class="flex-center"><pre>${Buffer.from(asciArt, 'base64').toString('utf-8')}</pre></div>`
    }

    render(content: string): string {
        switch (this._settings.get('renderingFormats')) {
            case 'svg':
                return this.renderSvg(content)
            case 'png':
                return this.renderPng(content)
            case 'txt':
                return this.renderAsciArt(content)
            default:
                throw 'renderingFormat not implemented: ' + this._settings.get('renderingFormats')
        }
    }

    renderError(query: string, error: string): string {
        console.log('renderError', query, error)
        return `<div class="flex-center"><span class="error-icon">X</span><span>PlantUML Error:</span><span>${error}</span></div>`
    }
}
