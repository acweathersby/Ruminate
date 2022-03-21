import { EditHost } from "../../types/edit_host";
import * as history from '../history/history';
import { NodeType } from '../md_node';
import * as ops from '../operators';
import { initLength, traverse } from '../traverse/traverse';
import { RangeOverlapType } from '../traverse/yielder/in_range';


export function toggleFormat<T extends NodeType>(
    edit_host: EditHost,
    NODE_TYPE: T,
    start_sentinel = "",
    end_sentinel = ""

) {

    const
        start_len = start_sentinel.length,
        end_len = end_sentinel.length,
        nonce = history.startRecording(edit_host),
        { start_offset, end_offset } = edit_host,
        ng = edit_host.root.generation + 1;

    let
        prev = start_offset, ADD_FORMATTING = false, HAVE_ITALICS = false;

    for (const { meta: { head, tail } } of traverse(edit_host.root)
        .typeFilter(NODE_TYPE)
        .rangeFilter(start_offset, end_offset)) {
        if (head - prev > 0)
            ADD_FORMATTING = true;

        prev = tail;
        HAVE_ITALICS = true;
    }

    if (!HAVE_ITALICS || prev < end_offset)
        ADD_FORMATTING = true;

    if (ADD_FORMATTING) {

        for (const { node: n, meta } of traverse(edit_host.root)
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
            .makeReplaceable()) {

            const {
                md_head: mh, md_tail: mt, overlap_type, replace, overlap_start: os, overlap_length: ol, skip
            } = meta;

            if (ol == 0)
                continue;

            if (n.is(NODE_TYPE)) {
                skip();
                continue;
            } else if (n.is(NodeType.ANCHOR) && overlap_type != RangeOverlapType.COMPLETE) {
                continue;
            }

            if (n.is(NodeType.TEXT)) {
                switch (overlap_type) {
                    case RangeOverlapType.COMPLETE:
                        history.addInsert(mt, end_sentinel);
                        history.addInsert(mh, start_sentinel);
                        replace(ops.newNode(NODE_TYPE, [n], ng));
                        skip();
                        break;
                    case RangeOverlapType.PARTIAL_CONTAINED: {
                        var { left, right: mid } = ops.splitNode(n, os, ng, mh);
                        var { left: mid, right } = ops.splitNode(mid, ol, ng, left.md_length + mh);
                        history.addInsert(mh + left.md_length + mid.md_length, end_sentinel);
                        history.addInsert(mh + left.md_length, start_sentinel);
                        replace([left, ops.newNode(NODE_TYPE, [mid], ng), right], ng);
                        skip();
                    } break;
                    case RangeOverlapType.PARTIAL_HEAD: {
                        const { left, right } = ops.splitNode(n, ol, ng, mh);
                        history.addInsert(mh + left.md_length, end_sentinel);
                        history.addInsert(mh, start_sentinel);
                        replace([ops.newNode(NODE_TYPE, [left], ng), right], ng);
                        skip();
                    } break;
                    case RangeOverlapType.PARTIAL_TAIL: {
                        const { left, right } = ops.splitNode(n, os, ng, mh);
                        history.addInsert(mh + left.md_length + right.md_length, end_sentinel);
                        history.addInsert(mh + left.md_length, start_sentinel);
                        replace([left, ops.newNode(NODE_TYPE, [right], ng)], ng);
                        skip();
                    } break;
                }
            }
        }
    } else {
        for (const { node, meta: {
            md_head: mh, md_tail: mt, overlap_type, overlap_start: os, overlap_length: ol, replace, skip
        }
        } of traverse(edit_host.root)
            .typeFilter(NODE_TYPE)
            .rangeFilter(start_offset, end_offset)
            .extract(edit_host)
            .makeReplaceable()
            .makeSkippable()) {

            if (ol == 0)
                continue;

            switch (overlap_type) {
                case RangeOverlapType.COMPLETE: {
                    history.addDelete(mt - end_len, end_len);
                    history.addDelete(mh, start_len);
                    replace(node.children);
                    skip();
                } break;
                case RangeOverlapType.PARTIAL_CONTAINED: {
                    var { left, right: mid } = ops.splitNode(node, os, ng, mh);
                    var { left: mid, right } = ops.splitNode(mid, ol, ng, mh + left.md_length);
                    history.addDelete(mh + left.md_length + mid.md_length - end_len, end_len);
                    history.addDelete(mh + left.md_length, start_len);
                    replace([left, ...mid.children, right], ng);
                    skip();
                } break;
                case RangeOverlapType.PARTIAL_HEAD: {
                    const { left, right } = ops.splitNode(node, ol, ng, mh);
                    history.addDelete(mh + left.md_length - end_len, end_len);
                    history.addDelete(mh, start_len);
                    replace([...left.children, right], ng);
                    skip();
                } break;
                case RangeOverlapType.PARTIAL_TAIL: {
                    const { left, right } = ops.splitNode(node, os, ng, mh);
                    history.addDelete(mh + left.md_length + right.md_length - end_len, end_len);
                    history.addDelete(mh + left.md_length, start_len);
                    replace([left, ...right.children], ng);
                    skip();
                } break;
            }
        }
    }

    edit_host.root = ops.heal(edit_host.root, ng).node;

    edit_host.start_offset = edit_host.end_offset;

    initLength(edit_host.root);

    history.endRecording(edit_host, nonce);
}
