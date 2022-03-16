import { EditHost } from "../../types/edit_host";
import { TextCommand } from '../../types/text_command_types';
import * as code from '../code';
import * as history from '../history/history';
import { NodeClass, NodeType } from '../md_node';
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

    for (const { node, meta } of
        traverse(edit_host.root)
            .typeFilter(NodeType.TEXT, NodeType.STEM_HEADER, NodeType.CODE_BLOCK)
            .rangeFilter(edit_host.start_offset, edit_host.start_offset)
            .extract(edit_host)
            .makeReplaceable()
    ) {

        const { overlap_start, replace, md_head, md_tail } = meta;

        if (node.is(NodeType.TEXT, NodeType.STEM_HEADER)) {
            history.addInsert(md_head + overlap_start, new_text);
            replace(ops.insertTextNode(node, overlap_start, new_text, gen), gen);
            UPDATED = true;
        } else if (node.is(NodeType.CODE_BLOCK) && overlap_start > 0) {

            const
                offset = Math.max(overlap_start - 1, 0);

            history.addInsert(md_head + node.pre_md_length + offset, new_text);

            replace(code.insertText(node, offset, new_text), gen);

            UPDATED = true;
        }
    }

    if (!UPDATED) {
        //Need to select or add a text area to the end of a line
        for (const { node, meta: { md_tail, md_head, replace } } of
            traverse(edit_host.root)
                .typeFilter(NodeType.TEXT, NodeType.CODE_BLOCK, NodeType.QUERY)
                .rangeFilter(edit_host.start_offset - 1, edit_host.start_offset - 1)
                .extract(edit_host)
                .makeReplaceable()
        ) {

            if (node.is(NodeType.TEXT)) {
                history.addInsert(md_tail, new_text);
                replace(ops.insertTextNode(node, node.length, new_text, gen), gen);
                UPDATED = true;
            } else if (node.is(NodeType.QUERY)) {
                history.addInsert(md_tail, new_text);
                const new_node = ops.newNode(NodeType.TEXT);
                new_node.meta = new_text;
                replace([node, new_node], gen);
                UPDATED = true;
            } else if (node.is(NodeType.CODE_BLOCK)) {
                history.addInsert(md_head + node.pre_md_length + node.internal_md_length, new_text);
                replace(code.insertText(node, node.length - 1, new_text), gen);
                UPDATED = true;
            }
        }
    }

    if (!UPDATED) {
        //Add node to empty line
        for (const { node, meta: { md_head, overlap_start, replace } } of
            traverse(edit_host.root)
                .classFilter(NodeClass.LINE)
                .rangeFilter(edit_host.start_offset - 1, edit_host.start_offset - 1)
                .extract(edit_host)
                .makeReplaceable()
        ) {


            const new_node = ops.clone(node, gen);

            history.addInsert(md_head + node.pre_md_length + node.internal_md_length, new_text);

            new_node.children = [ops.newNode(NodeType.TEXT, [], gen, new_text)];

            replace(new_node);

        }
    }

    edit_host.start_offset += new_text.length;

    edit_host.end_offset = edit_host.start_offset;

    initLength(edit_host.root);

    history.endRecording(edit_host, nonce);
};

registerAction("edit", TextCommand.INSERT_TEXT, insertText);
