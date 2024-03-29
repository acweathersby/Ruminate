import { MDNode, NodeClass, NodeType } from '../md_node';
import { MetaRoot } from './meta_root';
import { Traverser } from './traverser_root';
import * as code from "../code";
import { IsLine } from '../operators';
/**
 * This traverses a tree and yields nodes depth first. Uses Yielders 
 * to perform non-destructive transforms on the AST.
 * @param node - The root node of the AST tree.
 * @param next_gen - The next generation of nodes. 
 * @param max_depth - The maximum level of the tree to return nodes from, starting at depth 1 for the root node.
 */
export function traverse(
    node: MDNode,
    next_gen: number = node.generation + 1,
    max_depth: number = Infinity
) {

    max_depth = Math.max(0, Math.min(100000, max_depth - 1));

    return new Traverser<MetaRoot>(
        node,
        {
            depth: 0,
            index: 0,
            parent: null,
            next: null,
            prev: null,
            head: 0,
            tail: 0,
            md_head: 0,
            md_tail: 0,
            next_gen
        },
        max_depth
    );
}


const {
    ANCHOR,
    BOLD,
    CODE_BLOCK,
    CODE_INLINE,
    HEADER,
    IMAGE,
    ITALIC,
    ORDERED_LIST,
    PARAGRAPH,
    QUERY,
    QUOTE,
    ROOT,
    TEXT,
    UNORDERED_LIST,
} = NodeType;


type TraversePack = {
    parents: MDNode[],
    node: MDNode;
    head: number;
    tail: number;
};

export function initLength(node: MDNode): { md: number, off: number; } {

    node.length = node.pre_length + node.internal_length;
    node.md_length = node.pre_md_length + node.internal_md_length;

    for (const child of node.children) {
        const { md, off } = initLength(child);
        node.length += off;
        node.md_length += md;
    }

    node.md_length += node.post_md_length;
    node.length += node.post_length;

    return {
        md: node.md_length,
        off: node.length
    };
}


export function getNodeAt(
    root: MDNode,
    offset: number = 0,
    ...types: NodeType[]
): TraversePack {
    return getNodeAtInternal(root, offset, types, { parents: [], node: null, head: 0, tail: 0 }, true);
}

export function getNodeAtWithTail(root, offset = 0, ...types) {
    return getNodeAtInternal(root, offset, types, { parents: [], node: null, head: 0, tail: 0 }, true);
}

function getNodeAtInternal(node: MDNode,
    offset: number,
    types: NodeType[],
    data_pack: TraversePack,
    TAIL_CAPTURE = false
): TraversePack {
    const IS_LINE = node.isClass(NodeClass.LINE) && !node.is(CODE_BLOCK);
    const cached_tail = data_pack.tail + (IS_LINE ? 1 : node.length);
    if ((cached_tail > offset || TAIL_CAPTURE && cached_tail == offset) && (types.length == 0 || node.is(...types))) {
        data_pack.tail = data_pack.head + node.length;
        data_pack.node = node;
        return data_pack;
    }
    if (IS_LINE) {
        data_pack.tail++;
        data_pack.head++;
    }
    if (node.children.length > 0) {
        for (const child of node.children) {
            const cached_tail2 = data_pack.tail + child.length;
            if (cached_tail2 > offset || TAIL_CAPTURE && cached_tail2 == offset) {
                data_pack = getNodeAtInternal(child, offset, types, data_pack, TAIL_CAPTURE);
                if (data_pack.node) {
                    data_pack.parents.push(node);
                    return data_pack;
                }
            }
            data_pack.tail += child.length;
            data_pack.head = data_pack.tail;
        }
    }
    return data_pack;
}


export function getMDOffsetFromEditOffset(
    node: MDNode,
    offset: number,
    md_offset: number = 0
): { md: number, off: number; } {

    if (node.is(NodeType.TEXT)) {
        if (offset < node.length)
            return { md: md_offset + offset, off: 0 };
    }

    offset -= node.pre_length;

    if (offset <= 0)
        return { md: md_offset + -offset, off: offset };

    md_offset += node.pre_md_length;

    md_offset += node.internal_length;
    offset -= node.internal_length;

    for (const child of node.children) {

        const { md, off } = getMDOffsetFromEditOffset(child, offset, md_offset);

        if (off <= 0)
            return { md, off };

        offset = off;
        md_offset = md;
    }


    md_offset += node.post_md_length;
    offset -= node.post_length;

    return { md: md_offset, off: offset };
}