import { TodoError } from '../errors/todo_error';
import { CodeLine } from '../section/code';
import { EditLine } from '../section/line';
import { QueryDisplay } from '../section/query';
import { TextSection } from '../section/text';
import { EditHost } from "../types/edit_host";
import { ResultType } from '../types/result';
import {
    HistoryTask,
    TextCommand,
    TextCommandTask
} from "../types/text_command_types";
import {
    getAtomicSectionAtOffset,
    getPrevTarget,
    getTextSectionAtOffset,
    setUISelection,
    updateMetrics,
    updateUIElements
} from './common';
import { IS_TEXT } from './format_rules';
import { addOperation } from './history';
import { registerTask } from './register_task';

type InsertTextTask = TextCommandTask[TextCommand.INSERT_TEXT];

function insertText(command: InsertTextTask, edit_host: EditHost) {

    updateMetrics(edit_host);

    const offset = edit_host.start_offset;

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

    updateMetrics(edit_host);

    const { input_text, APPLY_MARKDOWN_FORMAT, offset } = redo_data;

    //Begin -- Resolve insertion point

    let node = getAtomicSectionAtOffset(offset, edit_host);

    if (node instanceof CodeLine && node.head < offset) {
        node.insertText(offset, input_text);
        edit_host.start_offset = offset + input_text.length;
        edit_host.end_offset = offset + input_text.length;
        updateMetrics(edit_host, true);
        setUISelection(edit_host);
    } else {
        if (node instanceof EditLine
            ||
            node instanceof QueryDisplay) {

            //Insert in the previous edit line if it exists
            const text = getPrevTarget(node, IS_TEXT);

            if (text && text.tail == node.head) {
                node = text;
            } else if (node.prev) {
                node = node.prev;
                const child = new TextSection("");
                child.link(node.last_child, node);
                node.updateMetrics(node.head);
                node = child;

            } else {
                node = node.first_child;
                const child = new TextSection("");
                child.link(null, node);
                node.updateMetrics(node.head);
                node = child;
            }
        }

        if (node instanceof TextSection) {

            //End -- Resolve insertion point

            //Begin -- Update or Create insertion nodes. 

            if (APPLY_MARKDOWN_FORMAT) {
                throw new TodoError("Implement insertText with Markdown Formatting");
            } else {
                node.insertText(offset - node.head, input_text);
            }

            //End -- Update or Create insertion nodes. 

            // Begin -- Update Selection

            if (APPLY_MARKDOWN_FORMAT) {
                throw new TodoError("Implement insertText with Markdown Formatting");
            } else {

                updateUIElements(edit_host);
                edit_host.start_offset = offset + input_text.length;
                edit_host.end_offset = offset + input_text.length;
                updateMetrics(edit_host, true);
                setUISelection(edit_host);
            }
        } else
            return {
                type: ResultType.Failed, code: -1,
                message: `Unable to locate acceptable text section at offset ${offset}`
            };
    }

    // End -- Update Selection
}

function undoInsertText(undo_data: HistoryTask[TextCommand.INSERT_TEXT]["undo_data"], edit_host: EditHost) {

    updateMetrics(edit_host, true);

    let node = getAtomicSectionAtOffset(undo_data.offset_start, edit_host);

    if (node instanceof TextSection) {

        node.removeText(undo_data.offset_start - node.head, undo_data.length);

        if (node.length == 0)
            node.remove();

    } else if (node instanceof CodeLine) {
        node.removeText(undo_data.offset_start, undo_data.offset_end);
    }

    updateUIElements(edit_host);

    edit_host.start_offset = undo_data.offset_start;
    edit_host.end_offset = undo_data.offset_start;
    updateMetrics(edit_host, true);
    setUISelection(edit_host);
}


registerTask("edit", TextCommand.INSERT_TEXT, insertText);
registerTask("undo", TextCommand.INSERT_TEXT, undoInsertText);
registerTask("redo", TextCommand.INSERT_TEXT, redoInsertText);