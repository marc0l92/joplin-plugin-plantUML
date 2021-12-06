import { Settings, Diagram } from "./settings"

export class View {
    private _settings: Settings

    constructor(settings: Settings) {
        this._settings = settings
    }

    renderSvg(diagram: Diagram): string {
        console.log('renderImage', diagram, this._settings)
        return `<div class="flex-center">
                    <div data-url="${diagram.url}" data-image-url="${diagram.imageUrl}">
                        ${atob(diagram.blob)}
                    </div>
                </div>`
    }

    renderPng(diagram: Diagram): string {
        console.log('renderImage', diagram, this._settings)
        return `<div class="flex-center">
                    <img alt="PlantUML Diagram" src="data:image/png;base64,${diagram.blob}" data-url="${diagram.url}" data-image-url="${diagram.imageUrl}" />
                </div>`
    }

    renderAsciArt(diagram: Diagram): string {
        console.log('renderAsciArt', diagram, this._settings)
        // Remeber to not put spaces or newlines inside the <pre> tags
        return `<div class="flex-center">
                    <pre data-url="${diagram.url}" data-image-url="${diagram.imageUrl}">${Buffer.from(diagram.blob, 'base64').toString('utf-8')}</pre>
                </div>`
    }

    render(content: Diagram): string {
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
