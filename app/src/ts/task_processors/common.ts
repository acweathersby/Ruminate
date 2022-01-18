import { EditLine } from '../sections.js';
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
    let anchor_offset = anchor.getHeadOffset() + anchorOffset;
    let focus_offset = focus.getHeadOffset() + focusOffset;
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
        for (let section of edit_host.sections)
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
 * @param textNode 
 * @param offset 
 */
export function setZeroLengthSelection(
    /**
     * The text node in which the selection should be set.
     */
    textNode: Text,
    /**
     * The offset beginning from the 0th position of the 
     * focusNode `data` string at which the cursor should
     * be placed.
     */
    offset: number
) {

    const selection = window.getSelection();
    var range = document.createRange();
    range.setStart(textNode, offset);
    range.setEnd(textNode, offset);
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