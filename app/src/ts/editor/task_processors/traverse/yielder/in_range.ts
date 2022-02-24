import { MDNode } from '../../md_node.js';
import { Yielder } from "./yielder.js";

export enum RangeOverlapType {

    /**
     * The range begins at or before the nodes head
     * and at or after the node's tail
     */
    COMPLETE,

    /**
     * The range begins at or before the nodes head
     * and ends before the nodes tail
     */
    PARTIAL_HEAD,

    /**
     * The range starts within in the node and 
     * ends at or after the node's tail
     */
    PARTIAL_TAIL,

    /**
     * The range is completely contained within 
     * the bounds of the node without overlapping
     * the head or tail of the node.
     */
    PARTIAL_CONTAINED,
}
export class inRangeYielder extends Yielder {

    range_start: number;
    range_end: number;
    overlap_start: number;
    overlap_length: number;
    overlap_type: RangeOverlapType;
    modifyMeta(meta, val_length_stack, node_stack) {
        meta.range_start = this.range_start;
        meta.range_end = this.range_end;
        meta.overlap_type = 0;
        meta.overlap_start = 0;
        meta.overlap_length = 0;
    }

    yield(node: MDNode, stack_pointer: number, node_stack: MDNode[], val_length_stack: number[], meta) {

        const { head, tail } = meta;
        const { range_end, range_start } = meta;

        if (head <= range_end && tail > range_start) {

            const
                /**
                 * Is a positive value or zero if the range start
                 * begins after or at the head of the section.
                 */
                range_start_rel = range_start - head,

                /**
                 * Is a positive value or zero if the range end
                 * begins before or at the tail of the section.
                 */
                range_end_rel = tail - range_end;

            meta.overlap_start = Math.max(head, range_start) - head;
            meta.overlap_length = Math.min(tail, range_end) - head - meta.overlap_start;

            if (range_start_rel > 0) {
                // Start of range is within the section
                if (range_end_rel > 0) {
                    // The range is contained within the selection
                    meta.overlap_type = RangeOverlapType.PARTIAL_CONTAINED;
                } else {
                    // The start of the range is within the section 
                    // but the end of is at or beyond the tail of the section.
                    // This is either a section or text segment
                    meta.overlap_type = RangeOverlapType.PARTIAL_TAIL;
                }
            } else if (range_start_rel == 0) {
                // Start of the range is at the head of the section.
                if (range_end_rel <= 0) {
                    //Range matches or exceeds the section boundaries
                    meta.overlap_type = RangeOverlapType.COMPLETE;
                } else if (range_end_rel > 0) {
                    meta.overlap_type = RangeOverlapType.PARTIAL_CONTAINED;
                }
            } else if (range_end_rel > 0) {
                //Range starts before section and ends within section
                meta.overlap_type = RangeOverlapType.PARTIAL_HEAD;
            } else {
                meta.overlap_type = RangeOverlapType.COMPLETE;
            }

            return this.yieldNext(node, stack_pointer, node_stack, val_length_stack, meta);
        }

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
export function range_filter(range_start: number, range_end: number): inRangeYielder {

    return Object.assign(new inRangeYielder(), {
        range_start,
        range_end
    });
}