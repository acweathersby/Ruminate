import { EditHost } from "../types/edit_host";
import { getProcessor } from './register_task';


export function undo(edit_host: EditHost) {
    if (edit_host.history_pointer > 0) {
        const command = edit_host.command_history[--edit_host.history_pointer];
        getProcessor("undo", command.type)(command.undo_data, edit_host);
    }
}

export function redo(edit_host: EditHost) {
    if (edit_host.history_pointer < edit_host.command_history.length) {
        const command = edit_host.command_history[edit_host.history_pointer++];
        getProcessor("redo", command.type)(command.redo_data, edit_host);
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

export function addOperation(op: any, edit_host) {
    applyHistoryFork(edit_host);
    edit_host.command_history.push(op);
    edit_host.history_pointer++;
}