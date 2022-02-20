import { SectionBase } from '../section/base/base';
import { CodeLine } from '../section/code';
import { EditLine } from "../section/line";
import { Paragraph } from '../section/paragraph';
import { QueryDisplay } from '../section/query';
import { TextSection } from "../section/text";
import { EditHost } from '../types/edit_host';
import { Section } from '../types/types';
import { IS_ATOMIC_SECTION, IS_CARRET_TARGET, IS_TEXT, IS_TEXT_WRAPPER } from './format_rules';


/**
 * Traverse a node tree, looking for instance of a given type.
 * if a node matches the instance type, it is yielded, and its
 * child nodes are not traversed. Otherwise the full node
 * tree is traversed.
 */
function* getNodesOfType(root: Section, type: any) {
    if (root instanceof type) {
        yield root;
    } else {
        if (root.first_child) {
            for (const node of root.first_child.traverse_horizontal())
                yield* getNodesOfType(node, type);
        }
    }
}
export function getRoot(section: Section): EditLine {
    let par = section.parent;

    while (par) {
        if (!par.parent)
            return <EditLine>par;
        par = par.parent;
    }

    return <EditLine>section;
}


export function getSectionFromNode(node: Node, edit_host: EditHost) {
    let par = node;
    while (par) {
        for (let section of edit_host.root.children)
            if (section.ele == par)
                return section;
        par = par.parentElement;
    }

    return null;
}

/**
 * Returns true if the node is the first child of 
 * a section's element.
 */
export function nodeIsAtSectionRoot(node: Node, edit_host: EditHost): boolean {
    return true;
}
/**
 * Move selection cursor to an offset based on a Text node
 */
