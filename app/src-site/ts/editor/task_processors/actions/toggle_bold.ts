import { EditHost } from "../../types/edit_host";
import { TextCommand } from "../../types/text_command_types";
import { NodeType } from '../md_node';
import { registerAction } from './register_action.js';
import { toggleFormat } from "./toggle_format";

function toggleBold(edit_host: EditHost) {
    return toggleFormat(edit_host, NodeType.BOLD, "__", "__");
};

registerAction("edit", TextCommand.TOGGLE_BOLD, toggleBold);
