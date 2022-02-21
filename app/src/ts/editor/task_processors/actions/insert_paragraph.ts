import { EditHost } from "../../types/edit_host";
import { TextCommand } from "../../types/text_command_types";
import { registerAction } from './register_action';


function insertParagraph(edit_host: EditHost) {
};



registerAction("edit", TextCommand.INSERT_PARAGRAPH, insertParagraph);