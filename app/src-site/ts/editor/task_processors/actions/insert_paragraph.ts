import { EditHost } from "../../types/edit_host";
import { TextCommand } from "../../types/text_command_types";
import * as vw from '../view';
import * as code from '../code';
import * as ops from '../operators';
import * as history from '../history/history';
import { NodeClass, NodeType } from '../md_node';
import { initLength, traverse } from '../traverse/traverse';
import { registerAction } from './register_action';
function insertParagraph(edit_host: EditHost) {


    const
        nonce = history.startRecording(edit_host),

        gen = edit_host.root.generation + 1;

    for (const { node, meta: { overlap_start, replace, md_head } } of
        traverse(edit_host.root)
            .classFilter(NodeClass.LINE)
            .rangeFilter(
                edit_host.start_offset,
                edit_host.start_offset)
            .extract(edit_host)
            .makeReplaceable()
    ) {

        if (node.is(NodeType.CODE_BLOCK)) {

            //Insert new line into code block
            replace(code.insertText(node, overlap_start - 1, "\n"), gen);
            edit_host.start_offset++;
            continue;

        } else {

            // split the node into two, convert the right node into a 
            // stem line 
            const
                { left, right } = ops.splitNode(node, overlap_start, gen, md_head),
                line_md_text = vw.toMDPreText(right).replace(/\n/g, ""),
                stem = ops.newNode(
                    NodeType.STEM_LINE,
                    [
                        ops.newNode(NodeType.TEXT, [], gen, line_md_text),
                        ...right.children
                    ],
                    gen
                );

            edit_host.start_offset = overlap_start + line_md_text.length + right.pre_length;

            replace([left, stem], gen);

            edit_host.NEW_LINE_MODE = true;
        }
    }

    edit_host.end_offset = edit_host.start_offset;

    initLength(edit_host.root);

    history.endRecording(edit_host, nonce);
};


registerAction("edit", TextCommand.INSERT_PARAGRAPH, insertParagraph);