import { EditHost } from "../../types/edit_host";
import { TextCommand } from '../../types/text_command_types';
import * as code from '../code';
import * as history from '../history/history';
import { NodeType } from '../md_node';
import * as ops from '../operators';
import { initLength, traverse } from '../traverse/traverse';
import { deleteText } from './delete_text';
import { registerAction } from './register_action';
function insertText(edit_host: EditHost, new_text: string) {

    const
        nonce = history.startRecording(edit_host),

        gen = edit_host.root.generation + 1;

    if (edit_host.start_offset != edit_host.end_offset) {
        //Remove text between these two points before inserting.
        deleteText(edit_host);
    }

    let UPDATED = false;

    for (const { node, meta: { md_head, md_tail, overlap_start, replace } } of
        traverse(edit_host.root)
            .typeFilter(NodeType.TEXT, NodeType.CODE_BLOCK)
            .rangeFilter(edit_host.start_offset, edit_host.start_offset)
            .extract(edit_host)
            .makeReplaceable()
    ) {

        history.addInsert(md_head + overlap_start, new_text);

        if (node.is((NodeType.TEXT))) {
            replace(ops.insertTextNode(node, overlap_start, new_text, gen), gen);
            UPDATED = true;
        } else if (node.is(NodeType.CODE_BLOCK) && overlap_start > 0) {
            replace(code.insertText(node, overlap_start - 1, new_text), gen);
            UPDATED = true;
        }
    }

    if (!UPDATED) {
        //Need to select or add a text area to the end of a line
        for (const { node, meta: { md_tail, overlap_start, replace } } of
            traverse(edit_host.root)
                .typeFilter(NodeType.TEXT, NodeType.CODE_BLOCK, NodeType.QUERY)
                .rangeFilter(edit_host.start_offset - 1, edit_host.start_offset - 1)
                .extract(edit_host)
                .makeReplaceable()
        ) {

            history.addInsert(md_tail, new_text);

            if (node.is(NodeType.TEXT)) {
                replace(ops.insertTextNode(node, node.length, new_text, gen), gen);
            } else if (node.is(NodeType.QUERY)) {
                const new_node = ops.newNode(NodeType.TEXT);
                new_node.meta = new_text;
                replace([node, new_node], gen);
            } else if (node.is(NodeType.CODE_BLOCK)) {
                replace(code.insertText(node, node.length - 1, new_text), gen);
            }
        }
    }

    edit_host.start_offset += new_text.length;
    
    edit_host.end_offset = edit_host.start_offset;

    initLength(edit_host.root);

    history.endRecording(edit_host, nonce);
};

registerAction("edit", TextCommand.INSERT_TEXT, insertText);
