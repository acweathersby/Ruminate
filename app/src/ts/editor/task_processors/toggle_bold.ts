import { EditHost } from "../types/edit_host";
import { HistoryTask, TextCommand, TextCommandTask } from "../types/text_command_types";
import { updateMetrics } from './common.js';
import { addOperation } from './history.js';
import { registerTask } from './register_task.js';

type ToggleBoldTask = TextCommandTask[TextCommand.TOGGLE_BOLD];


function toggleBold(command: ToggleBoldTask, edit_host: EditHost) {

    redoToggleBold(command.data, edit_host);

    addOperation(
        <HistoryTask[TextCommand.TOGGLE_BOLD]>{
            type: TextCommand.TOGGLE_BOLD,
            redo_data: command.data,
            undo_data: command.data,
        }, edit_host
    );


};

function redoToggleBold(
    redo_data: HistoryTask[TextCommand.TOGGLE_BOLD]["redo_data"],
    edit_host: EditHost
) {

    updateMetrics(edit_host);


    let {
        start_offset, end_offset
    } = redo_data;
}


function undoToggleBold(
    undo_data: HistoryTask[TextCommand.TOGGLE_BOLD]["undo_data"],
    edit_host: EditHost
) {

    updateMetrics(edit_host);


    let {
        start_offset, end_offset
    } = undo_data;
}


registerTask("edit", TextCommand.TOGGLE_BOLD, toggleBold);
registerTask("undo", TextCommand.TOGGLE_BOLD, redoToggleBold);
registerTask("redo", TextCommand.TOGGLE_BOLD, undoToggleBold);
