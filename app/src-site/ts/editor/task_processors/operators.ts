import * as history from './history/history';
import { MDNode, NodeClass as NC, NodeClass, NodeMeta, NodeType } from "./md_node";
import { initLength } from './traverse/traverse';
import { toMDPostText, toMDPreText } from './view';

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
    STEM_HEADER,
    UNORDERED_LIST,
} = NodeType;


export function IsLine(node: MDNode): boolean {
    return node.containsClass(NodeClass.LINE);
}
/**
 * Make a copy of a node.
 */
export function clone<T extends NodeType>(
    node: MDNode<T>,
    gen: number = node.generation + 1
): MDNode<T> {

    if (node.generation == gen)
        return node;

    const new_node = new MDNode(node.type, gen);

    new_node.meta = node.meta;

    new_node.children = node.children;

    new_node.length = node.length;

    new_node.md_length = node.md_length;

    return new_node;
}

export function copy<T extends NodeType>(
    node: MDNode<T>,
): MDNode<T> {

    const new_node = new MDNode(node.type, node.generation);

    new_node.meta = node.meta;

    new_node.children = node.children;

    new_node.length = node.length;

    new_node.md_length = node.md_length;

    return new_node;
}

export function newNode<T extends NodeType>(
    type: T,
    children: MDNode[] = [],
    gen: number = 0,
    meta: NodeMeta[T] = null,
): MDNode<T> {

    const node = new MDNode(type, gen);

    node.meta = meta;

    node.children = children;

    return node;
}


/**
 * Join this node with any adjacent nodes that share
 * compatible features. Repeat process with the node's
 * children. 
 */
export function heal<T extends NodeType>(
    node: MDNode<T>,
    gen: number,
    dissolve_types: Set<NodeType> = new Set(),
    md_offset: number = 0
): { node: MDNode<T>; off: number; } {

    md_offset += node.pre_md_length;

    if (node.children.length > 0) {

        const children = node.children.slice();

        let MODIFIED = false;

        for (let i = 0, l = children.length; i < l; i++) {
            const curr_node = children[i];

            if (dissolve_types.has(curr_node.type) && curr_node.is(ITALIC, BOLD)) {
                MODIFIED = true;

                history.addDelete(md_offset, node.pre_length);
                history.addDelete(md_offset + node.length - node.post_length, node.post_length);

                children.splice(i, 1, ...curr_node.children);
                l = children.length;
                i = Math.max(i - 2, -1);
                continue;
            }

            if (i < l - 1) {

                const next_node = children[i + 1];

                if (next_node.type == curr_node.type) {
                    if (curr_node.is(ANCHOR, ITALIC, BOLD, IMAGE, CODE_INLINE)) {

                        MODIFIED = true;

                        history.addDelete(
                            md_offset + curr_node.md_length - curr_node.post_md_length,
                            curr_node.post_md_length + next_node.pre_md_length + next_node.internal_md_length
                        );

                        const new_node = clone(curr_node, gen);

                        children.splice(i, 2, new_node);
                        new_node.children = new_node.children.concat(next_node.children);
                        new_node.length = curr_node.length + next_node.length;

                        initLength(new_node);

                        l--;
                        i--;
                        continue;
                    } else if (curr_node.is(TEXT, STEM_HEADER)) {

                        MODIFIED = true;

                        const new_node = clone(curr_node, gen);

                        children.splice(i, 2, new_node);
                        new_node.meta += next_node.meta;
                        new_node.length = curr_node.length + next_node.length;

                        initLength(new_node);
                        l--;
                        i--;
                        continue;
                    }
                }
            }

            const { node: new_node, off } =
                heal(curr_node, gen, new Set([...dissolve_types, curr_node.type]), md_offset);

            md_offset = off;

            if (new_node !== curr_node) {
                MODIFIED = true;
                children[i] = new_node;
            }
        }

        if (MODIFIED == true) {
            const new_node = clone(node, gen);
            new_node.children = children;
            initLength(new_node);
            md_offset += new_node.internal_length + new_node.post_md_length;
            return { node: new_node, off: md_offset };
        }
    }

    md_offset += node.internal_length + node.post_md_length;

    return { node, off: md_offset };
}

