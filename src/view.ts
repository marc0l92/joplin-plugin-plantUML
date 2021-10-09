// import * as Templater from 'templater.js'
import { Settings } from "./settings"

export class View {
    private _settings: Settings

    constructor(settings: Settings) {
        this._settings = settings
    }

    renderImage(imageUrl: any): string {
        console.log('renderImage', imageUrl, this._settings)
        // return htmlTemplate(getIssueProperties(issue, this._settings))
        return 'renderImage: '+imageUrl
    }

    renderError(query: string, error: string): string {
        console.log('renderError', query, error)
        // const template = Templater(Templates.error)

        // return template({
        //     query: query,
        //     error: error.toString(),
        // })
        return 'renderError: '+error
    }
}

// const Templates = {
//     error: `
//         <details class="jira-issue">
//             <summary class="flex-center">
//                 <span class="error-circle">X</span>
//                 <span>Error</span>
//                 <span>:</span>
//                 <span>{{error}}</span>
//             </summary>
//             <div class="flex-center">
//                 <span><strong>Query:</strong> {{query}}</span>
//             </div>
//         </details>
//     `,
// }