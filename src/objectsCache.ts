import { Settings } from "./settings"

interface Cache {
    [key: string]: {
        data: any,
    }
}

export class ObjectsCache {
    private _cache: Cache

    constructor() {
        this._cache = {}
    }

    addCachedObject(key: string, object: any) {
        this._cache[key] = {
            data: object,
        }
    }

    getCachedObject(key: string) {
        if (key in this._cache) {
            return this._cache[key].data
        }
        return undefined
    }

    clear() {
        this._cache = {}
    }
}
