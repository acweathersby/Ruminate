import { WickLibrary } from '@candlelib/wick';

export interface Folder {

    type: "folder",
    id: number,
    name: string,
    path: string,
    items: (any)[],
    SHOW: boolean;
    sub_folders: Map<string, any>,
}

var Folder: Folder;

let INITIALIZED = false;

export function init(wick: WickLibrary, note) {

    if (INITIALIZED) return;

    INITIALIZED = true;

    const { objects: { ObservableSchemeClass } } = wick;

    Folder = class F extends ObservableSchemeClass implements Folder {
        type: "folder";
        id: number;
        name: string;

        path: string;
        items: (any)[];
        SHOW: boolean;
        sub_folders: Map<string, any>;

        constructor(name: string, path: string, ...items) {
            super({
                name, items
            }, {
                name: String,
                SHOW: Boolean,
                id: Number
            });
            this.items = [];
            this.type = "folder";
            this.SHOW = true;
            this.path = path;
            this.sub_folders = new Map;
        }
    };
}

export function createFolder(name, path): Folder {
    return new Folder(name, path);
}