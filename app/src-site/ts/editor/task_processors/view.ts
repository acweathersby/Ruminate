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
    STEM_LINE
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

    const selection =
        window.getSelection(), {
            focusNode, focusOffset, anchorOffset, anchorNode,
        } = selection,
        { node: n1, offset: o1 } = getRootElement(focusNode, focusOffset),
        { node: n2, offset: o2 } = getRootElement(anchorNode, anchorOffset);

    //Ensure nodes are within the editable area

    let anchor_offset = nodeIsInEditTree(n1, edit_host)
        ? getCumulativeOffset(n1, edit_host) + o1
        : 0;

    let focus_offset = nodeIsInEditTree(n2, edit_host)
        ? getCumulativeOffset(n2, edit_host) + o2
        : 0;

    edit_host.start_offset = Math.min(anchor_offset, focus_offset) + 1;
    edit_host.end_offset = Math.max(anchor_offset, focus_offset) + 1;
}

export function nodeIsInEditTree(node: Node, edit_host: EditHost) {
    const root = edit_host.root.ele;

    if (root) {
        let par = node;

        while (par && par != root) {
            par = par.parentElement;
        }

        if (par == root)
            return true;
    }

    return false;
}

function getRootElement(node: Node, offset: number) {
    if (node instanceof HTMLElement) {
        const l = node.childNodes.length;
        if (l > 0) {
            if (offset < l) {

                return getRootElement(node.childNodes[offset], 0);
            } else {
                return { node, offset: node.textContent.length };
            }
        } else
            return { node, offset };
    } else if (node instanceof Text) {
        return { node, offset };
    }
    throw new Error("Unable to resolve node location");
}

