import { EditHost } from "../../types/edit_host";
import { TextCommand } from '../../types/text_command_types';
import { pushHistory } from '../history';
import { MDNode, NodeClass, NodeType } from '../md_node';
import * as ops from '../operators';
import * as code from '../code';
import { initLength, traverse } from '../traverse/traverse';
import { registerAction } from './register_action';
import { RangeOverlapType } from '../traverse/yielder/in_range';


function deleteText(edit_host: EditHost) {
    const { start_offset, end_offset } = edit_host;

    for (const { node, meta } of traverse(edit_host.root)
        .typeFilter(
            NodeType.CODE_INLINE,
            NodeType.TEXT,
            NodeType.ITALIC,
            NodeType.IMAGE,
            NodeType.QUERY,
            NodeType.ANCHOR,
            NodeType.BOLD,
            NodeType.PARAGRAPH
        )
        .rangeFilter(start_offset, end_offset)
        .makeSkippable()
        .extract(edit_host)
        .makeReplaceable()
    ) {
        const { head, tail, prev, overlap_type, replace, overlap_start, overlap_length, skip } = meta;
        if (overlap_length == 0) continue;

        if (node.containsClass(NodeClass.LINE)) {
            if (overlap_start == 0) {
                if (RangeOverlapType.COMPLETE) {
                    meta.range_end -= node.length;
                    replace(null);
                    skip();
                } else if (prev && node.is(prev.type)) {
                    debugger;
                    //prev.children.push(...node.children);
                    //replace(null, true);
                }
            }
        } else {
            switch (overlap_type) {
                case RangeOverlapType.COMPLETE: {
                    meta.range_end -= node.length;
                    replace(null);
                    skip();
                } break;
                case RangeOverlapType.PARTIAL_CONTAINED: {
                    var { left, right: mid } = ops.splitNode(node, overlap_start);
                    var { left: mid, right } = ops.splitNode(mid, overlap_length, node.generation);
                    initLength(mid);
                    meta.range_end -= overlap_length;
                    replace([left, right]);
                    skip();
                } break;
                case RangeOverlapType.PARTIAL_HEAD: {
                    const { left, right } = ops.splitNode(node, overlap_length);
                    meta.range_end -= overlap_length;
                    replace([right]);
                    skip();
                } break;
                case RangeOverlapType.PARTIAL_TAIL: {
                    const { left, right } = ops.splitNode(node, overlap_start);
                    meta.range_end -= overlap_length;
                    replace([left]);
                    skip();
                } break;
            }
        }
    }

    edit_host.start_offset = start_offset;
    edit_host.end_offset = edit_host.start_offset;
    edit_host.root = ops.heal(edit_host.root);
    initLength(edit_host.root);
    pushHistory(edit_host);
};



registerAction("edit", TextCommand.DELETE_TEXT, deleteText);
