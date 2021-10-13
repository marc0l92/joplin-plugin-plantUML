import { Diagram } from "./settings"

interface Cache {
    [key: string]: {
        data: Diagram,
    }
}

export class ObjectsCache {
    private _cache: Cache

    constructor() {
        this._cache = {}
    }

    addCachedObject(key: string, object: Diagram) {
        this._cache[key] = {
            data: object,
        }
    }

    getCachedObject(key: string): Diagram {
        if (key in this._cache) {
            return this._cache[key].data
        }
        return undefined
    }

    clear() {
        this._cache = {}
    }
}