export function getCumulativeOffset(node: Node, edit_host: EditHost): number {

    let addendum = 0;

    if (node == edit_host.root.ele)
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

    for (const note of edit_host.host_ele.getElementsByClassName("editable-note"))
        edit_host.host_ele.removeChild(note);

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

        if (node.is(STEM_LINE)) {

            const text = toMDString(node).trimStart();

            if (text.slice(0, 4) == "``` ") {
                tag = "pre";
            } else if (text.slice(0, 2) == "# ") {
                tag = "h1";
            } else if (text.slice(0, 3) == "## ") {
                tag = "h2";
            } else if (text.slice(0, 4) == "### ") {
                tag = "h3";
            } else if (text.slice(0, 5) == "#### ") {
                tag = "h4";
            } else if (text.slice(0, 6) == "##### ") {
                tag = "h5";
            } else if (text.slice(0, 7) == "###### ") {
                tag = "h6";
            } else {
                tag = "p";
            }
        } else if (node.is(PARAGRAPH)) {
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
            div.classList.add("code-block");
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
        div.setAttribute("contentEditable", "false");
        const id = 2;

        if (!vp.edit_host.active.has(id))
            wick.rt.create_named("readonly", div, { id: id, active: new Set([id, ...vp.edit_host.active]) });
        else
            div.innerHTML = 'Too many recursions!';


        div.classList.add("query-field");
        return div;
    } else if (node.is(ROOT)) {
        //First has a zero length offset
        const div = addChildNodes(node, node.ele = cE("div"), vp);

        if (vp.edit_host.READ_ONLY)
            div.setAttribute("contentEditable", "false");
        else {
            div.setAttribute("contentEditable", "true");
            div.classList.add("editable-note");
        }

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
// Return a string that represents the markdown text
// that occurs before the text of the node's children.
export function toMDPreText(n: MDNode): string {
    if (n.is(PARAGRAPH)) {
        return "\n";
    } else if (n.is(STEM_LINE)) {
        return "\n";
    } else if (n.is(TEXT)) {
        return "";
    } else if (n.is(ANCHOR)) {
        return "[";
    } else if (n.is(BOLD)) {
        return "__";
    } else if (n.is(CODE_BLOCK)) {
        return ["\n", "```", code.getSyntax(n), "\n",
            n.meta.view
                ? n.meta.view.state.doc.toString()
                : n.meta.text
        ].join("");
    } else if (n.is(CODE_INLINE)) {
        return "'";
    } else if (n.is(HEADER)) {
        return ["\n", ("#").repeat(n.meta), " "].join("");
    } else if (n.is(IMAGE)) {
        return ["!["].join("");
    } else if (n.is(ITALIC)) {
        return "*";
    } else if (n.is(ORDERED_LIST)) {
        return ["\n", ("  ").repeat(n.meta), "1. "].join("");
    } else if (n.is(QUERY)) {
        return ["{", n.meta].join("");
    } else if (n.is(QUOTE)) {
        return ["\n", "> "].join("");
    } else if (n.is(ROOT)) {
        return "";
    } else if (n.is(UNORDERED_LIST)) {
        return ["\n", ("  ").repeat(n.meta), "- "].join("");
    } else return "";
}


// Return a string that represents the markdown text
// that occurs after the text of the node's children.
export function toMDPostText(node: MDNode): string {
    if (node.is(PARAGRAPH)) {
        return "\n";
    } else if (node.is(STEM_LINE)) {
        return "\n";
    } else if (node.is(TEXT)) {
        return node.meta;
    } if (node.is(ANCHOR)) {
        return ["]", "(", node.meta, ")"].join("");
    } else if (node.is(BOLD)) {
        return "__";
    } else if (node.is(CODE_BLOCK)) {
        return "\n```\n";
    } else if (node.is(CODE_INLINE)) {
        return "`";
    } else if (node.is(HEADER)) {
        return "\n";
    } else if (node.is(IMAGE)) {
        return ["]", "(", node.meta, ")"].join("");
    } else if (node.is(ITALIC)) {
        return "*";
    } else if (node.is(ORDERED_LIST)) {
        return "\n";
    } else if (node.is(QUERY)) {
        return "}";
    } else if (node.is(QUOTE)) {
        return "\n";
    } else if (node.is(ROOT)) {
        return "";
    } else if (node.is(UNORDERED_LIST)) {
        return "\n";
    } else return "";
}

export function toMDString(node: MDNode): string {
    return [
        toMDPreText(node),
        nodeChildrenToString(node),
        toMDPostText(node)
    ]
        .join("");
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
${toMDString(host.root).trim()}
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
    if (edit_host?.root?.ele && edit_host.root.ele instanceof HTMLElement)
        if (EDITABLE)
            edit_host.root.ele.setAttribute("contenteditable", "true");
        else
            edit_host.root.ele.setAttribute("contenteditable", "false");
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

        if (range.start && range.end) {
            setSelection(
                range.start.ele,
                range.start.offset,
                range.end.ele,
                range.end.offset
            );
        } else {
            console.warn(
                `TODO: resolve out of bound offsets ` +
                `s:${start_offset} e:${end_offset}; ` +
                `Note len: ${edit_host.root.md_length}`
            );
        }
    }
}
export function handleMetaViews(edit_host: EditHost) {
    const {
        start_offset,
        end_offset
    } = edit_host;

    let len = 0;
    console.log({ start_offset });

    for (const node of edit_host.root.children) {
        if (start_offset == len + 1) {
            if (node.ele) {
                if (edit_host.meta_UIs.length > 0) {
                    const comp = edit_host.meta_UIs[0];
                    comp.update({ line: node });
                } else {

                    //Enable the meta edit system at this point. 
                    const comp = wick
                        .rt
                        .create_named(
                            "meta_editor",
                            edit_host.host_ele,
                            { edit_host, line: node }
                        );

                    edit_host.meta_UIs.push(comp);
                    comp.update({ edit_host, line: node });
                }
                return;
            }
        }
        len += node.length;
    }


    for (const comp of edit_host.meta_UIs)
        comp.transitionOut(0, 0, false, null, true);

    edit_host.meta_UIs.length = 0;
}

function getSelectionParts(
    start_offset: number,
    end_offset: number,
    edit_host: EditHost
): (
        {
            start: { ele?: HTMLElement; offset: number; node: MDNode; },
            end: { ele?: HTMLElement; offset: number; node: MDNode; },
        }

    ) {
    const range = { start: null, end: null };

    for (const { node, meta: { overlap_start, overlap_type, overlap_length } } of
        traverse(edit_host.root)
            .typeFilter(NodeType.TEXT, NodeType.CODE_BLOCK)
            .rangeFilter(start_offset, end_offset)
    ) {
        if (node.is((NodeType.TEXT))) {
            if (overlap_type == RangeOverlapType.COMPLETE)
                continue;
            else if (overlap_type == RangeOverlapType.PARTIAL_HEAD) {
                range.end = { ele: node.ele, offset: overlap_start + overlap_length, node };
            } else if (overlap_type == RangeOverlapType.PARTIAL_TAIL) {
                range.start = { ele: node.ele, offset: overlap_start, node };
            } else {
                range.start = { ele: node.ele, offset: overlap_start, node };
                range.end = { ele: node.ele, offset: overlap_start + overlap_length, node };
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
                return { ele: node.ele, offset: node.length, node };
            } else if (node.is(NodeType.QUERY)) {
                const line = getAncestry().filter(d => d.containsClass(NodeClass.LINE))[0];
                return { ele: line.ele.lastChild, offset: 0, node };
            } else if (node.is(NodeType.CODE_BLOCK)) {
                return code.getElementAtOffset(node, node.length - 1);
            } else if (node.is(NodeType.PARAGRAPH)) {
                return { ele: node.ele, offset: 0, node };
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