/**
 * 
 * @param node 
 * @param offset 
 * @param gen - The current generation. Any edited node that is not of this 
 *      generation is replaced by one that is.
 * @param md_offset - The offset, in markdown character units, of the head of the
 * node.
 * @returns 
 */
export function splitNode(
    node: MDNode,
    offset: number,
    gen: number,
    md_offset: number,
    ALLOW_HISTORY: boolean = true
) {
    const { left: [l], right: [r] }
        = split([node], offset, gen, md_offset, ALLOW_HISTORY);

    initLength(l);
    initLength(r);

    return { left: l, right: r };
}
/**
 * Divide this node in two and return the right most node. 
 * 
 * The split point is relative to the length of the node. 
 * 
 * If the split point is 0 or equal to the length of the node
 * then the original node is returned.
 * 
 * @param nodes 
 * @param offset 
 * @param gen - The current generation. Any edited node that is not of this 
 *      generation is replaced by one that is.
 * 
 * @returns 
 */
export function split(
    nodes: MDNode[],
    offset: number,
    gen: number,
    md_offset: number = 0,
    ALLOW_HISTORY: boolean = true
): { left: MDNode[], right: MDNode[]; } {
    const left = [], right = [];
    for (const node of nodes) {
        if (offset < node.length && offset > 0) {
            switch (node.type) {
                case UNORDERED_LIST:
                case ANCHOR:
                case BOLD:
                case CODE_INLINE:
                case HEADER:
                case IMAGE:
                case ITALIC:
                case ORDERED_LIST:
                case PARAGRAPH:
                case QUOTE:
                case ROOT: {
                    const children = node.children;

                    let a = clone(node, gen);

                    let b = copy(a);

                    const { left: cl, right: cr }
                        = split(
                            children,
                            offset - node.pre_length,
                            gen,
                            md_offset + node.pre_md_length,
                            ALLOW_HISTORY
                        );

                    a.children = cl;
                    b.children = cr;

                    initLength(a);
                    initLength(b);

                    if (ALLOW_HISTORY) {
                        history.addInsert(md_offset + a.md_length - a.post_md_length, toMDPostText(node) + toMDPreText(node));
                    }

                    left.push(a);

                    right.push(b);
                } break;
                case QUERY:
                    left.push(node);
                    break;
                case TEXT:
                case STEM_HEADER:
                    if (node.is(TEXT, STEM_HEADER)) {
                        const meta = node.meta;
                        let a = clone(node, gen);
                        let b = copy(a);
                        a.meta = meta.slice(0, offset);
                        b.meta = meta.slice(offset);
                        left.push(a);
                        right.push(b);
                    } break;
                case CODE_BLOCK:
                    debugger;
                    break;
            }
        } else if (offset <= 0) {
            right.push(node);
        } else {
            left.push(node);
        }

        md_offset += node.md_length;
        offset -= node.length;
    }

    return { left, right };
}

/**
 * Replace this node with its children and return the first and
 * last child nodes.  
 */
export function dissolve<T extends NodeType>(
    parent: MDNode<T>,
    child: MDNode,
    gen: number
): MDNode<T> {
    const index = parent.children.indexOf(child);

    if (index >= 0)

        return replaceMut(clone(parent, gen), index, ...child.children);

    return parent;
}

/**
 * Combine this node with its right most neighbor if 
 * such an operation is allowed. Return the resulting
 * join.
 */
