/**
 * This module is responsible for ORM of Notes and Folders to 
 * their equivalents within the backing store. 
 */

import { WickLibrary } from '@candlelib/wick';
import { get_note_name } from "../tauri/bridge";

var Note;

let INITIALIZED = false;
export const folders = new Map;
export const notes = new Map;


export async function note_id_to_proxy_note(id: number) {

    if (!notes.has(id)) {
        let name = await get_note_name(id);
        notes.set(id, new Note(id, name));

    }

    return notes.get(id);
}


export function init(wick: WickLibrary) {

    if (INITIALIZED) return;

    INITIALIZED = true;

    const { objects: { ObservableSchemeClass } } = wick;
    Note = class N extends ObservableSchemeClass {
        type: "note";
        id: number;

        constructor(id: number, name) {
            super({ id, name }, { name: String, id: Number });
            this.type = "note";
            notes.set(id, this);

        }
    };

    return Note;
}