export function setZeroLengthSelection(
    /**
     * The text node in which the selection should be set.
     */
    text_node: Text,
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

export function removeListeners(edit_host: EditHost) {
    for (const name in edit_host.event_handlers)
        edit_host.host_ele.removeEventListener(name, edit_host.event_handlers[name]);
}


export function mergeSections(section: Section, prev_section: Section, edit_host: EditHost) {
    debugger;
}

/**
 * Retrieves the TextSection node which intersects the givin offset point.
 * 
 * If the offset is outside the bounds of the editable areas, then null is 
 * returned. 
 */
export function getTextSectionAtOffset(
    offset: number,
    edit_host: EditHost,
    TAIL_CAPTURE: boolean = false
): TextSection | null {

    for (const line of edit_host.root.children) {

        if (line.overlaps(offset)) {
            let candidates: Section[] = [line];

            for (const candidate of candidates) {
                if (candidate.first_child)
                    for (const node of candidate.first_child.traverse_horizontal()) {
                        console.log({ head: node.head, offset });
                        if (offset >= node.head && (offset < node.tail || (TAIL_CAPTURE && offset == node.tail))) {
                            if (node instanceof TextSection) {
                                return node;
                            } else {
                                candidates.push(node);
                                break;
                            };
                        }
                    }
            }
        }
    }

    if (edit_host.root.last_child) {

        let sec: Section = edit_host.root.last_child;

        while (sec && !(sec instanceof TextSection))
            sec = sec.last_child;

        if (sec)
            return <TextSection>sec;
    }

    return null;
}

/**
 * Retrieves the irreducible node which intersects the givin offset point.
 * 
 * If the offset is outside the bounds of the editable areas, then null is 
 * returned. 
 */
export function getAtomicSectionAtOffset(
    offset: number,
    edit_host: EditHost,
    TAIL_CAPTURE: boolean = false
): TextSection |
    CodeLine |
    EditLine |
    null {

    for (const line of edit_host.root.children) {

        if (line.overlaps(offset)) {
            console.log(offset, line.head, line.tail);

            if (offset == line.head || IS_ATOMIC_SECTION(line))
                return line;

            let candidates: Section[] = [line];

            for (const candidate of candidates) {
                if (candidate.first_child)
                    for (const node of candidate.first_child.traverse_horizontal()) {

                        if (offset >= node.head && (offset < node.tail || (TAIL_CAPTURE && offset == node.tail))) {
                            if (IS_ATOMIC_SECTION(node)) {
                                return node;
                            } else {
                                candidates.push(node);
                                break;
                            };
                        }
                    }
            }
        }
    }

    if (edit_host.root.last_child) {

        let sec: Section = edit_host.root.last_child;

        while (sec && !IS_ATOMIC_SECTION(sec))
            sec = sec.last_child;

        if (sec)
            return <any>sec;
    }

    return null;
}
/**
 * Retrieve the EditLine of the givin section. 
 * 
 * `null` is returned if the section is not connected to an EditLine
 */
export function getEditLine(section: Section) {
    if (section instanceof EditLine)
        return section;

    let par = section.parent;

    while (par) {
        if (par instanceof EditLine)
            return par;
        par = par.parent;
    }

    return null;
}
/**
 * Updates the edit sections `head` and `tail` offset properties.
 * @param {EditHost} host - An EditHost object.
 * @param FORCE - If `true` force the update of offset properties, regardless of 
 *                dirty state.
 */
export function updateMetrics(host: EditHost, FORCE: boolean = false) {

    if (FORCE || host.DIRTY_METRICS) {
        host.DIRTY_METRICS = false;
        host.root.updateMetrics();
    }
}
/**
 * Sets the `EditHost~DIRTY_METRICS` flag to true.
 * @param {EditHost} host - An EditHost object.
 */
export function invalidateMetrics(host: EditHost) {
    host.DIRTY_METRICS = true;
}

/**
 * Updates the user's view of the edit area
 * @param {EditHost} host - An EditHost object.
 */
export function updateUIElements(host: EditHost) {
    host.root.updateElement();
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
${host.root.toString()}
================================================
`;
        } else {
            host.debug_data.ele.innerHTML = "";
        }
    }
}

export function addChildrenStartingAt(parent: Section, child: Section) {
    let prev = null;
    for (const sec of child.traverse_horizontal()) {
        sec.link(prev, parent);
        prev = sec;
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
/**
 * Retrieve the next text section or null
 * @param section 
 */
export function getNextTarget<T>(
    section: Section,
    target_fn: (t: any) => t is T,
    START: boolean = true
): T | null {

    if (section) {

        if (!START && target_fn(section)) {
            return section;
        } else if (IS_TEXT_WRAPPER(section) && !START) {
            return getNextTarget<T>(section.first_child, target_fn, false);
        } else if (section.next) {
            return getNextTarget<T>(section.next, target_fn, false);
        } else if (section.parent) {

            let parent = section.parent;

            while (parent && !parent.next)
                parent = parent.parent;

            if (parent)
                return getNextTarget<T>(parent.next, target_fn, false);
        }
    }

    return null;
}
/**
 * Retrieve the prev text section or null
 * @param section 
 */
export function getPrevTarget<T>(
    section: Section,
    target_fn: (t: any) => t is T,
    START: boolean = true
): T | null {
    if (section) {

        if (IS_TEXT_WRAPPER(section) && !START) {
            return getPrevTarget<T>(section.last_child, target_fn, false);
        } else if (!START && target_fn(section)) {
            return section;
        } else if (section.prev) {
            return getPrevTarget<T>(section.prev, target_fn, false);
        } else if (section.parent) {

            let parent = section.parent;

            while (parent && !parent.prev)
                parent = parent.parent;

            if (parent)
                return getPrevTarget<T>(parent.prev, target_fn, false);
        }
    }

    return null;
}


export function getSectionFromElement(ele: any) {
    while (ele) {

        if (ele instanceof HTMLElement) {

            if (ele.classList.contains(SectionBase.class_name))
                //@ts-ignore
                return ele.ruminate_host;

        }
        //@ts-ignore
        else if (ele.ruminate_host)
            //@ts-ignore
            return ele.ruminate_host;

        ele = ele.parentElement;
    }

    return null;
}

export function correctSelection(edit_host: EditHost) {

    updateMetrics(edit_host);
    let selection = window.getSelection(), {
        focusNode, focusOffset, anchorOffset, anchorNode,
    } = selection;

    ({ node: focusNode, offset: focusOffset } = getNodeData(focusNode, focusOffset));
    ({ node: anchorNode, offset: anchorOffset } = getNodeData(anchorNode, anchorOffset));

    setSelection(focusNode, focusOffset, anchorNode, anchorOffset);
}

function getNodeData(node: Node, offset: number) {
    const section = getSectionFromElement(node);

    if (section instanceof QueryDisplay) {
        if (offset > 0) {
            const text = getNextCaretTarget(section);
            if (text) {
                node = text.caret_target;
                offset = 0;
            } else {
                node = section.straggler;
                offset = 0;
            }
        } else {
            const text = getPrevCaretTarget(section);
            if (text) {
                node = text.caret_target;
                offset = 0;
            } else {
                node = section.straggler;
                offset = 0;
            }
        }
    }
    return { node, offset };
}

export function getTextOffsetAtNode(ele: Node, pixel_offset: number) {
    // get_stats



    if (ele) {

    }
}

export function updatePointerData(edit_host: EditHost) {
    if (edit_host.debug_data.DEBUGGER_ENABLED) {
        invalidateMetrics(edit_host);
        updateMetrics(edit_host);
        const { start_offset, end_offset } = edit_host;
        edit_host.debug_data.cursor_start = start_offset;
        edit_host.debug_data.cursor_end = end_offset;
        updateMarkdownDebugger(edit_host);
    }
}

export function setUISelection(edit_host: EditHost) {
    if (edit_host.start_offset != edit_host.end_offset) {
        const { ele: start, offset: start_offset } = getOffsetTuple(edit_host.start_offset, edit_host);
        const { ele: end, offset: end_offset } = getOffsetTuple(edit_host.end_offset, edit_host);
        setSelection(start, start_offset, end, end_offset);
    } else {
        const result = getOffsetTuple(edit_host.start_offset, edit_host);
        if (result) {
            const { ele, offset } = result;
            setZeroLengthSelection(ele, offset);
        };
    }
}

function getOffsetTuple(md_offset: number, edit_host: EditHost, IN_RANGE: boolean = false) {

    let section = getAtomicSectionAtOffset(md_offset, edit_host);

    if (section instanceof CodeLine) {

        if (md_offset == section.head) {
            let text = getPrevTarget(section, IS_CARRET_TARGET);
            if (text)
                return { ele: text.caret_target, offset: text.length };
        } else {
            if (IN_RANGE) {

            } else {
                section.setOffset(md_offset);
                return null;
            }
        }
    }

    if (section instanceof EditLine) {

        let text = getPrevTarget(section, IS_CARRET_TARGET);
        if (text)
            return { ele: text.caret_target, offset: text.length };
        else if (section instanceof QueryDisplay) {
            let text = getNextTarget(section, IS_CARRET_TARGET);
            if (!text || getEditLine(text) != getEditLine(section)) {
                return { ele: section.straggler, offset: 1 };
            }
            return { ele: text.caret_target, offset: 0 };
        }
    }

    return { ele: section.ele, offset: md_offset - section.head };
}

export function adaptSelectionPosition(edit_host: EditHost, target: HTMLElement) {
    invalidateMetrics(edit_host);
    updateMetrics(edit_host);

    const section = getSectionFromElement(target);

    if (section instanceof CodeLine) {
        return section.getOffset();
    } else {
        return getOffsetTuple(section, edit_host).offset;
    }
}


/**
 * Returns offset and selection node information
 * from the primary selection range.
 */
export function getOffsetsFromSelection(edit_host: EditHost) {

    const selection = window.getSelection(), {
        focusNode, focusOffset, anchorOffset, anchorNode,
    } = selection;

    let anchor = getSectionFromElement(anchorNode);
    let focus = getSectionFromElement(focusNode);

    let anchor_offset = anchor.head + anchorOffset;
    let focus_offset = focus.head + focusOffset;
    let FOCUS_IS_HEAD = anchor_offset > focus_offset;
    let start_offset = FOCUS_IS_HEAD ? focus_offset : anchor_offset;
    let end_offset = FOCUS_IS_HEAD ? anchor_offset : focus_offset;

    edit_host.start_offset = anchor_offset;
    edit_host.end_offset = focus_offset;
}

export function getPrevNonCharacterOffset() {

}

export function getNextNonCharacterOffset() {

}