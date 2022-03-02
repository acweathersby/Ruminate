import { EditHost } from "../types/edit_host";


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

export interface Change {
    type: "add" | "delete",

    offset: number;

    text?: string;

    length?: number;
}

export function pushHistory(edit_host: EditHost, change_set: Change[]) {
    //applyHistoryFork(edit_host);

    edit_host.command_history.push({
        state: edit_host.root,
        end_offset: edit_host.end_offset,
        start_offset: edit_host.start_offset
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