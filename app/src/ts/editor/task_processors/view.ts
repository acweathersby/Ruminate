import { EditHost } from '../types/edit_host';
import * as code from './code';
import { MDNode, NodeClass, NodeType } from "./md_node";
import { traverse } from './traverse/traverse';
import { RangeOverlapType } from './traverse/yielder/in_range';

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

    let anchor_offset = getCumulativeOffset(anchorNode, edit_host)
        + anchorOffset
        + getHTMLElementLength(anchorNode);

    let focus_offset = getCumulativeOffset(focusNode, edit_host)
        + focusOffset
        + getHTMLElementLength(focusNode);

    edit_host.start_offset = Math.min(anchor_offset, focus_offset) + 1;
    edit_host.end_offset = Math.max(anchor_offset, focus_offset) + 1;
}

function getHTMLElementLength(node: Node) {
    return node instanceof Text
        ? 0
        : node.textContent.length > 0
            ? node.textContent.length - 1
            : 0;
}

export function getCumulativeOffset(node: Node, edit_host: EditHost): number {
    let addendum = 0;

    if (node == edit_host.host_ele)
        return addendum;

    if (node.previousSibling) {
        const prev = node.previousSibling;

        let total_length = -1;
        if (OffsetMap.has(prev)) {
            total_length = OffsetMap.get(prev);
        } else {

            if (prev instanceof HTMLDivElement) {
                if (prev.classList.contains("query-field")) {
                    total_length = 1;
                } else if (prev.classList.contains("cm-gutters")) {
                    total_length = 0;
                } else if (prev.classList.contains("cm-line")) {
                    total_length = prev.textContent.length + 1;
                }
            }
            if (total_length < 0) {
                total_length = prev.textContent.length;
            }
        }

        return getCumulativeOffset(prev, edit_host)
            + total_length + addendum;
    } else {
        return getCumulativeOffset(node.parentElement, edit_host) + addendum;
    }
}


export function updateHost(edit_host: EditHost) {
    edit_host.host_ele.innerHTML = "";
    edit_host.host_ele.appendChild(toHTMLNaive(edit_host.root, {
        edit_host,
        offset: 0
    }));
    updateCaretData(edit_host);
}

const OffsetMap = new WeakMap();

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
            OffsetMap.set(div, node.length);
            return div;
        }

        const ele = addChildNodes(node, cE(tag), vp);

        const last_child = node.children.slice().pop();

        if (last_child) {
            if (last_child.is(QUERY)) {
                const span = cE("span");
                ele.appendChild(span);
            }
        }

        OffsetMap.set(ele, node.length);
        node.ele = ele;
        return ele;


    } else if (node.is(TEXT)) {
        const text = new Text(node.meta);
        vp.offset = tail;
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

    if (start_offset == end_offset && false) {
        const start = getElementOffset(start_offset, edit_host);
        if (start.code_block) {
            code.setSelection(start.code_block, start.offset);
        } else {
            setZeroLengthSelection(start.ele, start.offset);
        }
    } else {

        const range = getSelectionParts(start_offset, end_offset, edit_host);
        setSelection(
            range.start.ele,
            range.start.offset,
            range.end.ele,
            range.end.offset
        );
    }
}

