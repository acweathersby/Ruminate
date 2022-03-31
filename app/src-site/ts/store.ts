import { WickLibrary } from '@candlelib/wick';
import { get_note_name } from "./tauri/bridge.js";

var Note, Folder;

let INITIALIZED = false;
export const folders = new Map;
export const notes = new Map;


export function getNoteByLocalId(id: number) {
    init(wick);
    if (!notes.has(id)) {
        notes.set(id, new Note(
            id, "unnamed"
        ));
    }

    return notes.get(id);
}


export function init(wick: WickLibrary) {

    if (INITIALIZED) return;
    INITIALIZED = true;

    const { rt, objects: { ObservableSchemeClass } } = wick;
    Note = class N extends ObservableSchemeClass {
        type: "note";
        id: number;
        constructor(id: number, name: string) {
            super({ id, name }, { name: String, id: Number });
            this.type = "note";
            notes.set(id, this);
        }
    };

    Folder = class F extends ObservableSchemeClass {
        type: "folder";
        id: number;
        name: string;
        items: (any)[];
        SHOW: boolean;
        constructor(name: string, ...items) {
            super({
                name, items
            }, {
                items: [Note],
                name: String,
                SHOW: Boolean,
                id: Number
            });
            this.type = "folder";
            this.SHOW = true;
            const id = folders.size;
            this.id = id;
            folders.set(id, this);
        }
    };

    new Note(-1);
    new Folder("-/");
}

let root = null;

export function getFoldersById(...folder_id: number[]) {
    let f = [];
    for (const i of folder_id) {
        f.push(folders.get(i));
    }

    return f;
}

export function getFolders(path: string = '/') {
    //@ts-ignore
    init(wick);

    root = new Folder("test");

    root.items.push(
        new Note(1, "test1"),
        new Note(2, "test2"),
        new Note(3, "test3"),
        new Folder("marko",
            new Note(4, "test4"),
            new Note(5, "test5"),
            new Note(1, "test1")
        ));

    return [root];
}

export async function addNoteToFolder(note: number) {
    root.items.push(new Note(note, await get_note_name(note)));
}