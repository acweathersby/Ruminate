import * as bridge from './tauri/bridge';
import * as store from './store';

/**
 * Create a new note and set its name and path. 
 */
export async function createNote(
    name: string = "New Note",
    path: string = "/"
): Promise<number> {

    const note_id = await bridge.create_note();

    bridge.set_note_name(note_id, name);

    bridge.set_note_container_path(note_id, path);

    store.addNoteToFolder(note_id);

    return note_id;
}


export async function getContainerList(
    path: string
) {
    return;
}