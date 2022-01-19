import { BoldSection, ItalicSection, TextSection } from './sections';
import { Section } from './types/types';
import { EditHost } from "./types/edit_host";
import { TextCommand, TextCommandTask } from './types/text_command_types';
import { getProcessor } from './task_processors/register_task';

import { getOffsetsFromSelection, getSectionFromElement, getRoot, setZeroLengthSelection, nodeIsAtSectionRoot, getSectionFromNode, mergeSections } from './task_processors/common';
import { undo, redo } from './task_processors/history';

export function getCursorOffsets(edit_host: EditHost) {
    const sel = window.getSelection();
    return {
        start: getSelectionOffset(sel.anchorNode, sel.anchorOffset, edit_host),
        end: getSelectionOffset(sel.anchorNode, sel.anchorOffset, edit_host)
    };
}

export function getSelectionOffset(node: Node, offset: number, edit_host: EditHost): {
    offset: number,
    section: Section;
} {
    const host: Section =
        //@ts-ignore
        node.ruminate_host;

    let prev = host.prev;

    while (prev) {
        offset += prev.length;
        prev = prev.prev;
    }

    let par = host.parent;

    while (par.parent) {
        let prev = par.prev;

        offset += par.leading_offset;

        while (prev) {
            offset += prev.length;
            prev = prev.prev;
        }

        par = par.parent;
    }

    for (const section of edit_host.sections)
        if (section == par) {
            return { offset, section };
        } else {
            offset += section.length;
        }




    throw new Error("Unable to derive absolute selection offset");
}


export function attachListeners(edit_host: EditHost) {

    edit_host.event_handlers = {
        cut(e: ClipboardEvent) {
            debugger;
        },
        copy(e: ClipboardEvent) {
            debugger;
        },
        paste(e: ClipboardEvent) {
            debugger;
        },
        keypress(e: KeyboardEvent) {
            /*  if (e.code == "Space") {
                 insertText(" ", edit_host);
             } */
        },
        keydown(e: KeyboardEvent) {
            const sel = window.getSelection();

            let NO_DEFAULT = false;

            if (e.ctrlKey) {

                if (e.code == "KeyZ") {
                    if (e.shiftKey) {
                        edit_host.event_handlers.beforeinput(<any>{ inputType: "historyRedo" });
                    } else
                        edit_host.event_handlers.beforeinput(<any>{ inputType: "historyUndo" });

                    NO_DEFAULT = true;
                }
            }

            if (NO_DEFAULT)
                e.preventDefault();
            e.stopImmediatePropagation();
        },
        beforeinput(e: InputEvent) {


            if (e.preventDefault)
                e.preventDefault();

            switch (e.inputType) {
                case "insertText": {
                    const command = <TextCommandTask[TextCommand.INSERT_TEXT]>{
                        command: TextCommand.INSERT_TEXT,
                        data: {
                            APPLY_MARKDOWN_FORMAT: false,
                            input_text: e.data,
                            offset: getOffsetsFromSelection().start_offset
                        }
                    };
                    getProcessor("edit", TextCommand.INSERT_TEXT)(command, edit_host);
                }; break;
                case "insertReplacementText": debugger; break;
                case "insertLineBreak": debugger; break;
                case "insertParagraph": debugger; break;
                case "insertOrderedList": debugger; break;
                case "insertUnorderedList": debugger; break;
                case "insertHorizontalRule": debugger; break;
                case "insertFromYank": debugger; break;
                case "insertFromDrop": debugger; break;
                case "insertFromPaste": debugger; break;
                case "insertFromPasteAsQuotation": debugger; break;
                case "insertTranspose": debugger; break;
                case "insertCompositionText": debugger; break;
                case "insertLink": debugger; break;
                case "deleteWordBackward": debugger; break;
                case "deleteWordForward": debugger; break;
                case "deleteSoftLineBackward": debugger; break;
                case "deleteSoftLineForward": debugger; break;
                case "deleteEntireSoftLine": debugger; break;
                case "deleteHardLineBackward": debugger; break;
                case "deleteHardLineForward": debugger; break;
                case "deleteByDrag": debugger; break;
                case "deleteByCut": debugger; break;
                case "deleteContent": debugger; break;
                case "deleteContentBackward": debugger; break;
                case "deleteContentForward": debugger; break;
                case "historyUndo": { undo(edit_host); } break;
                case "historyRedo": { redo(edit_host); } break;
                case "formatBold": debugger; break;
                case "formatItalic": formatItalic(edit_host); break;
                case "formatUnderline": debugger; break;
                case "formatStrikeThrough": debugger; break;
                case "formatSuperscript": debugger; break;
                case "formatSubscript": debugger; break;
                case "formatJustifyFull": debugger; break;
                case "formatJustifyCenter": debugger; break;
                case "formatJustifyRight": debugger; break;
                case "formatJustifyLeft": debugger; break;
                case "formatIndent": debugger; break;
                case "formatOutdent": debugger; break;
                case "formatRemove": debugger; break;
                case "formatSetBlockTextDirection": debugger; break;
                case "formatSetInlineTextDirection": debugger; break;
                case "formatBackColor": debugger; break;
                case "formatFontColor": debugger; break;
                case "formatFontName": debugger; break;
            }
        },
    };

    for (const name in edit_host.event_handlers)
        edit_host.host_ele.addEventListener(name, edit_host.event_handlers[name]);
}

