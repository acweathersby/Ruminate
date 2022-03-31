import { EditHost } from "../../types/edit_host";
import { TextCommand } from "../../types/text_command_types";
import * as vw from '../view';
import * as code from '../code';
import * as ops from '../operators';
import * as history from '../history/history';
import { NodeClass, NodeType } from '../md_node';
import { initLength, traverse } from '../traverse/traverse';
import { registerAction } from './register_action';
import { insertText } from './insert_text';
import { resolveStemLine } from './resolve_stem_line';
async function insertLine(edit_host: EditHost) {

    const
        nonce = history.startRecording(edit_host),


        gen = edit_host.root.generation + 1;
    let
        { start_offset } = edit_host;

    if (history.IN_LINE_EDIT_MODE(edit_host)) {
        insertText(edit_host, " ");
        await resolveStemLine(edit_host);
        edit_host.end_offset = edit_host.start_offset;
        initLength(edit_host.root);
        history.endRecording(edit_host, nonce,);
        return;
    }

    for (const { node, meta } of
        traverse(edit_host.root)
            .classFilter(NodeClass.LINE)
            .rangeFilter(
                start_offset - 1,
                start_offset)
            .extract(edit_host)
            .makeReplaceable()
    ) {

        const { overlap_start, replace, md_head, md_tail, tail, head } = meta;

        if (node.is(NodeType.CODE_BLOCK)) {

            let TREAT_AS_CM_INSERT = true;

            if (overlap_start + 1 == tail - head) {
                // If the previous line is ``` then delete previous line
                // and create a new line
                if (code.getLastLine(node) == "```") {
                    code.removeText(node, overlap_start - 4, 4);
                    history.addDelete(md_head + node.pre_md_length + overlap_start - 4, 4);
                    edit_host.start_offset -= 4;
                    TREAT_AS_CM_INSERT = false;
                }
            }

            if (TREAT_AS_CM_INSERT) {

                history.addInsert(md_head + node.pre_md_length + overlap_start, "\n");

                replace(code.insertText(node, overlap_start, "\n"), gen);

                edit_host.start_offset++;

                continue;
            }
        }

        edit_host.NEW_LINE_MODE = true;

        const new_node = ops.newNode(
            NodeType.STEM_LINE,
            [ops.newNode(NodeType.STEM_HEADER, [], gen, " "),],
            gen
        );

        if (overlap_start + 1 == node.length) {
            history.addInsert(md_tail - node.post_md_length, "\n\n ");
            edit_host.start_offset++;
            replace([node, new_node], gen);
        } else if (overlap_start == 0) {
            edit_host.NEW_LINE_MODE = true;
            history.addInsert(md_tail, "\n\n ");
            edit_host.start_offset += 3;
            replace([new_node, node], gen);
        } else {

            const

                { left, right } = ops.splitNode(node, overlap_start + 1, gen, md_head),

                line_md_text = vw.toMDPreText(right).trimEnd();

            if (node.is(NodeType.PARAGRAPH))
                history.addInsert(md_head + left.md_length + node.pre_md_length, " ");

            new_node.children = [
                ops.newNode(
                    NodeType.STEM_HEADER,
                    [],
                    gen,
                    line_md_text.replace(/\n/g, "") + String.fromCodePoint(32) /* Zero Width Space */
                ),
                ...right.children
            ];

            if (node.is(NodeType.PARAGRAPH))
                edit_host.start_offset += node.pre_md_length;
            else
                edit_host.start_offset += node.pre_md_length + node.internal_md_length - 1;

            replace([left, new_node], gen);
        }
    }

    edit_host.end_offset = edit_host.start_offset;

    initLength(edit_host.root);

    history.endRecording(edit_host, nonce,);
};


registerAction("edit", TextCommand.INSERT_LINE, insertLine);