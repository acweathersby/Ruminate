import { EditHost } from "../../types/edit_host";
import { TextCommand } from '../../types/text_command_types';
import { pushHistory } from '../history';
import { MDNode, NodeClass, NodeType } from '../md_node';
import * as ops from '../operators';
import * as code from '../code';
import { initLength, traverse } from '../traverse/traverse';
import { registerAction } from './register_action';

function insertText(edit_host: EditHost, new_text: string) {

    if (edit_host.start_offset != edit_host.end_offset) {
        //Remove text between these two points before inserting.
    }

    let UPDATED = false;

    for (const { node, meta: { overlap_start, replace } } of
        traverse(edit_host.root)
            .typeFilter(NodeType.TEXT, NodeType.CODE_BLOCK)
            .rangeFilter(edit_host.start_offset, edit_host.start_offset)
            .extract(edit_host)
            .makeReplaceable()
    ) {
        if (node.is((NodeType.TEXT))) {
            replace(insertTextNode(node, overlap_start, new_text));
            UPDATED = true;
        } else if (node.is(NodeType.CODE_BLOCK) && overlap_start > 0) {
            replace(code.insertText(node, overlap_start - 1, new_text));
            UPDATED = true;
        }
    }

    if (!UPDATED) {
        //Need to select or add a text area to the end of a line
        for (const { node, meta: { overlap_start, replace } } of
            traverse(edit_host.root)
                .typeFilter(NodeType.TEXT, NodeType.CODE_BLOCK, NodeType.QUERY)
                .rangeFilter(edit_host.start_offset - 1, edit_host.start_offset - 1)
                .extract(edit_host)
                .makeReplaceable()
        ) {
            if (node.is(NodeType.TEXT)) {
                replace(insertTextNode(node, node.length, new_text));
            } else if (node.is(NodeType.QUERY)) {
                const new_node = ops.newNode(NodeType.TEXT);
                new_node.meta = new_text;
                replace([node, new_node]);
            } else if (node.is(NodeType.CODE_BLOCK)) {
                replace(code.insertText(node, node.length - 1, new_text));
            }
        }
    }

    edit_host.start_offset += new_text.length;
    edit_host.end_offset = edit_host.start_offset;

    initLength(edit_host.root);
    pushHistory(edit_host);
};

registerAction("edit", TextCommand.INSERT_TEXT, insertText);

function insertTextNode(
    node: MDNode<NodeType.TEXT>,
    split_point: number,
    new_text: string
) {
    let new_node = ops.clone(node);


    new_node.meta =
        new_node.meta.slice(0, split_point)
        +
        new_text
        +
        new_node.meta.slice(split_point);
    return new_node;
}
