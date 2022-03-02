import { MDNode } from '../md_node';

export interface MetaRoot {
    next_gen: number;
    /**
     * the index of this node's position within its parent
     * container.
     */
    index: number;
    /**
     * This nodes parent or null
     */
    parent: MDNode;
    /**
     * The nodes next sibling or null
     */
    prev: MDNode;
    /**
     * The nodes previous sibling or null
     */
    next: MDNode;
    /**
     * The number of nested levels from the root that 
     * this node resides at.
     */
    depth: number;
    /**
     * The offset in codepoints from the root node to the start of this
     * node
     */
    head: number;
    /**
     * The offset in codepoints from the root node to the end of this
     * node
     */
    tail: number;
    /**
     * The offset in codepoints to the start of this node when including markdown
     * characters.
     */
    md_head: number;
    /**
     * The offset in codepoints to the end of this node when including markdown
     * characters.
     */
    md_tail: number;


}
