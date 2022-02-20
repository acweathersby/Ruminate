import { SectionRoot } from "../section/base/root";
import { CodeLine } from '../section/code';
import { ItalicSection } from "../section/decorator";
import { Paragraph } from '../section/paragraph';
import { TextSection } from "../section/text";
import { EditHost } from "../types/edit_host";
import { HistoryTask, TextCommand, TextCommandTask } from "../types/text_command_types";
import { Section } from '../types/types';
import {
    addChildrenStartingAt,
    getEditLine,
    getAtomicSectionAtOffset,
    setZeroLengthSelection,
    updateMetrics,
    updateUIElements,
    setUISelection
} from './common';
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

    const section = getAtomicSectionAtOffset(offset, edit_host, true);

    if (section instanceof CodeLine && section.head < offset) {

        section.insertText(offset, "\n");

    } else {
        const line = getEditLine(section);

        const right = line.split(offset - line.head);
    }

    updateMetrics(edit_host, true);
    edit_host.start_offset = offset + 1;
    edit_host.end_offset = offset + 1;
    updateUIElements(edit_host);
    setUISelection(edit_host);
}

function undoInsertParagraph(
    undo_data: HistoryTask[TextCommand.INSERT_PARAGRAPH]["undo_data"],
    edit_host: EditHost
) {
    const { offset } = undo_data;

    //Begin -- Update history data 
    const start_text_section = getAtomicSectionAtOffset(offset, edit_host);

    const section = getAtomicSectionAtOffset(offset, edit_host, true);

    if (section instanceof CodeLine && section.head < offset) {

        section.removeText(offset, offset + 1);

    } else {
        const line = getEditLine(start_text_section);

        line.mergeLeft();
    }

    updateMetrics(edit_host, true);
    edit_host.start_offset = offset;
    edit_host.end_offset = offset;
    updateUIElements(edit_host);
    setUISelection(edit_host);
}


registerTask("edit", TextCommand.INSERT_PARAGRAPH, insertParagraph);
registerTask("undo", TextCommand.INSERT_PARAGRAPH, undoInsertParagraph);
registerTask("redo", TextCommand.INSERT_PARAGRAPH, redoInsertParagraph);