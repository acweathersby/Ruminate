import { MDNode, NodeType } from '../md_node';
import { EditHost } from "../../types/edit_host";
import { TextCommand } from '../../types/text_command_types';
import { pushHistory } from '../history';
import * as ops from '../operators';
import { registerAction } from './register_action';
import { getNodeAt } from '../traverse';

function insertText(edit_host: EditHost, new_text: string) {

    const {
        head, node, parents, tail
    } = getNodeAt(
        edit_host.root,
        edit_host.start_offset,
        NodeType.TEXT
    );

    if (edit_host.start_offset != edit_host.end_offset) {
        //Remove text between these two points before inserting.
    }

    //Check for situation where we want to either create a new node
    //or insert text data in a previous node.
    if (node.is(NodeType.TEXT)) {

        let new_node = ops.clone(node);
        const offset = edit_host.start_offset - head;

        new_node.meta =
            new_node.meta.slice(0, offset)
            +
            new_text
            +
            new_node.meta.slice(offset);
        let old_: MDNode = node;
        let new_: MDNode = new_node;

        for (const parent of parents) {
            new_ = ops.replace(parent, old_, new_);
            old_ = parent;
        }
        //@ts-ignore
        edit_host.root = new_;

        edit_host.start_offset += new_text.length;
        edit_host.end_offset = edit_host.start_offset;
    }

    pushHistory(edit_host);
};

registerAction("edit", TextCommand.INSERT_TEXT, insertText);