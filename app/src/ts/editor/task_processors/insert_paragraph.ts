import { EditLine, ItalicSection, LineType, SectionRoot, TextSection } from '../section/sections';
import { EditHost } from "../types/edit_host";
import { HistoryTask, TextCommand, TextCommandTask } from "../types/text_command_types";
import { Section } from '../types/types';
import { addChildrenStartingAt } from './addChildrenStartingAt';
import { getEditLine, getTextSectionAtOffset, setZeroLengthSelection, updateMetrics, updateUIElements } from './common';
import { addOperation } from './history';
import { registerTask } from './register_task';

type InsertParagraphTask = TextCommandTask[TextCommand.INSERT_PARAGRAPH];

function insertParagraph(command: InsertParagraphTask, edit_host: EditHost) {

    updateMetrics(edit_host);

    redoInsertParagraph(command.data, edit_host);

    addOperation(
        <HistoryTask[TextCommand.INSERT_PARAGRAPH]>{
            type: TextCommand.INSERT_PARAGRAPH,
            redo_data: command.data,
            undo_data: {
                offset: command.data.offset
            }
        }, edit_host);

    //End -- Update history data 
};

function redoInsertParagraph(
    redo_data: HistoryTask[TextCommand.INSERT_PARAGRAPH]["redo_data"],
    edit_host: EditHost
) {

    updateMetrics(edit_host);

    // 
    // Types of insertion 
    // Inter sectional, bisectional, and biline
    // Both Intersection and bisectional will end splitting something,
    // - Intersectional will split a section and possibly sub-sections,
    // - Bi-section will have the offset directly between to sections,
    //   allowing for a clean seperation of sections into another line. 
    // - biline is like bi-section, except the split point is between
    //   two lines

    // Get the root element

    const { offset } = redo_data;

    const new_paragraph = new EditLine([], LineType.PARAGRAPH);

    const prev_edit_line = getEditLine(getTextSectionAtOffset(offset, edit_host));

    const right = splitSection(edit_host, offset);

    new_paragraph.link(prev_edit_line);

    if (right)
        addChildrenStartingAt(new_paragraph, right);

    if (new_paragraph) {
        updateUIElements(edit_host);
        updateMetrics(edit_host, true);
        const node = getTextSectionAtOffset(new_paragraph.head + 1, edit_host);
        setZeroLengthSelection(node.ele, 0);
    }
}

function splitSection(edit_host: EditHost, offset: number): Section {

    //Begin -- Update history data 
    let section: Section = getTextSectionAtOffset(offset, edit_host);

    let parent = section.parent;

    let split_right = null;

    while (!(parent instanceof SectionRoot)) {
        // Check to see if section is at a boundary. 
        let AT_SECTION_HEAD = offset == section.head;
        let AT_SECTION_TAIL = offset == section.tail;

        if (!AT_SECTION_HEAD && !AT_SECTION_TAIL) {
            if (section instanceof TextSection) {
                split_right = section.split(offset - section.head);
            } else if (section instanceof ItalicSection) {
                const new_section = new ItalicSection([]);
                if (split_right)
                    addChildrenStartingAt(new_section, split_right);
                new_section.link(section, parent);
                parent.updateMetrics(parent.head);
                split_right = new_section;
            }
        } else if (AT_SECTION_HEAD) {
            split_right = section;
        } else if (AT_SECTION_TAIL) {
            split_right = section.next;
        }

        section = parent;
        parent = section.parent;
    }

    return split_right;
}

function undoInsertParagraph(
    undo_data: HistoryTask[TextCommand.INSERT_PARAGRAPH]["undo_data"],
    edit_host: EditHost
) {
    const { offset } = undo_data;

    //Begin -- Update history data 
    const start_text_section = getTextSectionAtOffset(offset, edit_host);

    const line = getEditLine(start_text_section);

    line.mergeLeft();

    updateUIElements(edit_host);

    updateMetrics(edit_host, true);

    const node = getTextSectionAtOffset(offset, edit_host);

    setZeroLengthSelection(node.ele, offset - node.head);
}


registerTask("edit", TextCommand.INSERT_PARAGRAPH, insertParagraph);
registerTask("undo", TextCommand.INSERT_PARAGRAPH, undoInsertParagraph);
registerTask("redo", TextCommand.INSERT_PARAGRAPH, redoInsertParagraph);