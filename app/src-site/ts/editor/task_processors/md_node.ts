import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';


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
     * Represents a node that appears as a single character 
     * to the editor, regardless of the actual complexity 
     * of the node's internal DOMz.
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
    /**
     * Represents a node that contains text nodes or contains
     * other TEXT_CONTAINER nodes
     */
    TEXT_CONTAINER = 1 << 6
}

export interface NodeMeta {
    [NodeType.ANCHOR]: string;
    [NodeType.BOLD]: null;
    [NodeType.CODE_BLOCK]: { syntax: string, text: string; state: EditorState; view: EditorView; };
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

const NodeMDLengths = {
    [NodeType.ANCHOR]: {
        pre: (n: MDNode<NodeType.ANCHOR>) => 1, // "["
        internal: (n: MDNode<NodeType.ANCHOR>) => 0,
        post: (n: MDNode<NodeType.ANCHOR>) => 3 + n.meta.length  // "](*)" 
    },
    [NodeType.BOLD]: {
        pre: (n: MDNode<NodeType.BOLD>) => 2,
        internal: (n: MDNode<NodeType.BOLD>) => 0,
        post: (n: MDNode<NodeType.BOLD>) => 2
    },
    [NodeType.CODE_BLOCK]: {
        pre: (n: MDNode<NodeType.CODE_BLOCK>) => 5 + n.meta.syntax.length, // <nl> <```> <sp> <syntax> <nl>
        internal: (n: MDNode<NodeType.CODE_BLOCK>) =>
            n.meta.view
                ? n.meta.view.state.doc.length
                : n.meta.text.length,
        post: (n: MDNode<NodeType.CODE_BLOCK>) => 5 // <nl> <```> <nl>
    },
    [NodeType.CODE_INLINE]: {
        pre: (n: MDNode<NodeType.CODE_INLINE>) => 1,
        internal: (n: MDNode<NodeType.CODE_INLINE>) => 0,
        post: (n: MDNode<NodeType.CODE_INLINE>) => 1
    },
    [NodeType.HEADER]: {
        pre: (n: MDNode<NodeType.HEADER>) => n.meta + 2, // <nl> <num of #> <sp>
        internal: (n: MDNode<NodeType.HEADER>) => 0,
        post: (n: MDNode<NodeType.HEADER>) => 1
    },
    [NodeType.IMAGE]: {
        pre: (n: MDNode<NodeType.IMAGE>) => 2, // "!["
        internal: (n: MDNode<NodeType.IMAGE>) => 0,
        post: (n: MDNode<NodeType.IMAGE>) => 3 + n.meta.length // "](*)" 
    },
    [NodeType.ITALIC]: {
        pre: (n: MDNode<NodeType.ITALIC>) => 1,
        internal: (n: MDNode<NodeType.ITALIC>) => 0,
        post: (n: MDNode<NodeType.ITALIC>) => 1
    },
    [NodeType.ORDERED_LIST]: {
        pre: (n: MDNode<NodeType.ORDERED_LIST>) => 1,
        internal: (n: MDNode<NodeType.ORDERED_LIST>) => 0,
        post: (n: MDNode<NodeType.ORDERED_LIST>) => 1
    },
    [NodeType.PARAGRAPH]: {
        pre: (n: MDNode<NodeType.PARAGRAPH>) => 1,
        internal: (n: MDNode<NodeType.PARAGRAPH>) => 0,
        post: (n: MDNode<NodeType.PARAGRAPH>) => 1
    },
    [NodeType.QUERY]: {
        pre: (n: MDNode<NodeType.QUERY>) => 1,
        internal: (n: MDNode<NodeType.QUERY>) => n.meta.length,
        post: (n: MDNode<NodeType.QUERY>) => 1
    },
    [NodeType.QUOTE]: {
        pre: (n: MDNode<NodeType.QUOTE>) => 1,
        internal: (n: MDNode<NodeType.QUOTE>) => 0,
        post: (n: MDNode<NodeType.QUOTE>) => 1
    },
    [NodeType.ROOT]: {
        pre: (n: MDNode<NodeType.ROOT>) => 0,
        internal: (n: MDNode<NodeType.ROOT>) => 0,
        post: (n: MDNode<NodeType.ROOT>) => 0
    },
    [NodeType.TEXT]: {
        pre: (n: MDNode<NodeType.TEXT>) => 0,
        internal: (n: MDNode<NodeType.TEXT>) => n.meta.length,
        post: (n: MDNode<NodeType.TEXT>) => 0
    },
    [NodeType.UNDEFINED]: {
        pre: (n: MDNode<NodeType.UNDEFINED>) => 0,
        internal: (n: MDNode<NodeType.UNDEFINED>) => 0,
        post: (n: MDNode<NodeType.UNDEFINED>) => 0
    },
    [NodeType.UNORDERED_LIST]: {
        pre: (n: MDNode<NodeType.UNORDERED_LIST>) => 1,
        internal: (n: MDNode<NodeType.UNORDERED_LIST>) => 0,
        post: (n: MDNode<NodeType.UNORDERED_LIST>) => 1
    },
};


const NodeLengths = {
    [NodeType.ANCHOR]: {
        pre: (n: MDNode<NodeType.ANCHOR>) => 0,
        internal: (n: MDNode<NodeType.ANCHOR>) => 0,
        post: (n: MDNode<NodeType.ANCHOR>) => 0,
    },
    [NodeType.BOLD]: {
        pre: (n: MDNode<NodeType.BOLD>) => 0,
        internal: (n: MDNode<NodeType.BOLD>) => 0,
        post: (n: MDNode<NodeType.BOLD>) => 0,
    },
    [NodeType.CODE_BLOCK]: {
        pre: (n: MDNode<NodeType.CODE_BLOCK>) => 1,
        internal: (n: MDNode<NodeType.CODE_BLOCK>) => n.meta.view ? n.meta.view.state.doc.length : n.meta.text.length,
        post: (n: MDNode<NodeType.CODE_BLOCK>) => 0,
    },
    [NodeType.CODE_INLINE]: {
        pre: (n: MDNode<NodeType.CODE_INLINE>) => 0,
        internal: (n: MDNode<NodeType.CODE_INLINE>) => 0,
        post: (n: MDNode<NodeType.CODE_INLINE>) => 0,
    },
    [NodeType.HEADER]: {
        pre: (n: MDNode<NodeType.HEADER>) => 1,
        internal: (n: MDNode<NodeType.HEADER>) => 0,
        post: (n: MDNode<NodeType.HEADER>) => 0,
    },
    [NodeType.IMAGE]: {
        pre: (n: MDNode<NodeType.IMAGE>) => 0,
        internal: (n: MDNode<NodeType.IMAGE>) => 0,
        post: (n: MDNode<NodeType.IMAGE>) => 0,
    },
    [NodeType.ITALIC]: {
        pre: (n: MDNode<NodeType.ITALIC>) => 0,
        internal: (n: MDNode<NodeType.ITALIC>) => 0,
        post: (n: MDNode<NodeType.ITALIC>) => 0,
    },
    [NodeType.ORDERED_LIST]: {
        pre: (n: MDNode<NodeType.ORDERED_LIST>) => 1,
        internal: (n: MDNode<NodeType.ORDERED_LIST>) => 0,
        post: (n: MDNode<NodeType.ORDERED_LIST>) => 0,
    },
    [NodeType.PARAGRAPH]: {
        pre: (n: MDNode<NodeType.PARAGRAPH>) => 1,
        internal: (n: MDNode<NodeType.PARAGRAPH>) => 0,
        post: (n: MDNode<NodeType.PARAGRAPH>) => 0,
    },
    [NodeType.QUERY]: {
        pre: (n: MDNode<NodeType.QUERY>) => 0,
        internal: (n: MDNode<NodeType.QUERY>) => 1,
        post: (n: MDNode<NodeType.QUERY>) => 0,
    },
    [NodeType.QUOTE]: {
        pre: (n: MDNode<NodeType.QUOTE>) => 0,
        internal: (n: MDNode<NodeType.QUOTE>) => 0,
        post: (n: MDNode<NodeType.QUOTE>) => 0,
    },
    [NodeType.ROOT]: {
        pre: (n: MDNode<NodeType.ROOT>) => 0,
        internal: (n: MDNode<NodeType.ROOT>) => 0,
        post: (n: MDNode<NodeType.ROOT>) => 0,
    },
    [NodeType.TEXT]: {
        pre: (n: MDNode<NodeType.TEXT>) => 0,
        internal: (n: MDNode<NodeType.TEXT>) => n.meta.length,
        post: (n: MDNode<NodeType.TEXT>) => 0,
    },
    [NodeType.UNDEFINED]: {
        pre: (n: MDNode<NodeType.UNDEFINED>) => 0,
        internal: (n: MDNode<NodeType.UNDEFINED>) => 0,
        post: (n: MDNode<NodeType.UNDEFINED>) => 0,
    },
    [NodeType.UNORDERED_LIST]: {
        pre: (n: MDNode<NodeType.UNORDERED_LIST>) => 1,
        internal: (n: MDNode<NodeType.UNORDERED_LIST>) => 0,
        post: (n: MDNode<NodeType.UNORDERED_LIST>) => 0,
    },
};
const NodeClasses = {
    [NodeType.ANCHOR]: NodeClass.MERGEABLE | NodeClass.FORMAT | NodeClass.TEXT_CONTAINER,
    [NodeType.BOLD]: NodeClass.MERGEABLE | NodeClass.FORMAT | NodeClass.TEXT_CONTAINER,
    [NodeType.CODE_BLOCK]: NodeClass.OPAQUE | NodeClass.LINE | NodeClass.CARET_TARGET,
    [NodeType.CODE_INLINE]: NodeClass.MERGEABLE | NodeClass.FORMAT | NodeClass.TEXT_CONTAINER,
    [NodeType.HEADER]: NodeClass.LINE | NodeClass.TEXT_CONTAINER,
    [NodeType.IMAGE]: NodeClass.MERGEABLE | NodeClass.FORMAT,
    [NodeType.ITALIC]: NodeClass.FORMAT | NodeClass.TEXT_CONTAINER,
    [NodeType.ORDERED_LIST]: NodeClass.LINE | NodeClass.TEXT_CONTAINER,
    [NodeType.PARAGRAPH]: NodeClass.LINE | NodeClass.TEXT_CONTAINER,
    [NodeType.QUERY]: NodeClass.MERGEABLE | NodeClass.OPAQUE | NodeClass.SINGLE_CHARACTER | NodeClass.CARET_TARGET,
    [NodeType.QUOTE]: NodeClass.LINE | NodeClass.TEXT_CONTAINER,
    [NodeType.ROOT]: NodeClass.UNDEFINED | NodeClass.TEXT_CONTAINER,
    [NodeType.TEXT]: NodeClass.MERGEABLE | NodeClass.CARET_TARGET,
    [NodeType.UNDEFINED]: NodeClass.UNDEFINED,
    [NodeType.UNORDERED_LIST]: NodeClass.LINE | NodeClass.TEXT_CONTAINER,
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
    #generation: number;
    md_length: number;
    length: number;
    ele: HTMLElement | Text;
    /**
     * The number of characters proceeding internal characters
     * and child characters using markdown formatting.
     */
    get pre_md_length(): number {
        return NodeMDLengths[this.#type].pre(<any>this);
    }
    /**
     * The number of characters following internal characters
     * and child characters using markdown formatting.
     */
    get post_md_length(): number {
        return NodeMDLengths[this.#type].post(<any>this);
    }

    /**
     * The length of the characters between the leading characters
     * and trailing characters using markdown formatting; does not 
     * include the count of characters belonging to child nodes.
     */
    get internal_md_length(): number {
        return NodeMDLengths[this.#type].internal(<any>this);
    }

    /**
     * The number of characters proceeding internal characters
     * and child characters. 
     */
    get pre_length(): number {
        return NodeLengths[this.#type].pre(<any>this);
    }
    /**
     * The number of characters following internal characters
     * and child characters. 
     */
    get post_length(): number {
        return NodeLengths[this.#type].post(<any>this);
    }
    /**
     * The length of the characters between the leading characters
     * and trailing characters, not including character belonging to
     * child nodes.
     */
    get internal_length(): number {
        return NodeLengths[this.#type].internal(<any>this);
    }
    get generation(): number {
        return this.#generation;
    }

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
        return this.#class != 0 && (this.#class & _class) == this.#class;
    }

    containsClass(..._class: NodeClass[]): boolean {
        let val = 0;
        for (const c of _class)
            val |= c;
        return (this.#class & val) > 0;
    }

    constructor(
        type: T,
        generation: number = 0
    ) {
        this.#type = type;
        this.#class = NodeClasses[type];
        this.#meta = null;
        this.#children = null;
        this.#generation = generation;
        this.length = 0;
        this.md_length = 0;
        this.ele = null;
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