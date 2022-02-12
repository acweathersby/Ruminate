import { EditLine } from "../section/line";
import { TextSection } from "../section/text";
import { EditHost } from '../types/edit_host';
import { Section } from '../types/types';

export function getSectionFromElement(ele: Node): Section {
    //@ts-ignore
    return ele.ruminate_host;
}
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
/**
 * Returns offset and selection node information
 * from the primary selection range.
 */
export function getOffsetsFromSelection(): {
    start_node: Section;
    end_node: Section;
    start_offset: number;
    end_offset: number;
} {
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

    return {
        start_offset,
        end_offset,
        start_node: FOCUS_IS_HEAD ? focus : anchor,
        end_node: FOCUS_IS_HEAD ? anchor : focus
    };
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
    if (host.markdown_element) {
        if (!host.markdown_element.firstElementChild) {
            const pre = document.createElement("pre");
            host.markdown_element.appendChild(pre);
        }

        host.markdown_element.firstElementChild.innerHTML = host.root.toString();
    }
}
export function addChildrenStartingAt(parent: Section, child: Section) {
    let prev = null;
    for (const sec of child.traverse_horizontal()) {
        sec.link(prev, parent);
        prev = sec;
    }
}
