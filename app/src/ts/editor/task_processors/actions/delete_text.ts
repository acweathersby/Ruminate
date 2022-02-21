import { EditHost } from "../../types/edit_host";
import {
    TextCommand,
} from "../../types/text_command_types";
import { registerAction } from './register_action.js';

function deleteText(edit_host: EditHost) {


};



registerAction("edit", TextCommand.DELETE_TEXT, deleteText);
