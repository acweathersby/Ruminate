import { EditHost } from "../types/edit_host";
import { getProcessor } from './register_task';


export function undo(edit_host: EditHost) {
    if (edit_host.history_pointer >= 0) {
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

export function addOperation(op: any, edit_host) {
    edit_host.command_history.push(op);
    edit_host.history_pointer++;
}