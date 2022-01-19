import { TextCommand, HistoryTask, TextCommandTask } from "../types/text_command_types";
import { EditHost } from "../types/edit_host";
import { TextSection } from '../sections';
import { registerTask } from './register_task';
import { VoidResult, ResultType } from '../types/result';
import { setZeroLengthSelection } from './common';
import { TodoError } from '../errors/todo_error';
import { addOperation } from './history';

type InsertTextTask = TextCommandTask[TextCommand.INSERT_TEXT];

/**
 * Retrieves the TextSection node which intersects the givin offset point.
 * 
 * If the offset is outside the bounds of the editable areas, then null is 
 * returned. 
 */
export function getTextSectionAtOffset(offset: number, edit_host: EditHost) {
    for (const line of edit_host.sections) {
        if (line.overlaps(offset)) {
            for (const node of line.first_child.traverse_horizontal()) {
                if (node instanceof TextSection && node.overlaps(offset))
                    return node;
            }
        }
    }

    return null;
}

function insertText(command: InsertTextTask, edit_host: EditHost): VoidResult {

    redoInsertText(command.data, edit_host);

    //Begin -- Update history data 

    addOperation(
        <HistoryTask[TextCommand.INSERT_TEXT]>{
            type: TextCommand.INSERT_TEXT,
            redo_data: command.data,
            undo_data: {
                length: command.data.input_text.length,
                offset_start: command.data.offset,
                offset_end: command.data.offset + command.data.input_text.length
            }
        }, edit_host);

    //End -- Update history data 
};

function redoInsertText(redo_data: HistoryTask[TextCommand.INSERT_TEXT]["redo_data"], edit_host: EditHost) {

    const { input_text, APPLY_MARKDOWN_FORMAT, offset } = redo_data;

    //Begin -- Resolve insertion point

    const node = getTextSectionAtOffset(offset, edit_host);

    if (!node)
        return {
            type: ResultType.Failed, code: -1,
            message: `Unable to locate acceptable text section at offset ${offset}`
        };

    //End -- Resolve insertion point

    //Begin -- Update or Create insertion nodes. 

    if (APPLY_MARKDOWN_FORMAT) {
        throw new TodoError("Implement insertText with Markdown Formatting");
    } else {
        node.insertText(offset - node.getHeadOffset(), input_text);
    }

    //End -- Update or Create insertion nodes. 

    // Begin -- Update Selection

    if (APPLY_MARKDOWN_FORMAT) {
        throw new TodoError("Implement insertText with Markdown Formatting");
    } else {
        setZeroLengthSelection(node.ele, offset - node.getHeadOffset() + input_text.length);
    }

    // End -- Update Selection
}

function undoInsertText(undo_data: HistoryTask[TextCommand.INSERT_TEXT]["undo_data"], edit_host: EditHost) {

    const node = getTextSectionAtOffset(undo_data.offset_start, edit_host);

    node.removeText(undo_data.offset_start - node.getHeadOffset(), undo_data.length);

    setZeroLengthSelection(node.ele, undo_data.offset_start - node.getHeadOffset());
}


registerTask("edit", TextCommand.INSERT_TEXT, insertText);
registerTask("undo", TextCommand.INSERT_TEXT, undoInsertText);
registerTask("redo", TextCommand.INSERT_TEXT, redoInsertText);