import { EditHost } from "../../types/edit_host";
import { TextCommand } from "../../types/text_command_types";
import * as history from '../history/history';
import { MDNode, NodeType } from '../md_node';
import * as ops from '../operators';
import { registerAction } from './register_action.js';

function setHeaderSize(
    edit_host: EditHost,
    node: MDNode<NodeType.HEADER>,
    size: 1 | 2 | 3 | 4 | 5 | 6,
) {

    if (typeof size != "number" || isNaN(size) || size < 1 || size > 6)
        return;

    const
        nonce = history.startRecording(edit_host),
        ng = edit_host.root.generation + 1;

    let offset = 0;

    for (const line of edit_host.root.children) {
        if (line == node)
            break;
        offset += line.md_length;
    }

    const current_size = node.meta;

    if (current_size > size) {
        const clone = ops.clone(node, ng);
        clone.meta = size;
        edit_host.root = ops.replace(edit_host.root, node, clone);
        history.addDelete(offset + node.pre_length, current_size - size);
    } else if (current_size < size) {
        const clone = ops.clone(node, ng);
        clone.meta = size;
        edit_host.root = ops.replace(edit_host.root, node, clone);
        history.addInsert(offset + node.pre_length, "#".repeat(size - current_size));
    }

    // initLength(edit_host.root);

    history.endRecording(edit_host, nonce);
};

registerAction("edit", TextCommand.SET_HEADER_SIZE, setHeaderSize);
