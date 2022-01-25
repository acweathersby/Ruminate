import { TodoError } from '../errors/todo_error';
import { EditHost } from "../types/edit_host";
import { DeletionComplexity, HistoryTask, TextCommand, TextCommandTask } from "../types/text_command_types";
import { getEditLine, getTextSectionAtOffset, setSelection, setZeroLengthSelection } from './common.js';
import { addOperation } from './history.js';
import { registerTask } from './register_task.js';

type DeleteTextTask = TextCommandTask[TextCommand.DELETE_TEXT];


function deleteText(command: DeleteTextTask, edit_host: EditHost) {

    //Identify the complexity involved in performing this deletion.
    const offset_start = command.data.offset;

    const offset_end = command.data.offset + command.data.length;

    const start_text_section = getTextSectionAtOffset(offset_start, edit_host);

    const end_text_section = getTextSectionAtOffset(offset_end, edit_host);

    let complexity = DeletionComplexity.UNDEFINED;

    let input_text = "--undefined--";

    if (start_text_section == end_text_section) {

        complexity = DeletionComplexity.TEXT_SECTION;

        const seg_start = offset_start - start_text_section.getHeadOffset();
        const seg_end = offset_end - start_text_section.getHeadOffset();

        input_text = start_text_section.text.slice(seg_start, seg_end);

    } else if (getEditLine(start_text_section) == getEditLine(end_text_section)) {

        complexity = DeletionComplexity.SECTION_OVERLAP;

    } else {

        complexity = DeletionComplexity.EDIT_LINE_OVERLAP;

    }

    command.data.complexity = complexity;

    redoDeleteText(command.data, edit_host);

    addOperation(
        <HistoryTask[TextCommand.DELETE_TEXT]>{
            type: TextCommand.DELETE_TEXT,
            redo_data: command.data,
            undo_data: {
                complexity,
                input_text: input_text,
                offset: offset_start
            }
        }, edit_host);


};

function redoDeleteText(redo_data: HistoryTask[TextCommand.DELETE_TEXT]["redo_data"], edit_host: EditHost) {

    const {
        complexity,
        length,
        offset
    } = redo_data;

    switch (complexity) {

        case DeletionComplexity.TEXT_SECTION:
            //Get the target text section

            const text = getTextSectionAtOffset(offset, edit_host);

            text.removeText(offset - text.getHeadOffset(), length);

            if (text.length == 0) {
                //Update markdown
                const edit_line = getEditLine(text);
                edit_line.updateElement();
                const node = getTextSectionAtOffset(offset, edit_host);
                setZeroLengthSelection(node.ele, offset - node.getHeadOffset());
            } else {
                setZeroLengthSelection(text.ele, offset - text.getHeadOffset());
            }

            break;
        case DeletionComplexity.SECTION_OVERLAP:
            throw new TodoError("Implement redo DeletionComplexity.SECTION_OVERLAP");
            break;
        case DeletionComplexity.EDIT_LINE_OVERLAP:
            throw new TodoError("Implement redo DeletionComplexity.EDIT_LINE_OVERLAP");
            break;
    }
    // End -- Update Selection  
}

function undoDeleteText(undo_data: HistoryTask[TextCommand.DELETE_TEXT]["undo_data"], edit_host: EditHost) {

    const {
        complexity,
        input_text,
        offset
    } = undo_data;

    switch (complexity) {
        case DeletionComplexity.TEXT_SECTION:

            const text = getTextSectionAtOffset(offset, edit_host);

            text.insertText(offset - text.getHeadOffset(), input_text);

            setSelection(
                text.ele,
                offset - text.getHeadOffset(),
                text.ele,
                offset - text.getHeadOffset() + input_text.length
            );

            break;
        case DeletionComplexity.SECTION_OVERLAP:
            throw new TodoError("Implement undo DeletionComplexity.SECTION_OVERLAP");
            break;
        case DeletionComplexity.EDIT_LINE_OVERLAP:
            throw new TodoError("Implement undo DeletionComplexity.EDIT_LINE_OVERLAP");
            break;
    }
}


registerTask("edit", TextCommand.DELETE_TEXT, deleteText);
registerTask("undo", TextCommand.DELETE_TEXT, undoDeleteText);
registerTask("redo", TextCommand.DELETE_TEXT, redoDeleteText);