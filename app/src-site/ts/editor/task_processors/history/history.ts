import { EditHost } from "../../types/edit_host";
import { DeleteAction, AddAction } from './changes';
import { MDNode, NodeType } from '../md_node';
import * as bridge from "../../../tauri/bridge";


export function undo(edit_host: EditHost) {

    if (edit_host.history_pointer > 0) {
        const command = edit_host.command_history[--edit_host.history_pointer];
        edit_host.root = command.state;
        edit_host.start_offset = command.start_offset;
        edit_host.end_offset = command.end_offset;
    }
}

export function redo(edit_host: EditHost) {
    if (edit_host.history_pointer < edit_host.command_history.length - 1) {
        const command = edit_host.command_history[++edit_host.history_pointer];
        edit_host.root = command.state;
        edit_host.start_offset = command.start_offset;
        edit_host.end_offset = command.end_offset;
    }
}

/**
 * Forks the history if the history pointer is not at the tip of the 
 * history command list.
 * 
 * Current implementation simply clears history that occurs after the
 * current history command
 * @param edit_host 
 */
export function applyHistoryFork(edit_host: EditHost) {
    if (edit_host.history_pointer < edit_host.command_history.length) {
        edit_host.command_history = edit_host.command_history.slice(0, edit_host.history_pointer);
    }
}


let recording_data: (DeleteAction | AddAction)[] = null;
let root: MDNode<NodeType.ROOT> = null;
let nonce = 0;

/**
 * Start recording changes to edit data.
 * @param edit_host 
 */
export function startRecording(edit_host: EditHost): number {
    if (!recording_data) {
        recording_data = [];
        root = edit_host.root;
        return ++nonce;
    }
    return -1;
}

export function addDelete(md_offset: number, length: number) {
    if (recording_data) {
        recording_data.push(new DeleteAction(md_offset, length));
    }
}

export function addInsert(md_offset: number, text: string) {
    if (recording_data)
        recording_data.push(new AddAction(md_offset, text));
}

export function processRecordings(edit_host: EditHost) {
    const cache = recording_data;
    recording_data = null;
    //TODO: Some kind of cleanup

    if (cache) {

        const { note_id } = edit_host;

        bridge.debug_print_note(note_id, "Pre Change");

        for (const obj of cache) {
            if (obj instanceof AddAction) {
                bridge.insert_text(note_id, obj.off, obj.txt);
            } else {
                bridge.delete_text(note_id, obj.off, obj.len);
            }
        }

        bridge.debug_print_note(note_id, "Post Change");

        return cache;
    } else {
        return [];
    }
}

export function endRecording(edit_host: EditHost, checked_out_nonce: number) {

    if (nonce < 0 || edit_host.root == root) {
        recording_data = null;
        return;
    }

    if (checked_out_nonce != nonce)
        return;

    edit_host.command_history.push({
        state: edit_host.root,
        end_offset: edit_host.end_offset,
        start_offset: edit_host.start_offset,
        recordings: processRecordings(edit_host)
    });

    edit_host.history_pointer++;
}

export function updatePointer(edit_host: EditHost) {

    const prev = edit_host.command_history[edit_host.history_pointer];

    if (prev) {
        prev.end_offset = edit_host.end_offset;
        prev.start_offset = edit_host.start_offset;
    }
}

