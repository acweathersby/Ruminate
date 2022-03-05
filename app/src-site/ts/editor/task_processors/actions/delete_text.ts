import { EditHost } from "../../types/edit_host";
import { TextCommand } from '../../types/text_command_types';
import * as code from '../code';
import * as history from '../history/history';
import * as ops from '../operators';
import { NodeClass, NodeType } from '../md_node';
import { initLength, traverse } from '../traverse/traverse';
import { RangeOverlapType } from '../traverse/yielder/in_range';
import { registerAction } from './register_action';


export function deleteText(edit_host: EditHost) {

    const
        nonce = history.startRecording(edit_host),

        { start_offset, end_offset, root } = edit_host,

        ng = edit_host.root.generation + 1;


    for (const { node, meta, reset, getAncestry } of traverse(edit_host.root)
        .skipRoot()
        .rangeFilter(start_offset, end_offset)
        .makeSkippable()
        .extract(edit_host)
        .makeReplaceable()
    ) {

        const {
            index,
            md_head,
            md_tail,
            prev,
            overlap_type,
            replace,
            overlap_start,
            overlap_length,
            skip
        } = meta;

        if (overlap_length == 0) continue;

        if (node.containsClass(NodeClass.LINE)) {
            if (node.is(NodeType.CODE_BLOCK)) {

                history.addDelete(md_head + overlap_start, overlap_length);

                replace(code.removeText(node, overlap_start - 1, overlap_length));

            } else if (overlap_start == 0) {
                if (RangeOverlapType.COMPLETE == overlap_type) {

                    meta.range_end -= node.length;

                    history.addDelete(md_head, md_tail - md_head);

                    replace(null, ng);

                    skip();
                } else if (prev && node.is(prev.type)) {
                    //Merge the two and then redo parsing
                    history.addDelete(
                        md_head - node.post_md_length,
                        node.post_md_length + node.pre_md_length
                    );

                    replace(null, ng);

                    const
                        parent = getAncestry()[0],
                        par_children = parent.children,
                        new_node = ops.clone(prev);

                    new_node.children = prev.children.concat(node.children);

                    meta.range_end--;

                    par_children[index - 1] = new_node;

                    parent.children = par_children;
                }
            }

        } else if (RangeOverlapType.COMPLETE == overlap_type) {

            history.addDelete(md_head, node.md_length);

            meta.range_end -= node.length;

            replace(null, ng);

            //skip();
        } else if (node.is(NodeType.TEXT)) {
            switch (overlap_type) {

                case RangeOverlapType.PARTIAL_CONTAINED: {

                    var
                        { left, right: mid } = ops.splitNode(node, overlap_start, ng, md_head),
                        { left: mid, right } = ops.splitNode(mid, overlap_length, ng, md_head);

                    [left, mid, right].forEach(initLength);

                    history.addDelete(md_head + left.md_length, mid.md_length);

                    meta.range_end -= overlap_length;

                    replace([left, right], ng);

                    skip();
                } break;

                case RangeOverlapType.PARTIAL_HEAD: {

                    const { left, right } = ops.splitNode(node, overlap_length, ng, md_head);

                    [left, right].forEach(initLength);

                    history.addDelete(md_head, left.md_length);

                    meta.range_end -= overlap_length;

                    replace([right], ng);

                    skip();
                } break;

                case RangeOverlapType.PARTIAL_TAIL: {

                    const { left, right } = ops.splitNode(node, overlap_start, ng, md_head);

                    [left, right].forEach(initLength);

                    history.addDelete(md_head + left.md_length, right.md_length);

                    meta.range_end -= overlap_length;

                    replace([left], ng);

                    skip();
                } break;
            }
        }
    }

    console.log({ start_offset });

    edit_host.root = ops.heal(edit_host.root, ng).node;

    initLength(edit_host.root);

    history.endRecording(edit_host, nonce);

    edit_host.start_offset = start_offset;
    edit_host.end_offset = edit_host.start_offset;
};



registerAction("edit", TextCommand.DELETE_TEXT, deleteText);
