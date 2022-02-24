import { EditHost } from "../../types/edit_host";
import { TextCommand } from "../../types/text_command_types";
import { pushHistory } from '../history';
import { NodeType } from '../md_node';
import { heal, newNode, splitNode } from '../operators';
import { initLength, traverse } from '../traverse/traverse';
import { RangeOverlapType } from '../traverse/yielder/in_range';
import { registerAction } from './register_action.js';

function toggleItalics(edit_host: EditHost) {
    const { start_offset, end_offset } = edit_host;
    let ranges = [
    ];

    let prev = start_offset;

    let ADD_ITALICS = false;
    let HAVE_ITALICS = false;

    for (const { node, meta: { head, tail, overlap_type, overlap_start, overlap_length } } of traverse(edit_host.root)
        .typeFilter(NodeType.ITALIC)
        .rangeFilter(start_offset, end_offset)
    ) {
        if (head - prev > 0)
            ADD_ITALICS = true;

        prev = tail;
        HAVE_ITALICS = true;
    }

    if (!HAVE_ITALICS)
        ADD_ITALICS = true;


    if (ADD_ITALICS) {

        for (const { node, meta: { head, tail, overlap_type, replace, overlap_start, overlap_length, skip } } of traverse(edit_host.root)
            .typeFilter(
                NodeType.CODE_INLINE,
                NodeType.TEXT,
                NodeType.BOLD,
                NodeType.IMAGE,
                NodeType.QUERY,
                NodeType.ANCHOR,
                NodeType.ITALIC
            )
            .rangeFilter(start_offset, end_offset)
            .makeSkippable()
            .extract(edit_host)
            .makeReplaceable()
        ) {
            if (node.is(NodeType.ITALIC)) {
                skip();
                continue;
            } else if (node.is(NodeType.ANCHOR) && overlap_type != RangeOverlapType.COMPLETE) {
                continue;
            }


            switch (overlap_type) {
                case RangeOverlapType.COMPLETE:
                    replace(newNode(NodeType.ITALIC, [node]));
                    skip();
                    break;
                case RangeOverlapType.PARTIAL_CONTAINED: {
                    var { left, right: mid } = splitNode(node, overlap_start);
                    var { left: mid, right } = splitNode(mid, overlap_length, node.generation);
                    replace([left, newNode(NodeType.ITALIC, [mid]), right]);
                    skip();
                } break;
                case RangeOverlapType.PARTIAL_HEAD: {
                    const { left, right } = splitNode(node, overlap_length);
                    replace([newNode(NodeType.ITALIC, [left]), right]);
                    skip();
                } break;
                case RangeOverlapType.PARTIAL_TAIL: {
                    const { left, right } = splitNode(node, overlap_start);
                    replace([left, newNode(NodeType.ITALIC, [right])]);
                    skip();
                } break;
            }
        }
    } else {
        for (const { node, meta: { head, tail, overlap_type, overlap_start, overlap_length, replace, skip } } of traverse(edit_host.root)
            .typeFilter(NodeType.ITALIC)
            .rangeFilter(start_offset, end_offset)
            .extract(edit_host)
            .makeReplaceable()
            .makeSkippable()
        ) {
            switch (overlap_type) {
                case RangeOverlapType.COMPLETE:
                    replace(node.children);
                    skip();
                    break;
                case RangeOverlapType.PARTIAL_CONTAINED: {
                    var { left, right: mid } = splitNode(node, overlap_start);
                    var { left: mid, right } = splitNode(mid, overlap_length, node.generation);
                    replace([left, ...mid.children, right]);
                    skip();
                } break;
                case RangeOverlapType.PARTIAL_HEAD: {
                    const { left, right } = splitNode(node, overlap_length);
                    replace([...left.children, right]);
                    skip();
                } break;
                case RangeOverlapType.PARTIAL_TAIL: {
                    const { left, right } = splitNode(node, overlap_start);
                    replace([left, ...right.children]);
                    skip();
                } break;
            }
        }
    }

    edit_host.root = heal(edit_host.root);

    initLength(edit_host.root);

    pushHistory(edit_host);

    return edit_host;
};

registerAction("edit", TextCommand.TOGGLE_ITALICS, toggleItalics);