export function mergeRight<T extends NodeType>(
    parent: MDNode<T>,
    left_child: MDNode,
    right_child: MDNode,
    gen: number
): MDNode<T> {

    if (
        left_child.type == right_child.type
        &&
        left_child.containsClass(NC.MERGEABLE)
    ) {
        const
            index_left = parent.children.indexOf(left_child),
            index_right = parent.children.indexOf(right_child);

        if (
            index_left >= 0
            &&
            index_right >= 0
            &&
            index_right - index_left == 1
        ) {
            const new_parent = clone(parent, gen);
            let new_left = clone(left_child, gen);

            if (new_left.is(NodeType.TEXT)) {
                new_left.meta += right_child.meta;
            } else if (
                new_left.is(
                    NodeType.BOLD,
                    NodeType.ITALIC,
                    NodeType.CODE_INLINE
                )
            ) new_left.children =
                [...left_child.children, ...right_child.children];

            replaceMut(new_parent, index_left, new_left);
            removeMut(new_parent, index_right);

            return new_parent;
        }
    }

    return parent;
}

/**
 * Remove the node from its parent. Returns a new parent.
 */
export function replace<T extends NodeType>(
    parent: MDNode<T>,
    old_child: MDNode,
    ...new_children: MDNode[]
): MDNode<T> {

    const index = parent.children.indexOf(old_child);

    if (index >= 0) {

        return replaceMut(clone(parent), index, ...new_children);

    } else {
        return parent;
    }
}

function replaceMut<T extends NodeType>(
    parent: MDNode<T>,
    index: number,
    ...new_children: MDNode[]
): MDNode<T> {
    parent.children.splice(index, 1, ...new_children);
    return parent;
}

/**
 * Remove the node from its parent. Returns a new parent.
 */
export function insert<T extends NodeType>(
    parent: MDNode<T>,
    prev: MDNode | null,
    gen: number,
    ...children: MDNode[]
): MDNode<T> {
    let index = 0;

    if (prev) {
        index = parent.children.indexOf(prev);
        if (index < 0) {
            index = 0;
        }
    }

    return insertMut(clone(parent, gen), index, ...children);
}

function insertMut<T extends NodeType>(
    parent: MDNode<T>,
    index: number,
    ...children: MDNode[]
): MDNode<T> {
    parent.children.splice(index, 0, ...children);
    return parent;
}

/**
 * Remove the node from its parent. Returns a new parent.
 */
export function remove<T extends NodeType>(
    parent: MDNode<T>,
    child: MDNode,
    gen: number
): MDNode<T> {

    const index = parent.children.indexOf(child);

    if (index >= 0)
        return removeMut(clone(parent, gen), index);

    return parent;

}

function removeMut<T extends NodeType>(
    parent: MDNode<T>,
    index: number
): MDNode<T> {
    parent.children.splice(index, 1);
    return parent;
}


/**
 * Replace the given node's children with the child arguments.
 */
export function setChildren<T extends NodeType>(
    parent: MDNode<T>,
    gen: number,
    ...children: MDNode[]
): MDNode<T> {
    return setChildrenMut(clone(parent, gen), ...children);
}

function setChildrenMut<T extends NodeType>(
    parent: MDNode<T>,
    ...children: MDNode[]
): MDNode<T> {

    parent.children = children.slice();

    return parent;
}


export function insertTextNode(
    node: MDNode<NodeType.TEXT | NodeType.STEM_HEADER>,
    split_point: number,
    new_text: string,
    gen: number,
) {
    let new_node = clone(node, gen);


    new_node.meta =
        new_node.meta.slice(0, split_point)
        +
        new_text
        +
        new_node.meta.slice(split_point);
    return new_node;
}

export function deleteTextNode(
    node: MDNode<NodeType.TEXT>,
    split_point: number,
    new_text: string,
    gen: number,
) {
    let new_node = clone(node, gen);

    new_node.meta =
        new_node.meta.slice(0, split_point)
        +
        new_text
        +
        new_node.meta.slice(split_point);
    return new_node;
}
