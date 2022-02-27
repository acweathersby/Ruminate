import { MDNode, NodeClass, NodeType } from '../md_node';

export function incrementOffset(node: MDNode<NodeType>, offset: number): number {
    if (node.is(NodeType.CODE_BLOCK)) {
        return offset + node.length;
    } else if (node.containsClass(NodeClass.LINE, NodeClass.SINGLE_CHARACTER)) {
        return offset + 1;
    } else if (node.containsClass(NodeClass.TEXT_CONTAINER)) {
        return offset;
    } else {
        return offset + node.length;
    }
}
