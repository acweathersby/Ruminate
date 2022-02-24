import { MDNode, NodeType } from '../../md_node.js';
import { Yielder } from "./yielder.js";

export class typeFilterYielder extends Yielder {
    types: NodeType[];

    modifyMeta(meta, val_length_stack, node_stack) {
        meta.types = this.types;
    }

    yield(node: MDNode, stack_pointer: number, node_stack: MDNode[], val_length_stack: number[], meta) {

        if (node.is(...this.types))
            return this.yieldNext(node, stack_pointer, node_stack, val_length_stack, meta);

        return null;
    }

}
/**
 * Yields nodes whose property indexed by `key` returns a non-zero value when 
 * bitwise AND [ & ] with the list of arguments combined through a bitwise OR [ | ]
 * operation.
 * 
 * @param key - A property name on the node that should be tested for a match.
 * @param {number} bit_mask  - A number
 */
export function type_filter(...types: NodeType[]): typeFilterYielder {

    return Object.assign(new typeFilterYielder(), {
        types
    });
}