function formatItalic(edit_host: EditHost) {

    const cursor_offset = getCursorOffsets(edit_host),
        selection = window.getSelection(),
        {
            focusNode,
            focusOffset,
            anchorOffset,
            anchorNode,
        } = selection;
    const start_inner_offset = focusOffset > anchorOffset ? anchorOffset : focusOffset;
    const end_inner_offset = focusOffset > anchorOffset ? focusOffset : anchorOffset;
    const start_node = getSectionFromElement(focusOffset > anchorOffset ? anchorNode : focusNode);
    const end_node = getSectionFromElement(focusOffset > anchorOffset ? focusNode : anchorNode);

    let anchor = getSectionFromElement(anchorNode);
    let focus = getSectionFromElement(focusNode);
    let anchor_offset = anchor.getHeadOffset() + anchorOffset;
    let focus_offset = focus.getHeadOffset() + focusOffset;
    let FOCUS_IS_HEAD = anchor_offset > focus_offset;


    // Traverse nodes from start to end. If there is a mix of italic and none italic nodes  within 
    // the regions, or no italics at all, then we will insert or expand italic nodes were appropriate to ensure the entire
    // region is in italics (short of nodes that are not valid italics targets: ie code blocks, query blocks)

    // If the region is entirely within one or more continuous italics blocks, then remove all italic nodes within the region,
    // truncating tip nodes if necessary.

    //Track down italic nodes within region

    let start_offset = FOCUS_IS_HEAD ? focus_offset : anchor_offset;
    let end_offset = FOCUS_IS_HEAD ? anchor_offset : focus_offset;

    //Get root start and end;
    let root_start = getRoot(start_node);
    let root_end = getRoot(end_node);

    let roots = [root_start];
    const [root] = roots;

    let INSIDE_ITALICS = false;
    let index = -1;
    const children = root.children;

    for (const root of roots) {
        let start = Math.max(start_offset, root.getHeadOffset());
        let end = end_offset;
        let sections = [];
        let invert_sections = [];
        let section_start = -1;
        let start_node = null;
        let invert_section_node = null;
        let invert_section_start = -1;
        let IN_ITALICS = false;
        let last_italics = null;

        const slices = [];

        for (const child of root.first_child.traverse_horizontal()) {
            if (child instanceof BoldSection)
                continue;
            if (child instanceof ItalicSection) {
                if (child.IS_START && !INSIDE_ITALICS) {

                } else if (last_italics == child.linked) {

                }
            }

        }


        for (const child of root.first_child.traverse_horizontal()) {

            const head = child.getHeadOffset();
            const tail = child.getTailOffset();
            let HEAD_INSIDE = start_offset <= head && head < end_offset;
            let TAIL_INSIDE = start_offset < tail && tail <= end_offset;
            let OVERLAP = head < end_offset && tail >= start_offset;


            if (child instanceof ItalicSection) {
                if (child.IS_START && !INSIDE_ITALICS) {

                    if (OVERLAP && section_start >= 0) {
                        sections.push([{ off: section_start, node: start_node }, { off: child.getHeadOffset(), node: child }]);
                        section_start = -1;
                    }

                    if (!last_italics) {
                        last_italics = child;
                        IN_ITALICS = true;
                    }

                    invert_section_node = child;
                    invert_section_start = head;

                } else if (last_italics == child.linked) {
                    IN_ITALICS = false;
                    last_italics = null;
                    if (OVERLAP) {
                        section_start = child.getTailOffset();
                        start_node = child;
                    }
                }
            } else if (child instanceof TextSection)
                if (OVERLAP) {
                    if (invert_section_node) {
                        invert_sections.push([{ off: invert_section_start, node: invert_section_node }, { off: start, node: child }]);
                        invert_section_start = -1;
                    }
                    if (!IN_ITALICS) {


                        if (section_start < 0) {
                            //Remove any leading whitespace
                            let head_offset = start - head;
                            while ((head_offset) < child.length && child.text[head_offset] == " ") head_offset++;
                            if (head_offset >= child.length) continue;
                            section_start = head_offset + head;
                            start_node = child;
                        }

                        if (child == root.last_child || !TAIL_INSIDE) {

                            //Remove any trailing whitespace
                            let head_offset = end - head - 1;
                            while ((head_offset) >= 0 && child.text[head_offset] == " ") head_offset--;
                            end = head_offset + head + 1;
                            sections.push([{ off: section_start, node: start_node }, { off: end, node: child }]);
                            break;
                        }
                    } else {
                        if (child == root.last_child || !TAIL_INSIDE && HEAD_INSIDE) {
                            if (invert_section_node) {
                                invert_sections.push([{ off: end, node: child }, { off: -1, node: invert_section_node.linked }]);
                            }
                        }
                    }
                }


        }

        if (sections.length > 0) {

            // Adjust section boundaries to ensure all sections are with italics
            for (const [{
                off: start_offset,
                node: start_node,
            }, {
                off: end_offset,
                node: end_node,
            }] of sections) {
                if (start_node instanceof ItalicSection) {
                    if (end_node instanceof ItalicSection) {
                        const root_node = start_node.linked;
                        const anchor_node = end_node.linked;
                        anchor_node.linked = root_node;
                        root_node.linked = anchor_node;
                        end_node.remove();
                        start_node.remove();
                    } else {
                        const split_point = end_offset - end_node.getHeadOffset();
                        end_node.split(split_point);
                        start_node.link(end_node, end_node.parent);
                    }
                } else if (end_node instanceof ItalicSection) {
                    const split_point = start_offset - start_node.getHeadOffset();
                    const node = start_node.split(split_point);
                    end_node.link(node.prev, start_node.parent);
                } else {
                    const start_italics = new ItalicSection();
                    const end_italics = new ItalicSection();
                    const split_pointA = start_offset - start_node.getHeadOffset();
                    const split_pointB = end_offset - end_node.getHeadOffset();
                    end_node.split(split_pointB);
                    end_italics.link(end_node, end_node.parent);
                    const start = start_node.split(split_pointA);
                    start_italics.link(start.prev, start_node.parent);
                    start_italics.linkEnd(end_italics);
                }
            }
        } else {
            const [[{
                node: start_italic,
            }, {
                off: start_offset,
                node: start_node,
            }], [{
                off: end_offset,
                node: end_node,
            }, {
                node: end_italic,
            }]] = invert_sections;

            if (end_italic.getHeadOffset() - end_offset > 0) {
                const split_point = end_offset - end_node.getHeadOffset();
                const next = end_node.split(split_point);
                const new_start = new ItalicSection();
                new_start.IS_START = true;
                new_start.linked = end_italic;
                end_italic.linked = new_start;
                new_start.link(next.prev, next.parent);
            } else {
                end_italic.remove();
            }

            if (true) {
                const split_point = start_offset - start_node.getHeadOffset();
                const next = start_node.split(split_point);

                if (start_offset - start_node.getHeadOffset() > 0) {
                    const new_end = new ItalicSection();
                    new_end.IS_START = false;
                    new_end.linked = start_italic;
                    start_italic.linked = new_end;
                    new_end.link(next.prev, next.parent);
                } else {
                    start_italic.remove();
                }
            } else {
                //Start will be removed.
                debugger;
            }
        }
        //merge text nodes
        for (const child of root.first_child.traverse_horizontal())
            if (child instanceof TextSection) child.merge();
    }

    root.updateElement();
    setZeroLengthSelection(focusNode, focusOffset - 1, selection);
    //Get leading i
}

function deleteTextBackward(len: number, edit_host: EditHost) {

    const cursor_offset = getCursorOffsets(edit_host),
        selection = window.getSelection(),
        {
            focusNode,
            focusOffset,
            anchorOffset,
            anchorNode,
        } = selection;

    if (!(focusNode instanceof Text))
        throw new Error("Unable to insert text in a node that is not Text");

    if (focusOffset == 0) {
        if (nodeIsAtSectionRoot(focusNode, edit_host)) {
            // Perform a join with the previous section, which may
            // cause it to devolve into a paragraph.
            const section = getSectionFromNode(focusNode, edit_host);
            const index = edit_host.sections.indexOf(section);
            if (index > 0) {
                // Merge this section with the previous section.
                let prev_section = edit_host.sections[index - 1];

                mergeSections(section, prev_section, edit_host);
            } else {
                //Section already at beginning of document, do nothing.
            }
        } else {
            // offset is at the boundary between an inline section and a regular node.
        }

        debugger;
    } else {
        focusNode.deleteData(focusOffset - 1, 1);

        cursor_offset.start.section.length -= 1;

        setZeroLengthSelection(focusNode, focusOffset - 1, selection);
    }
}
