import { MDNode, NodeClass } from '../../md_node.js';
import { Yielder } from "./yielder.js";

export class classFilterYielder extends Yielder {
    class_mask: number;

    modifyMeta(meta, val_length_stack, node_stack) {
        meta.class_mask = this.class_mask;
    }

    yield(node: MDNode, stack_pointer: number, node_stack: MDNode[], val_length_stack: number[], meta) {

        if (node.containsClass(this.class_mask))
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
export function class_filter(...classes: NodeClass[]): classFilterYielder {

    return Object.assign(new classFilterYielder(), {
        class_mask: classes.reduce((r, b) => b | r, 0)
    });
}