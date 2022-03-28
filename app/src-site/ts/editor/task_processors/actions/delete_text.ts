import { EditHost } from "../../types/edit_host.js";
import { TextCommand } from '../../types/text_command_types.js';
import * as code from '../code.js';
import * as history from '../history/history.js';
import * as ops from '../operators.js';
import { NodeClass, NodeType } from '../md_node.js';
import { initLength, traverse } from '../traverse/traverse.js';
import { RangeOverlapType } from '../traverse/yielder/in_range.js';
import { registerAction } from './register_action.js';


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

                if (overlap_type == RangeOverlapType.COMPLETE) {

                    meta.range_end -= node.length;

                    history.addDelete(md_head, node.md_length);

                    replace(null, ng);
                } else {


                    const
                        offset = Math.max(overlap_start - 1, 0),
                        o_length = overlap_start == 0
                            ? overlap_length - 1
                            : overlap_length;

                    history.addDelete(
                        md_head + node.pre_md_length + offset,
                        o_length
                    );

                    meta.range_end -= o_length;

                    replace(code.removeText(node, offset, o_length));
                }

            } else if (overlap_start == 0) {

                if (RangeOverlapType.COMPLETE == overlap_type) {

                    meta.range_end -= node.length;

                    history.addDelete(md_head, md_tail - md_head);

                    replace(null, ng);

                    skip();

                } else if (prev) {
                    // Normally, the contents of any line can be merged 
                    // into any other line. Since CODE_BLOCK lines represent
                    // raw character data that does not translate markdown syntax, 
                    // we must treat them differently. So we filter out cases where
                    // a line might be merged into a CODE_BLOCK.

                    if (!prev.is(NodeType.CODE_BLOCK)) {

                        let merge_node = null;

                        replace(null, ng);

                        if (node.is(NodeType.STEM_LINE)) {
                            if (!history.IN_LINE_EDIT_MODE(edit_host))
                                throw new Error("Stem node encountered while not in edit line mode");
                            merge_node = node;
                            history.disableLineEditMode(edit_host);
                        } else {

                            const
                                { left, right } = ops.splitNode(
                                    node,
                                    overlap_length,
                                    ng,
                                    md_head,
                                    false
                                );

                            merge_node = right;

                            history.addDelete(
                                md_head - prev.post_md_length,
                                prev.post_md_length
                                + node.pre_md_length
                                + left.md_length
                                - left.post_md_length
                                - left.pre_md_length
                            );
                        }

                        const
                            parent = getAncestry()[0],
                            par_children = parent.children,
                            new_node = ops.clone(prev, ng);

                        new_node.children = prev.children.concat(merge_node.children);

                        meta.range_end -= overlap_length;

                        par_children[index - 1] = new_node;

                        parent.children = par_children;
                    } else {
                        if (prev.length == 1) {
                            //Delete this node. 
                        }
                    }
                } else {
                    debugger;
                }
            }

        } else if (RangeOverlapType.COMPLETE == overlap_type) {

            history.addDelete(md_head, node.md_length);

            meta.range_end -= node.length;

            replace(null, ng);

        } else if (node.is(NodeType.TEXT, NodeType.STEM_HEADER)) {

            switch (overlap_type) {

                case RangeOverlapType.PARTIAL_CONTAINED: {

                    var
                        { left, right: mid } = ops.splitNode(node, overlap_start, ng, md_head),
                        { left: mid, right } = ops.splitNode(mid, overlap_length, ng, md_head);

                    history.addDelete(md_head + left.md_length, mid.md_length);

                    meta.range_end -= overlap_length;

                    replace([left, right], ng);

                    skip();
                } break;

                case RangeOverlapType.PARTIAL_HEAD: {

                    const { left, right } = ops.splitNode(node, overlap_length, ng, md_head);

                    history.addDelete(md_head, left.md_length);

                    meta.range_end -= overlap_length;

                    replace(right, ng);

                    skip();
                } break;

                case RangeOverlapType.PARTIAL_TAIL: {

                    const { left, right } = ops.splitNode(node, overlap_start, ng, md_head);

                    history.addDelete(md_head + left.md_length, right.md_length);

                    meta.range_end -= overlap_length;

                    replace(left, ng);

                    skip();
                } break;
            }
        }
    }

    edit_host.root = ops.heal(edit_host.root, ng).node;

    initLength(edit_host.root);

    history.endRecording(edit_host, nonce);

    edit_host.start_offset = start_offset;
    edit_host.end_offset = edit_host.start_offset;
};



registerAction("edit", TextCommand.DELETE_TEXT, deleteText);
