import { MDNode, NodeClass, NodeType } from "./md_node";
import { EditHost } from '../types/edit_host';
import * as code from './code';
import { getNodeAt, getNodeAtWithTail } from './traverse/traverse';

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

type ViewPack = {
    edit_host: EditHost;
    range: Range;
    offset: number;
};

/**
 * Returns offset and selection node information
 * from the primary selection range.
 */
export function getOffsetsFromSelection(edit_host: EditHost) {

    const selection = window.getSelection(), {
        focusNode, focusOffset, anchorOffset, anchorNode,
    } = selection;

    let anchor_offset = anchorNode.__get_offset() + anchorOffset;
    let focus_offset = focusNode.__get_offset() + focusOffset;

    edit_host.start_offset = Math.min(anchor_offset, focus_offset);
    edit_host.end_offset = Math.max(anchor_offset, focus_offset);
}


export function updateHost(edit_host: EditHost) {
    const vp = {
        edit_host,
        offset: 0,
        range: document.createRange()
    };
    edit_host.host_ele.innerHTML = "";
    edit_host.host_ele.appendChild(toHTMLNaive(edit_host.root, vp));
    //Set cursors

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(vp.range);
}

const OffsetMap = new WeakMap();

Node.prototype.__set_offset = function (val: number) {
    OffsetMap.set(this, val);
};

Node.prototype.__get_offset = function () {
    return OffsetMap.get(this) ?? -1;
};

const cE = document.createElement.bind(document);
function toHTMLNaive(
    node: MDNode,
    vp: ViewPack,
    LAST_CHILD: boolean = false
): Node {

    const head = vp.offset;
    const tail = vp.offset + node.length;

    if (node.containsClass(NodeClass.LINE)) {
        vp.offset++;
        let tag = "";
        if (node.is(PARAGRAPH)) {
            tag = "p";
        } else if (node.is(HEADER)) {
            tag = "h" + node.meta;
        } else if (node.is(ORDERED_LIST)) {
            tag = "li";
        } else if (node.is(QUOTE)) {
            tag = "quote";
        } else if (node.is(UNORDERED_LIST)) {
            tag = "li";
        } else if (node.is(CODE_BLOCK)) {
            const div = cE("div");
            vp.offset = tail;
            code.createView(node, div);
            node.ele = div;
            return div;

        }

        const ele = addChildNodes(node, cE(tag), vp);

        const last_child = node.children.slice().pop();

        if (last_child) {
            if (last_child.is(QUERY)) {
                const span = cE("span");
                span.__set_offset(tail);
                ele.appendChild(span);
            }
        }
        node.ele = ele;
        return ele;


    } else if (node.is(TEXT)) {
        const text = new Text(node.meta);
        text.__set_offset(head);
        vp.offset = tail;

        if (vp.edit_host.start_offset >= head && vp.edit_host.start_offset < tail) {
            vp.range.setStart(text, vp.edit_host.start_offset - head);
        }

        if (vp.edit_host.end_offset >= head && vp.edit_host.end_offset < tail) {
            vp.range.setEnd(text, vp.edit_host.end_offset - head);
        }
        node.ele = text;
        return text;
    } else if (node.is(ANCHOR)) {
        const anchor = node.ele = cE("a");
        anchor.href = node.meta;
        return addChildNodes(node, anchor, vp);
    } else if (node.is(BOLD)) {
        return addChildNodes(node, node.ele = cE("strong"), vp);
    } else if (node.is(CODE_INLINE)) {
        return addChildNodes(node, node.ele = cE("code"), vp);
    } else if (node.is(IMAGE)) {
        const img = node.ele = cE("img");
        img.src = node.meta;
        return addChildNodes(node, img, vp);
    } else if (node.is(ITALIC)) {
        return addChildNodes(node, node.ele = cE("i"), vp);
    } else if (node.is(QUERY)) {
        vp.offset++;
        const div = addChildNodes(node, node.ele = cE("div"), vp);
        div.innerHTML = "Hello World";
        div.setAttribute("contentEditable", "false");
        div.classList.add("query-field");
        return div;
    } else if (node.is(ROOT)) {
        //First has a zero length offset
        const div = addChildNodes(node, node.ele = cE("div"), vp);
        div.setAttribute("contentEditable", "true");
        return div;
    } else node.ele = cE('div');
}

function addChildNodes<T extends Node>(
    node: MDNode,
    ele: T,
    vp: ViewPack
): T {

    for (let i = 0, c = node.children, l = c.length - 1; i <= l; i++)
        ele.appendChild(toHTMLNaive(c[i], vp, i == l));


    return ele;
}

