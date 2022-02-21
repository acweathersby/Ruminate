import { MDNode, NodeClass, NodeType } from './md_node';

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
    head: 0;
    tail: 0;
};

export function initLength(node: MDNode): number {

    if (node.containsClass(NodeClass.LINE)) {
        if (node.is(CODE_BLOCK)) {
            node.length += node.meta.text.length + 1;
        } else {

            let length = 1;

            for (const child of node.children)
                length += initLength(child);

            node.length = length;
        }
    } else if (node.is(TEXT)) {
        node.length = node.meta.length;
    } else if (node.is(QUERY)) {
        node.length = 1;
    } else {
        let length = 0;
        for (const child of node.children)
            length += initLength(child);
        node.length = length;
    }


    return node.length;
}


export function getNodeAt(
    root: MDNode,
    offset: number = 0,
    ...types: NodeType[]
): TraversePack {
    return getNodeAtInternal(root, offset, types);
}

export function getNodeAtInternal(
    root: MDNode,
    offset: number,
    types: NodeType[],
    data_pack: TraversePack = { parents: [], node: null, head: 0, tail: 0 },
): TraversePack {

    if (root.isClass(NodeClass.LINE))
        data_pack.tail++;

    if (data_pack.tail > offset
        && (
            types.length == 0
            ||
            root.is(...types))) {
        data_pack.node = root;
        return data_pack;
    }

    for (const child of root.children) {

        if (child.is(TEXT))
            data_pack.tail += child.meta.length;
        else if (child.is(QUERY))
            data_pack.tail++;

        data_pack = getNodeAtInternal(child, offset, types, data_pack);

        if (data_pack.node) {
            data_pack.parents.push(root);
            return data_pack;
        }

        data_pack.head = data_pack.tail;
    }

    return data_pack;
}


interface ModifyFunctions {
    /**
     * Called when the selection range relates to the Text section in one of three ways:
     * - The selection range starts outside the section and ends within the section.
     * - The selection range starts within the section and ends outside the section.
     * - The selection range is entirely contained within the section and the range
     *   boundaries do not line up with section boundaries. 
     * 
     * @param {TextSection} s - Section to be modified.
     * 
     * @param {number} off - The point within the section it starts to overlap with the 
     *  selection region.
     * 
     * @param {number} len - The number of characters from `off` that are within the 
     *  selection region. 
     * 
     * @param {ModifyFunctions} modify_functions - The object containing the modifying
     * functions used by `modifySections`.
     * 
     */
    on_text_segment(
        s: MDNode<NodeType.TEXT>, off: number, len: number, modify_functions: ModifyFunctions): void;
    /**
     * Called when the selection range relates to the section in one of three ways:
     * - The selection range starts outside the section and ends within the section.
     * - The selection range starts within the section and ends outside the section.
     * - The selection range is entirely contained within the section and the range
     *   boundaries do not line up with section boundaries. 
     */
    on_section_segment: (
        /**
         * The section that should be modified
         */
        s: MDNode, off_start: number, off_end: number, modify_functions: ModifyFunctions) => void;
    /**
     * Called when the givin selection is completely contained by the selection range.
     */
    on_seg_overlap: (s: MDNode, off_start: number, off_end: number, modify_functions: ModifyFunctions) => void;
}
const default_modify_functions: ModifyFunctions = {
    on_text_segment: (s, offs, offe, mf) => { },
    on_section_segment: (s, offs, offe, mf) => {
        modifySections(s, offs, offe, mf);
    },
    on_seg_overlap: (s, offs, offe, mf) => { }
};
export function modifySections(
    root_section: MDNode,
    range_start: number,
    range_end: number,
    offset: number = 0,
    modify_functions = default_modify_functions
) {
    const {
        on_text_segment = default_modify_functions.on_text_segment,
        on_section_segment = default_modify_functions.on_section_segment,
        on_seg_overlap = default_modify_functions.on_seg_overlap
    } = modify_functions;

    for (const node of root_section.children) {

        let head = offset;
        let tail = head + node.length;

        if (head < range_end && tail > range_start) {

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
                range_end_rel = tail - range_end,
                /**
                 * The length of the region of text the section covers.
                 */
                length = tail - head;

            if (range_start_rel > 0) {
                // Start of range is within the section
                if (range_end_rel > 0) {
                    // The range is contained within the selection
                    if (node.is(NodeType.TEXT)) {
                        on_text_segment(node, range_start_rel, length - range_end_rel - range_start_rel, modify_functions);
                    } else
                        on_section_segment(node, range_start, range_end, modify_functions);
                } else {
                    // The start of the range is within the section 
                    // but the end of is at or beyond the tail of the section.
                    // This is either a section or text segment
                    if (node.is(NodeType.TEXT)) {
                        on_text_segment(node, range_start_rel, length - range_start_rel, modify_functions);
                    } else
                        on_section_segment(node, range_start, range_end, modify_functions);
                }
            } else if (range_start_rel == 0) {
                // Start of the range is at the head of the section.
                if (range_end_rel <= 0) {
                    //Range matches or exceeds the section boundaries
                    on_seg_overlap(node, range_start, range_end, modify_functions);
                } else if (range_end_rel > 0) {
                    //Range is within the section
                    if (node.is(NodeType.TEXT)) {
                        on_text_segment(node, 0, length - range_end_rel, modify_functions);
                    } else
                        on_section_segment(node, range_start, range_end, modify_functions);
                }
            } else if (range_end_rel > 0) {
                //Range starts before section and ends within section
                if (node.is(NodeType.TEXT))
                    on_text_segment(node, 0, length - range_end_rel, modify_functions);
                else
                    on_section_segment(node, range_start, range_end, modify_functions);
            } else {
                on_seg_overlap(node, range_start, range_end, modify_functions);
            }
        }

        offset += node.length;
    }
}