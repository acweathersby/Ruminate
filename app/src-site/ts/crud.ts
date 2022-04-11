/**
 * This module is responsible for the creation, movement, and deletion 
 * of notes and folders
 */

import * as bridge from './tauri/bridge';

/**
 * Create a new note and set its name and path. 
 */
export async function createNote(
    name: string = ""
): Promise<number> {

    const note_id = await bridge.create_note();

    bridge.set_note_name(note_id, name);

    return note_id;
}

export async function addNoteToFolder(
    note_local_id: number,
    folder_path: string
): Promise<boolean> {
    return false;
}

export async function removeNoteFromFolder(
    note_local_id: number,
    folder_path: string
): Promise<boolean> {
    return false;
}


export async function getContainerList(
    path: string
) {
    return;
}