import { EditHost } from "../../types/edit_host";
import { TextCommand } from "../../types/text_command_types";
import { Change, pushHistory } from '../history';
import { NodeType } from '../md_node';
import { heal, newNode, splitNode } from '../operators';
import { getMDOffsetFromEditOffset as gmd, initLength, traverse } from '../traverse/traverse';
import { RangeOverlapType } from '../traverse/yielder/in_range';
import { registerAction } from './register_action.js';


function toggleItalics(edit_host: EditHost) {

    const {
        start_offset,
        end_offset
    } = edit_host,
        ng = edit_host.root.generation + 1;

    let
        changes: Change[] = [],
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
                switch (overlap_type) {
                    case RangeOverlapType.COMPLETE:
                        changes.push({ type: "remove", head: mh, tail: mt });
                        break;
                    case RangeOverlapType.PARTIAL_CONTAINED: {
                    } break;
                    case RangeOverlapType.PARTIAL_HEAD: {
                        changes.push({ type: "remove", head: mh });
                    } break;
                    case RangeOverlapType.PARTIAL_TAIL: {
                        changes.push({ type: "remove", tail: mt });
                    } break;
                }
                skip();
                continue;
            } else if (n.is(NodeType.ANCHOR) && overlap_type != RangeOverlapType.COMPLETE) {
                continue;
            }

            switch (overlap_type) {
                case RangeOverlapType.COMPLETE:
                    changes.push({ type: "add", head: mh, tail: mt });
                    replace(newNode(NodeType.ITALIC, [n], ng));
                    skip();
                    break;
                case RangeOverlapType.PARTIAL_CONTAINED: {
                    changes.push({ type: "add", head: gmd(n, os).md + mh, tail: gmd(n, os + ol).md + mh });
                    var { left, right: mid } = splitNode(n, os, ng);
                    var { left: mid, right } = splitNode(mid, ol, ng);
                    replace([left, newNode(NodeType.ITALIC, [mid], ng), right], ng);
                    skip();
                } break;
                case RangeOverlapType.PARTIAL_HEAD: {
                    changes.push({ type: "add", head: mh, tail: gmd(n, ol).md + mh });
                    const { left, right } = splitNode(n, ol, ng);
                    replace([newNode(NodeType.ITALIC, [left], ng), right], ng);
                    skip();
                } break;
                case RangeOverlapType.PARTIAL_TAIL: {
                    changes.push({ type: "add", head: gmd(n, os).md + mh, tail: mt });
                    const { left, right } = splitNode(n, os, ng);
                    replace([left, newNode(NodeType.ITALIC, [right], ng)], ng);
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
                overlap_start,
                overlap_length,
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

            changes.push({ type: "rem", head: mh, tail: mt });

            switch (overlap_type) {
                case RangeOverlapType.COMPLETE:
                    replace(node.children);
                    skip();
                    break;
                case RangeOverlapType.PARTIAL_CONTAINED: {
                    var { left, right: mid } = splitNode(node, overlap_start, ng);
                    var { left: mid, right } = splitNode(mid, overlap_length, ng);
                    replace([left, ...mid.children, right], ng);
                    skip();
                } break;
                case RangeOverlapType.PARTIAL_HEAD: {
                    const { left, right } = splitNode(node, overlap_length, ng);
                    replace([...left.children, right], ng);
                    skip();
                } break;
                case RangeOverlapType.PARTIAL_TAIL: {
                    const { left, right } = splitNode(node, overlap_start, ng);
                    replace([left, ...right.children], ng);
                    skip();
                } break;
            }
        }
    }

    edit_host.root = heal(edit_host.root, ng);

    for (const { node, meta: { head, tail } } of traverse(edit_host.root)
        .typeFilter(NodeType.ITALIC)
    ) {
        if (node.generation >= ng) {

        }
    }

    initLength(edit_host.root);

    debugger;

    pushHistory(edit_host, changes);

    return edit_host;
};

registerAction("edit", TextCommand.TOGGLE_ITALICS, toggleItalics);
