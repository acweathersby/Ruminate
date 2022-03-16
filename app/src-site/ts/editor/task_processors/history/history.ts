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

export function resolveRecordings(edit_host: EditHost) {

    const cache = recording_data;
    recording_data = null;
    //TODO: Some kind of cleanup

    if (cache) {
        return cache;
    } else {
        return [];
    }
}

export async function endRecording(
    edit_host: EditHost,
    checked_out_nonce: number,
    start_offset: number = edit_host.start_offset,
    end_offset: number = edit_host.end_offset,
) {

    if (edit_host.root == root) {
        //No changes detected.
        recording_data = null;
        return;
    }

    if (checked_out_nonce != nonce || nonce < 0)
        return;


    const obj: HistoryTask = {
        state: edit_host.root,
        end_offset: end_offset,
        start_offset: start_offset,
        diffs: resolveRecordings(edit_host),
        clock: -1
    };

    edit_host.history.push(obj);
}

export function updatePointer(edit_host: EditHost) {

    const prev = edit_host.history[edit_host.history_pointer];

    if (prev) {
        prev.end_offset = edit_host.end_offset;
        prev.start_offset = edit_host.start_offset;
    }
}

export function applyDiffs(string: string, recordings: (DeleteDiff | InsertDiff)[]) {

    for (const data of recordings) {
        if (data instanceof InsertDiff) {
            string = string.slice(0, data.off) + data.txt + string.slice(data.off);
        } else {
            string = string.slice(0, data.off) + string.slice(data.off + data.len);
        }
    }

    return string;
}

export function enableLineEditMode(edit_host: EditHost) {
    edit_host.NEW_LINE_MODE = true;
}

export function disableLineEditMode(edit_host: EditHost) {
    edit_host.NEW_LINE_MODE = false;
}

export function IN_LINE_EDIT_MODE(edit_host: EditHost) {
    return edit_host.NEW_LINE_MODE;
}

export function sync(edit_host: EditHost) {

    if (IN_LINE_EDIT_MODE(edit_host))
        return;

    const {
        note_id,
        history
    } = edit_host;

    //Find last synced history
    let first = 0;

    for (const task of history) {
        if (task.clock < 0)
            break;
        first++;
    }

    const count = history.length - first;

    if (count > 0) {

        const
            last_state = history[history.length - 1],
            first_state = history[first],
            changes = history.slice(first, history.length).flatMap(i => i.diffs),
            outgoing_changes = [];

        let prev = null;

        for (let i = 0; i < changes.length; i++) {
            const change = changes[i];
            if (prev) {
                if (change instanceof InsertDiff) {
                    if (prev instanceof InsertDiff) {

                        const
                            prev_head = prev.off,
                            prev_tail = prev.txt.length,
                            off = change.off - prev_head;

                        if (off >= 0 && off <= prev_tail) {
                            prev.txt = prev.txt.slice(0, off)
                                + change.txt
                                + prev.txt.slice(off);
                            continue;
                        }
                    } else {
                        //debugger;
                    }
                } else {
                    if (prev instanceof InsertDiff) {

                        const
                            prev_head = prev.off,
                            prev_tail = prev.txt.length,
                            off = change.off - prev_head;

                        if (off >= 0 && off <= prev_tail) {
                            prev.txt = prev.txt.slice(0, off) + prev.txt.slice(Math.min(off + change.len, prev_tail));
                            const diff = off + change.len - prev_tail;
                            if (diff > 0) {
                                change.off = prev_tail;
                                change.len = diff;
                                outgoing_changes.push(change);
                            }
                            continue;
                        }
                    } else {
                        //debugger;
                    }
                }
            }


            outgoing_changes.push(change);
            prev = change;
        }

        last_state.clock = bridge.get_note_clock(edit_host.note_id);

        last_state.diffs = outgoing_changes;

        bridge.debug_print_note(note_id, "Pre Change");

        for (const change of outgoing_changes)
            if (change instanceof InsertDiff)
                bridge.insert_text(note_id, change.off, change.txt);
            else
                bridge.delete_text(note_id, change.off, change.len);

        bridge.debug_print_note(note_id, "Post Change");

        edit_host.history = history.slice(0, first).concat(last_state);

        edit_host.history_pointer = edit_host.history.length - 1;
    }
}