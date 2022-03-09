import { EditHost } from "../../types/edit_host";
import { DeleteDiff, InsertDiff } from './changes.js';
import { MDNode, NodeType } from '../md_node';
import * as bridge from "../../../tauri/bridge";
import { HistoryTask } from '../../types/text_command_types';


export function undo(edit_host: EditHost) {

    if (edit_host.history_pointer > 0) {
        const command = edit_host.history[--edit_host.history_pointer];
        edit_host.root = command.state;
        edit_host.start_offset = command.start_offset;
        edit_host.end_offset = command.end_offset;
    }
}

export function redo(edit_host: EditHost) {
    if (edit_host.history_pointer < edit_host.history.length - 1) {
        const command = edit_host.history[++edit_host.history_pointer];
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
    if (edit_host.history_pointer < edit_host.history.length) {
        edit_host.history = edit_host.history.slice(0, edit_host.history_pointer);
    }
}


let recording_data: (DeleteDiff | InsertDiff)[] = null;
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
        recording_data.push(new DeleteDiff(md_offset, length));
    }
}

export function addInsert(md_offset: number, text: string) {
    if (recording_data)
        recording_data.push(new InsertDiff(md_offset, text));
}

export function processRecordings(edit_host: EditHost) {

    const cache = recording_data;
    recording_data = null;
    //TODO: Some kind of cleanup

    if (cache) {

        const { note_id } = edit_host;

        bridge.debug_print_note(note_id, "Pre Change");

        for (const obj of cache) {
            if (obj instanceof InsertDiff) {
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

export async function endRecording(edit_host: EditHost, checked_out_nonce: number) {

    if (edit_host.root == root) {
        //No changes detected.
        recording_data = null;
        return;
    }

    if (checked_out_nonce != nonce || nonce < 0)
        return;


    const obj = <HistoryTask>{
        state: edit_host.root,
        end_offset: edit_host.end_offset,
        start_offset: edit_host.start_offset,
        diffs: processRecordings(edit_host),
        clock: -1
    };

    edit_host.history.push(obj);

    edit_host.history_pointer++;

    obj.clock = await bridge.get_note_clock(edit_host.note_id);
}

export function updatePointer(edit_host: EditHost) {

    const prev = edit_host.history[edit_host.history_pointer];

    if (prev) {
        prev.end_offset = edit_host.end_offset;
        prev.start_offset = edit_host.start_offset;
    }
}

export function applyDiffs(string: string, recordings: (DeleteDiff | InsertDiff)[]) {
    console.log(recordings[0] instanceof InsertDiff);
    for (const data of recordings) {
        if (data instanceof InsertDiff) {
            string = string.slice(0, data.off) + data.txt + string.slice(data.off);
        } else {
            string = string.slice(0, data.off) + string.slice(data.off + data.len);
        }
    }

    return string;
}

