import { WickLibrary } from '@candlelib/wick';
import { get_note_name } from "./tauri/bridge.js";

var Note, Folder;

let INITIALIZED = false;
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

        }
    };

    Folder = class F extends ObservableSchemeClass {
        type: "folder";
        name: string;
        items: (any)[];
        constructor(name: string, ...items) {
            super({
                name, items
            }, {
                items: [Note],
                name: String
            });
            this.type = "folder";
        }
    };

    new Note();
    new Folder();
}

let root = null;

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