function getSelectionParts(
    start_offset: number,
    end_offset: number,
    edit_host: EditHost
): (
        {
            CB: false,
            start: { ele?: HTMLElement; offset: number; },
            end: { ele?: HTMLElement; offset: number; },
        }

    ) {
    const range = { CB: false, start: null, end: null };

    for (const { node, meta: { overlap_start, overlap_type, overlap_length } } of
        traverse(edit_host.root)
            .typeFilter(NodeType.TEXT, NodeType.CODE_BLOCK)
            .rangeFilter(start_offset, end_offset)
    ) {
        if (node.is((NodeType.TEXT))) {
            if (overlap_type == RangeOverlapType.COMPLETE)
                continue;
            else if (overlap_type == RangeOverlapType.PARTIAL_HEAD) {
                range.end = { ele: node.ele, offset: overlap_start + overlap_length };
            } else if (overlap_type == RangeOverlapType.PARTIAL_TAIL) {
                range.start = { ele: node.ele, offset: overlap_start };
            } else {
                range.start = { ele: node.ele, offset: overlap_start };
                range.end = { ele: node.ele, offset: overlap_start + overlap_length };
            }
        } else if (node.is(NodeType.CODE_BLOCK) && overlap_start > 0) {
            if (overlap_type == RangeOverlapType.COMPLETE)
                continue;
            else if (overlap_type == RangeOverlapType.PARTIAL_HEAD) {
                range.end = code.getElementAtOffset(node, overlap_start + overlap_length - 1);
            } else if (overlap_type == RangeOverlapType.PARTIAL_TAIL) {
                range.start = code.getElementAtOffset(node, overlap_start - 1);
            } else {
                range.start = code.getElementAtOffset(node, overlap_start - 1);
                range.end = code.getElementAtOffset(node, overlap_start + overlap_length - 1);
            }
        }
    }

    function getRangePart(offset) {
        for (const { node, meta: { overlap_start }, getAncestry } of
            traverse(edit_host.root)
                .typeFilter(NodeType.TEXT, NodeType.CODE_BLOCK, NodeType.QUERY)
                .rangeFilter(offset - 1, offset - 1)
        ) {
            if (node.is(NodeType.TEXT)) {
                return { ele: node.ele, offset: node.length };
            } else if (node.is(NodeType.QUERY)) {
                const line = getAncestry().filter(d => d.containsClass(NodeClass.LINE))[0];
                return { ele: line.ele.lastChild, offset: 0 };
            } else if (node.is(NodeType.CODE_BLOCK)) {
                return code.getElementAtOffset(node, node.length - 1);
            }
        }
        return null;
    }

    if (!range.start) {
        //Need to select or add a text area to the end of a line
        range.start = getRangePart(start_offset);
    }

    if (!range.end) {
        range.end = getRangePart(end_offset);
    }

    return range;
}

function getElementOffset(
    start_offset: number,
    edit_host: EditHost
): { ele?: HTMLElement; code_block?: MDNode<NodeType.CODE_BLOCK>; offset: number; } {
    let ele = null;
    let code_block = null;
    let offset = -1;
    for (const { node, meta: { overlap_start } } of
        traverse(edit_host.root)
            .typeFilter(NodeType.TEXT, NodeType.CODE_BLOCK)
            .rangeFilter(start_offset, start_offset)
    ) {
        if (node.is((NodeType.TEXT))) {
            ele = node.ele;
            offset = overlap_start;
            break;
        } else if (node.is(NodeType.CODE_BLOCK) && overlap_start > 0) {
            code_block = node;
            offset = overlap_start - 1;
            break;
        }
    }

    if (!code_block && !ele) {
        //Need to select or add a text area to the end of a line
        for (const { node, meta: { overlap_start }, getAncestry } of
            traverse(edit_host.root)
                .typeFilter(NodeType.TEXT, NodeType.CODE_BLOCK, NodeType.QUERY)
                .rangeFilter(start_offset - 1, start_offset - 1)
        ) {
            if (node.is(NodeType.TEXT)) {
                ele = node.ele;
                offset = node.length;
                break;
            } else if (node.is(NodeType.QUERY)) {
                const line = getAncestry().filter(d => d.containsClass(NodeClass.LINE))[0];
                ele = line.ele.lastChild;
                offset = 0;
                break;
            } else if (node.is(NodeType.CODE_BLOCK)) {
                code_block = node;
                offset = code_block.length - 1;
                break;
            }
        }
    }

    return { ele, code_block, offset };
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
    text_node_head: Node,
    /**
     * The offset beginning from the 0th position of the 
     * text_node_head `data` string at which the cursor should
     * be placed.
     */
    offset_head: number,
    /**
     * The text node in which the selection should end.
     */
    text_node_tail: Node,
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