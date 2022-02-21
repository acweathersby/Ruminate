import { MDNode, NodeClass, NodeType } from "./md_node";
import { EditHost } from '../types/edit_host';
import * as code from './code';

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

    edit_host.start_offset = Math.max(anchor_offset, focus_offset);
    edit_host.end_offset = Math.min(anchor_offset, focus_offset);
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

    if (node.containsClass(NodeClass.LINE))
        vp.offset++;

    if (node.is(PARAGRAPH)) {
        return addChildNodes(node, cE("p"), vp);
    } else if (node.is(TEXT)) {
        const head = vp.offset;
        const tail = vp.offset + node.meta.length;
        const text = new Text(node.meta);
        text.__set_offset(head);
        vp.offset = tail;

        if (vp.edit_host.start_offset >= head && vp.edit_host.start_offset < tail) {
            vp.range.setStart(text, vp.edit_host.start_offset - head);
        }

        if (vp.edit_host.end_offset >= head && vp.edit_host.end_offset < tail) {
            vp.range.setEnd(text, vp.edit_host.end_offset - head);
        }

        return text;
    } else if (node.is(ANCHOR)) {
        const anchor = cE("a");
        anchor.href = node.meta;
        return addChildNodes(node, anchor, vp);
    } else if (node.is(BOLD)) {
        return addChildNodes(node, cE("strong"), vp);
    } else if (node.is(CODE_BLOCK)) {
        const div = cE("div");
        code.createView(node, div);
        return div;
    } else if (node.is(CODE_INLINE)) {
        return addChildNodes(node, cE("code"), vp);
    } else if (node.is(HEADER)) {
        return addChildNodes(node, cE("h" + node.meta), vp);
    } else if (node.is(IMAGE)) {
        const img = cE("img");
        img.src = node.meta;
        return addChildNodes(node, img, vp);
    } else if (node.is(ITALIC)) {
        return addChildNodes(node, cE("i"), vp);
    } else if (node.is(ORDERED_LIST)) {
        return addChildNodes(node, cE("li"), vp);
    } else if (node.is(QUERY)) {
        vp.offset++;
        const div = addChildNodes(node, cE("div"), vp);
        div.innerHTML = "Hello World";
        div.setAttribute("contentEditable", "false");
        div.classList.add("query-field");
        if (LAST_CHILD) {
            const outer = cE("div");
            const straggler = cE("span");
            straggler.innerHTML = "";
            straggler.style.padding = "0 5px";
            outer.appendChild(div);
            outer.appendChild(straggler);
            straggler.__set_offset(vp.offset);
            return outer;
        } return div;
    } else if (node.is(QUOTE)) {

    } else if (node.is(ROOT)) {
        //First has a zero length offset
        const div = addChildNodes(node, cE("div"), vp);
        div.setAttribute("contentEditable", "true");
        return div;
    } else if (node.is(UNORDERED_LIST)) {
        return addChildNodes(node, cE("li"), vp);
    } else cE('div');
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
        return ["[", node.meta, "]", "(", nodeChildrenToString(node), ")"].join("");
    } else if (node.is(BOLD)) {
        return ["__", nodeChildrenToString(node), "__"].join("");
    } else if (node.is(CODE_BLOCK)) {
        return ["```", code.getSyntax(node), "\n", code.getText(node), "\n```"].join("");
    } else if (node.is(CODE_INLINE)) {
        return ["`", nodeChildrenToString(node), "`"].join("");
    } else if (node.is(HEADER)) {
        return [("#").repeat(node.meta), " ", nodeChildrenToString(node)].join("");
    } else if (node.is(IMAGE)) {
        return ["![", node.meta, "]", "(", nodeChildrenToString(node), ")"].join("");
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