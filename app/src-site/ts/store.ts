/**
 * This module is responsible for ORM of Notes and Folders to 
 * their equivalents within the backing store. 
 */

import { WickLibrary } from '@candlelib/wick';
import { get_note_name } from "./tauri/bridge.js";
import * as crud from "./crud.js";
import * as bridge from "./tauri/bridge.js";
import { store } from '@candlelib/wick/build/client/runtime/db';
var Note, Folder;

let INITIALIZED = false;
export const folders = new Map;
export const notes = new Map;

export async function createNote(name = "test") {
    const note = getNoteByLocalId(await crud.createNote(name));
    note.name = await bridge.get_note_name(note.id);
    return note;
}

export function setFolders(
    id: number,
    existing_set: Set<number> = null
): Set<number> {
    if (existing_set) {
        if (existing_set.has(id)) {
            const new_set = new Set(existing_set);
            new_set.delete(id);
            return new_set;
        } else {
            return new Set([id, ...existing_set]);
        }
    } else {
        return new Set([id]);
    }
};

export function getNoteByLocalId(id: number) {
    if (!notes.has(id)) {
        notes.set(id, new Note(id,));
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

export async function getFolders(path: string = '/') {
    //@ts-ignore
    init(wick);

    root = new Folder("test");

    const note1 = await createNote("test1");
    const note2 = await createNote("test2");
    const note3 = await createNote("test3");
    const note4 = await createNote("test4");
    const note5 = await createNote("test5");

    root.items.push(
        note1,
        note2,
        note3,
        new Folder("marko",
            note4,
            note5,
            note1
        )
    );

    return [root];
}

export async function addNoteToFolder(note: any) {
    root.items.push(note);
}