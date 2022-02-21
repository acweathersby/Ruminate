import { EditHost } from "../../types/edit_host";
import { TextCommand } from "../../types/text_command_types";
import { registerAction } from './register_action.js';


function toggleBold(edit_host: EditHost) {

};


registerAction("edit", TextCommand.TOGGLE_BOLD, toggleBold);
