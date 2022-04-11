import { EditHost } from "../../types/edit_host";
import * as view from '../view';
import * as history from '../history/history';
import * as ops from '../operators';
import { MDNode, NodeType } from '../md_node';
import { traverse } from '../traverse/traverse';
/**
 * 
 * @param edit_host 
 * @returns `true` if no longer in NEW_LINE_MODE
 */
export async function resolveStemLine(edit_host: EditHost) {

    // If current selection is not inside a stem line header then 
    // convert it into a regular line

    if (!edit_host.NEW_LINE_MODE)
        return;

    let start = edit_host.start_offset;
    let end = edit_host.end_offset;
    let gen = edit_host.root.generation + 1;

    history.disableLineEditMode(edit_host);

    const
        nonce = history.startRecording(edit_host);

    for (const { node, meta: { md_head, md_tail, replace, head, tail, skip } } of
        traverse(edit_host.root)
            .typeFilter(NodeType.STEM_LINE)
            .extract(edit_host)
            .makeReplaceable()
            .makeSkippable()
    ) {
        if (node.is(NodeType.STEM_LINE)) {

            const [first] = node.children;

            if (head <= end && tail >= start && (start - end) == 0) {

                const data = first.meta;
                if (start <= head + first.internal_length + node.pre_length) {
                    const index = (start - head - node.pre_length - 1);
                    const value = data[index];

                    if (value && value != " ") {
                        history.enableLineEditMode(edit_host);
                        continue;
                    }
                }
            }

            let new_node: MDNode;

            const
                children = node.children.slice(1),
                header = node.children[0],
                trailing_space_count = getTrailingSpaceCount(header.meta),
                tag = view.getStemTag(header),
                header_tail = md_head + node.pre_md_length + header.length - trailing_space_count;

            if (tag == "p") {

                let text = header.meta.slice(0, -1).trim();

                if (text.length > 0) {
                    text += " ";
                    history.addDelete(header_tail, trailing_space_count - 1);
                } else {
                    history.addDelete(header_tail, trailing_space_count);
                    edit_host.end_offset -= trailing_space_count - 1;
                    edit_host.start_offset -= trailing_space_count - 1;
                }

                new_node = ops.newNode(
                    NodeType.PARAGRAPH,
                    [ops.newNode(NodeType.TEXT, [], gen, text), ...children],
                    gen
                );

            } else {

                switch (tag) {
                    case "pre": {
                        new_node = ops.newNode(NodeType.CODE_BLOCK, [], gen, {
                            state: null,
                            view: null,
                            text: children.map(n => view.toMDString(n)).join(""),
                            syntax: header.meta.replace("```", "").trim(),
                        });

                        console.log({ md_head, md_tail, c: node.children[0].meta });

                        history.addInsert(md_tail, view.toMDPostText(new_node));

                        if (header.meta.slice(-1) == " ") {

                            history.addDelete(header_tail, trailing_space_count);

                            history.addInsert(header_tail, "\n");
                            // Remove this and replace with
                        }
                    } break;
                    case "quote":
                        new_node = ops.newNode(NodeType.QUOTE, children, gen, "");
                        break;
                    case "h1":
                        new_node = ops.newNode(NodeType.HEADER, children, gen, 1);
                        break;
                    case "h2":
                        new_node = ops.newNode(NodeType.HEADER, children, gen, 2);
                        break;
                    case "h3":
                        new_node = ops.newNode(NodeType.HEADER, children, gen, 3);
                        break;
                    case "h4":
                        new_node = ops.newNode(NodeType.HEADER, children, gen, 4);
                        break;
                    case "h5":
                        new_node = ops.newNode(NodeType.HEADER, children, gen, 5);
                        break;
                    case "h6":
                        new_node = ops.newNode(NodeType.HEADER, children, gen, 6);
                        break;
                }
                if (trailing_space_count > 1) {
                    history.addDelete(header_tail, trailing_space_count - 1);
                }
                const
                    t_head = head + node.pre_length,
                    tail = t_head + header.meta.length;

                if (edit_host.end_offset >= t_head) {
                    if (tail <= edit_host.end_offset) {
                        edit_host.end_offset -= header.meta.length;
                    } else {
                        const diff = edit_host.end_offset - t_head;
                        edit_host.end_offset -= diff;
                    }
                }

                if (edit_host.start_offset >= t_head) {
                    if (tail <= edit_host.start_offset) {
                        edit_host.start_offset -= header.meta.length;
                    } else {
                        const diff = edit_host.start_offset - t_head;
                        edit_host.start_offset -= diff;
                    }
                }

            }

            replace(new_node);
            skip();
        }
    }

    history.endRecording(edit_host, nonce);

    if (!history.IN_LINE_EDIT_MODE(edit_host))
        await history.sync(edit_host);

    return false;
};


function getTrailingSpaceCount(text: string) {


    let i = text.length - 1;

    for (; i >= 0; i--) {
        if (text[i] != " ")
            break;
    }

    return text.length - 1 - i;

}
