import { EditorState } from '@codemirror/state';


export enum NodeType {
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
    UNDEFINED,
    UNORDERED_LIST,
}

export const enum NodeClass {
    UNDEFINED = 0,

    /**
     * Represent a surrounding context that encapsulates 
     * and changes the appearance of textual data.
     */
    FORMAT = 1 << 0,

    /**
     * A single Markdown line element that contains child
     * nodes comprising actual content. Translates to a
     * DOM Element that are direct children of the root
     * editable element.
     */
    LINE = 1 << 1,

    /**
     * Represents a node that can't be
     * directly edited through the content 
     * editable system.
     */
    OPAQUE = 1 << 2,

    /**
     * When combined with `OPAQUE`, represents a node
     * that appears as a single character element
     * in the DOM, regardless if the actual complexity 
     * of the node's element tree.
     */
    SINGLE_CHARACTER = 1 << 3,

    /**
    * Contains an element that can be targeted by the 
    * documents selection interface.
    */
    CARET_TARGET = 1 << 4,

    /**
    * Allows the merger of two adjacent nodes of the same type.
    */
    MERGEABLE = 1 << 5,
}

export interface NodeMeta {
    [NodeType.ANCHOR]: string;
    [NodeType.BOLD]: null;
    [NodeType.CODE_BLOCK]: { syntax: string, text: string; state: EditorState; };
    [NodeType.CODE_INLINE]: null;
    [NodeType.HEADER]: number;
    [NodeType.IMAGE]: string;
    [NodeType.ITALIC]: null;
    [NodeType.ORDERED_LIST]: number;
    [NodeType.PARAGRAPH]: null;
    [NodeType.QUERY]: string;
    [NodeType.QUOTE]: string;
    [NodeType.ROOT]: null;
    [NodeType.TEXT]: string;
    [NodeType.UNDEFINED]: null;
    [NodeType.UNORDERED_LIST]: number;
}

export interface NodeChildren {
    [NodeType.ANCHOR]: MDNode[];
    [NodeType.BOLD]: MDNode[];
    [NodeType.CODE_BLOCK]: MDNode[];
    [NodeType.CODE_INLINE]: MDNode[];
    [NodeType.HEADER]: MDNode[];
    [NodeType.IMAGE]: MDNode[];
    [NodeType.ITALIC]: MDNode[];
    [NodeType.ORDERED_LIST]: MDNode[];
    [NodeType.PARAGRAPH]: MDNode[];
    [NodeType.QUERY]: MDNode[];
    [NodeType.QUOTE]: MDNode[];
    [NodeType.ROOT]: MDNode[];
    [NodeType.TEXT]: MDNode[];
    [NodeType.UNDEFINED]: MDNode[];
    [NodeType.UNORDERED_LIST]: MDNode[];
}

const NodeClasses = {
    [NodeType.ANCHOR]: NodeClass.MERGEABLE | NodeClass.FORMAT,
    [NodeType.BOLD]: NodeClass.MERGEABLE | NodeClass.FORMAT,
    [NodeType.CODE_BLOCK]: NodeClass.OPAQUE | NodeClass.LINE | NodeClass.CARET_TARGET,
    [NodeType.CODE_INLINE]: NodeClass.MERGEABLE | NodeClass.FORMAT,
    [NodeType.HEADER]: NodeClass.LINE,
    [NodeType.IMAGE]: NodeClass.MERGEABLE | NodeClass.FORMAT,
    [NodeType.ITALIC]: NodeClass.FORMAT,
    [NodeType.ORDERED_LIST]: NodeClass.LINE,
    [NodeType.PARAGRAPH]: NodeClass.LINE,
    [NodeType.QUERY]: NodeClass.MERGEABLE | NodeClass.OPAQUE | NodeClass.SINGLE_CHARACTER | NodeClass.CARET_TARGET,
    [NodeType.QUOTE]: NodeClass.LINE,
    [NodeType.ROOT]: NodeClass.UNDEFINED,
    [NodeType.TEXT]: NodeClass.MERGEABLE | NodeClass.CARET_TARGET,
    [NodeType.UNDEFINED]: NodeClass.UNDEFINED,
    [NodeType.UNORDERED_LIST]: NodeClass.LINE,
};
/**
 * Represents the underlying Markdown structure of an editable
 * note.
 */
export class MDNode<T extends NodeType = NodeType> {
    #type: T;
    #class: NodeClass;
    #meta: NodeMeta[T];
    #children: MDNode[];

    get type(): T {
        return this.#type;
    }

    get children(): NodeChildren[T] {

        if (!this.#children)
            return [];

        return this.#children;
    }

    set children(children: NodeChildren[T]) {

        if (!children || children.length == 0)
            this.#children = null;
        //@ts-ignore
        this.#children = children.slice();
    }

    get meta(): NodeMeta[T] {
        if (this.#meta != null) {
            if (this.#meta == "object")
                return Object.assign({}, this.#meta);
            else
                return this.#meta;
        }
        return null;
    };

    set meta(m: NodeMeta[T]) {
        this.#meta = m;
    };

    is<R extends NodeType>(...type: R[]): this is MDNode<R> {
        //@ts-ignore
        return type.includes(this.#type);
    }

    isClass(_class: NodeClass): boolean {
        return (this.#class & _class) == this.#class;
    }

    containsClass(..._class: NodeClass[]): boolean {
        let val = 0;
        for (const c of _class)
            val |= c;
        return (this.#class & val) > 0;
    }

    constructor(
        type: T,
    ) {
        this.#type = type;
        this.#class = NodeClasses[type];
        this.#meta = null;
        this.#children = null;
    }
}

export type LineNode = MDNode<
    NodeType.PARAGRAPH
    | NodeType.ORDERED_LIST
    | NodeType.UNORDERED_LIST
    | NodeType.HEADER
    | NodeType.QUOTE
    | NodeType.CODE_BLOCK
>;