export function toMDString(node: MDNode): string {
    if (node.is(PARAGRAPH)) {
        return nodeChildrenToString(node);
    } else if (node.is(TEXT)) {
        return node.meta;
    } else if (node.is(ANCHOR)) {
        return ["[", nodeChildrenToString(node), "]", "(", node.meta, ")"].join("");
    } else if (node.is(BOLD)) {
        return ["__", nodeChildrenToString(node), "__"].join("");
    } else if (node.is(CODE_BLOCK)) {
        return ["```", code.getSyntax(node), "\n", code.getText(node), "\n```"].join("");
    } else if (node.is(CODE_INLINE)) {
        return ["`", nodeChildrenToString(node), "`"].join("");
    } else if (node.is(HEADER)) {
        return [("#").repeat(node.meta), " ", nodeChildrenToString(node)].join("");
    } else if (node.is(IMAGE)) {
        return ["![", nodeChildrenToString(node), "]", "(", node.meta, ")"].join("");
    } else if (node.is(ITALIC)) {
        return ["*", nodeChildrenToString(node), "*"].join("");
    } else if (node.is(ORDERED_LIST)) {
        return [("  ").repeat(node.meta), "1. ", nodeChildrenToString(node)].join("");
    } else if (node.is(QUERY)) {
        return ["{", node.meta, "}"].join("");
    } else if (node.is(QUOTE)) {
        return ["> ", nodeChildrenToString(node)].join("");
    } else if (node.is(ROOT)) {
        return nodeChildrenToString(node, "\n\n");
    } else if (node.is(UNORDERED_LIST)) {
        return [("  ").repeat(node.meta), "- ", nodeChildrenToString(node)].join("");
    } else return "";
}

function nodeChildrenToString(
    node: MDNode,
    separator: string = ""
): string {
    return node.children.map(toMDString).join(separator);
}
export function updatePointerData(edit_host: EditHost) {
    if (edit_host.debug_data.DEBUGGER_ENABLED) {
        const { start_offset, end_offset } = edit_host;
        edit_host.debug_data.cursor_start = start_offset;
        edit_host.debug_data.cursor_end = end_offset;
        updateMarkdownDebugger(edit_host);
    }
}

export function updateMarkdownDebugger(host: EditHost) {
    if (host.debug_data.ele) {
        if (host.debug_data.DEBUGGER_ENABLED) {

            if (!host.debug_data.ele.firstElementChild) {
                const pre = document.createElement("pre");
                host.debug_data.ele.appendChild(pre);
            }

            host.debug_data.ele.firstElementChild.innerHTML =
                `
Start offset: ${host.debug_data.cursor_start}
End offset  : ${host.debug_data.cursor_end}
=====================Markdown===================
${toMDString(host.root)}
================================================
`;
        } else {
            host.debug_data.ele.innerHTML = "";
        }
    }
}

/**
 * Toggle the editable state of the host element
 */
export function toggleEditable(edit_host: EditHost) {
    const EDITABLE = edit_host.host_ele.getAttribute("contenteditable") == "true";

    setEditable(edit_host, !EDITABLE);
}

/**
 * Set the editable state of the host element
 */
export function setEditable(edit_host: EditHost, EDITABLE: boolean = true) {
    if (edit_host.host_ele)
        if (EDITABLE)
            edit_host.host_ele.setAttribute("contenteditable", "true");
        else
            edit_host.host_ele.setAttribute("contenteditable", "false");
}

export const toHTML = toHTMLNaive;

export function updateCaretData(edit_host: EditHost) {

    const {
        start_offset,
        end_offset
    } = edit_host;

    const { node: start_node, head: start_head, parents } =
        getNodeAt(edit_host.root, start_offset, TEXT, PARAGRAPH, CODE_BLOCK, HEADER, QUERY);
    const { node: end_node, head: end_head } =
        getNodeAt(edit_host.root, end_offset, TEXT, PARAGRAPH, CODE_BLOCK, HEADER, QUERY);

    if (start_node.is(TEXT)) {
        setZeroLengthSelection(start_node.ele, start_offset - start_head);

    } else if (start_node.is(QUERY)) {
        const { node, head } = getNodeAtWithTail(edit_host.root, start_offset, TEXT);

        setZeroLengthSelection(node.ele, node.length);

    } else {
        //Get the last node of the previous element
        const index = edit_host.root.children.indexOf(start_node);
        if (start_head == start_offset) {
            const prev = edit_host.root.children[index - 1];

            const { node, head } = getNodeAt(prev, prev.length, TEXT);
            if (node) {
                setZeroLengthSelection(node.ele, node.length);
            } else {
                const ele = prev.ele.lastChild;
                setZeroLengthSelection(ele, 0);
            }
        } else if (start_node.is(CODE_BLOCK)) {
            code.setSelection(start_node, start_offset - start_head - 1);
        }
    }
}

/**
 * Move selection cursor to an offset based on a Text node
 */
export function setZeroLengthSelection(
    /**
     * The text node in which the selection should be set.
     */
    text_node: Node,
    /**
     * The offset beginning from the 0th position of the 
     * text_node `data` string at which the cursor should
     * be placed.
     */
    offset: number
) {

    const selection = window.getSelection();
    var range = document.createRange();
    range.setStart(text_node, offset);
    range.setEnd(text_node, offset);
    selection.removeAllRanges();
    selection.addRange(range);
}

/**
 * Create a selection between two textNodes
 */
export function setSelection(
    /**
     * The text node in which the selection should start.
     */
    text_node_head: Text,
    /**
     * The offset beginning from the 0th position of the 
     * text_node_head `data` string at which the cursor should
     * be placed.
     */
    offset_head: number,
    /**
     * The text node in which the selection should end.
     */
    text_node_tail: Text,
    /**
     * The offset beginning from the 0th position of the 
     * text_node_tail `data` string at which the cursor should
     * be placed.
     */
    offset_tail: number
) {

    const selection = window.getSelection();
    var range = document.createRange();
    range.setStart(text_node_head, offset_head);
    range.setEnd(text_node_tail, offset_tail);
    selection.removeAllRanges();
    selection.addRange(range);
}