import { EditHost } from "../../types/edit_host";
import { TextCommand } from "../../types/text_command_types";
import * as history from '../history/history';
import { NodeType } from '../md_node';
import * as ops from '../operators';
import { getMDOffsetFromEditOffset as gmd, initLength, traverse } from '../traverse/traverse';
import { RangeOverlapType } from '../traverse/yielder/in_range';
import { registerAction } from './register_action.js';

function toggleItalics(edit_host: EditHost) {
    const
        nonce = history.startRecording(edit_host),
        {
            start_offset,
            end_offset
        } = edit_host,
        ng = edit_host.root.generation + 1;

    let
        prev = start_offset,
        ADD_ITALICS = false,
        HAVE_ITALICS = false;

    for (const { meta: { head, tail } } of traverse(edit_host.root)
        .typeFilter(NodeType.ITALIC)
        .rangeFilter(start_offset, end_offset)
    ) {
        if (head - prev > 0)
            ADD_ITALICS = true;

        prev = tail;
        HAVE_ITALICS = true;
    }

    if (!HAVE_ITALICS || prev < end_offset)
        ADD_ITALICS = true;

    if (ADD_ITALICS) {

        for (const { node: n, meta: {
            md_head: mh,
            md_tail: mt,
            overlap_type,
            replace,
            overlap_start: os,
            overlap_length: ol,
            skip
        } } of traverse(edit_host.root)
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

            if (ol == 0)
                continue;

            if (n.is(NodeType.ITALIC)) {
                skip();
                continue;
            } else if (n.is(NodeType.ANCHOR) && overlap_type != RangeOverlapType.COMPLETE) {
                continue;
            }

            switch (overlap_type) {
                case RangeOverlapType.COMPLETE:
                    history.addInsert(mt, "*");
                    history.addInsert(mh, "*");
                    replace(ops.newNode(NodeType.ITALIC, [n], ng));
                    skip();
                    break;
                case RangeOverlapType.PARTIAL_CONTAINED: {
                    var { left, right: mid } = ops.splitNode(n, os, ng);
                    var { left: mid, right } = ops.splitNode(mid, ol, ng);
                    history.addInsert(mh + left.md_length + mid.md_length, "*");
                    history.addInsert(mh + left.md_length, "*");
                    replace([left, ops.newNode(NodeType.ITALIC, [mid], ng), right], ng);
                    skip();
                } break;
                case RangeOverlapType.PARTIAL_HEAD: {
                    const { left, right } = ops.splitNode(n, ol, ng);
                    history.addInsert(mh + left.md_length, "*");
                    history.addInsert(mh, "*");
                    replace([ops.newNode(NodeType.ITALIC, [left], ng), right], ng);
                    skip();
                } break;
                case RangeOverlapType.PARTIAL_TAIL: {
                    const { left, right } = ops.splitNode(n, os, ng);
                    history.addInsert(mh + left.md_length + right.md_length, "*");
                    history.addInsert(mh + left.md_length, "*");
                    replace([left, ops.newNode(NodeType.ITALIC, [right], ng)], ng);
                    skip();
                } break;
            }
        }
    } else {
        for (const { node,
            meta: {
                md_head: mh,
                md_tail: mt,
                overlap_type,
                overlap_start: os,
                overlap_length: ol,
                replace,
                skip
            }
        } of traverse(edit_host.root)
            .typeFilter(NodeType.ITALIC)
            .rangeFilter(start_offset, end_offset)
            .extract(edit_host)
            .makeReplaceable()
            .makeSkippable()
        ) {

            switch (overlap_type) {
                case RangeOverlapType.COMPLETE: {
                    history.addDelete(mt - 1, 1);
                    history.addDelete(mh, 1);
                    replace(node.children);
                    skip();
                } break;
                case RangeOverlapType.PARTIAL_CONTAINED: {
                    var { left, right: mid } = ops.splitNode(node, os, ng);
                    var { left: mid, right } = ops.splitNode(mid, ol, ng);
                    history.addInsert(mt - (right.md_length - 1), "*");
                    history.addInsert(mh + left.md_length, "*");
                    replace([left, ...mid.children, right], ng);
                    skip();
                } break;
                case RangeOverlapType.PARTIAL_HEAD: {
                    const { left, right } = ops.splitNode(node, ol, ng);
                    history.addInsert(mt - (right.md_length - 1), "*");
                    history.addDelete(mh, 1);
                    replace([...left.children, right], ng);
                    skip();
                } break;
                case RangeOverlapType.PARTIAL_TAIL: {
                    const { left, right } = ops.splitNode(node, os, ng);
                    history.addDelete(mt - 1, 1);
                    history.addInsert(mh + (left.md_length - 1), "*");
                    replace([left, ...right.children], ng);
                    skip();
                } break;
            }
        }
    }

    edit_host.root = ops.heal(edit_host.root, ng).node;

    initLength(edit_host.root);

    history.endRecording(edit_host, nonce);
};

registerAction("edit", TextCommand.TOGGLE_ITALICS, toggleItalics);
