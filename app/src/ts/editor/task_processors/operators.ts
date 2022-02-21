import { MDNode, NodeType, NodeClass as NC, NodeMeta } from "./md_node";


/**
 * Make a copy of a node.
 */
export function clone<T extends NodeType>(node: MDNode<T>): MDNode<T> {

    const new_node = new MDNode(node.type);

    new_node.meta = node.meta;

    new_node.children = node.children;

    new_node.length = node.length;

    return new_node;
}

export function newNode<T extends NodeType>(
    type: T,
    children: MDNode[] = [],
    meta: NodeMeta[T] = null
): MDNode<T> {

    const node = new MDNode(type);

    node.meta = meta;

    node.children = children;

    return node;
}

/**
 * Join this node with any adjacent nodes that share
 * compatible features. Repeat process with the node's
 * children. 
 */
export function heal<T extends NodeType>(node: MDNode<T>): MDNode<T> {
    return node;
}

/**
 * Divide this node in two and return the right most node. 
 * 
 * The split point is relative to the length of the node. 
 * 
 * If the split point is 0 or equal to the length of the node
 * then the original node is returned.
 */
export function split(
    node: MDNode,
    index: number = (node.length / 2) | 0
): MDNode {
    return node;
}

/**
 * Replace this node with its children and return the first and
 * last child nodes.  
 */
export function dissolve<T extends NodeType>(
    parent: MDNode<T>,
    child: MDNode
): MDNode<T> {
    const index = parent.children.indexOf(child);

    if (index >= 0)

        return replaceMut(clone(parent), index, ...child.children);

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
    right_child: MDNode
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
            const new_parent = clone(parent);
            let new_left = clone(left_child);

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
    ...children: MDNode[]
): MDNode<T> {
    let index = 0;

    if (prev) {
        index = parent.children.indexOf(prev);
        if (index < 0) {
            index = 0;
        }
    }

    return insertMut(clone(parent), index, ...children);
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
    child: MDNode
): MDNode<T> {

    const index = parent.children.indexOf(child);

    if (index >= 0)
        return removeMut(clone(parent), index);

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
    ...children: MDNode[]
): MDNode<T> {
    return setChildrenMut(clone(parent), ...children);
}

function setChildrenMut<T extends NodeType>(
    parent: MDNode<T>,
    ...children: MDNode[]
): MDNode<T> {

    parent.children = children.slice();

    return parent;
}

