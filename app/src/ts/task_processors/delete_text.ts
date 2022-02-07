import { parseMarkdownText } from '../parse_markdown';
import { convertMDASTToEditLines, EditLine } from '../sections';
import { EditHost } from "../types/edit_host";
import { DeletionComplexity, HistoryTask, TextCommand, TextCommandTask } from "../types/text_command_types";
import { getEditLine, getTextSectionAtOffset, setSelection, setZeroLengthSelection } from './common.js';
import { addOperation } from './history.js';
import { modifySections } from './modify_sections';
import { registerTask } from './register_task.js';

type DeleteTextTask = TextCommandTask[TextCommand.DELETE_TEXT];


function deleteText(command: DeleteTextTask, edit_host: EditHost) {

    edit_host.root.updateMetrics();

    //Identify the complexity involved in performing this deletion.
    const
        offset_start = command.data.offset,
        offset_end = command.data.offset + command.data.length,
        start_text_section = getTextSectionAtOffset(offset_start, edit_host),
        end_text_section = getTextSectionAtOffset(offset_end, edit_host);

    let
        first_edit_line = 0,
        last_edit_line = 0,
        complexity = DeletionComplexity.UNDEFINED,
        input_text = "--undefined--";

    if (start_text_section == end_text_section) {

        complexity = DeletionComplexity.TEXT_SECTION;

        const seg_start = offset_start - start_text_section.head;
        const seg_end = offset_end - start_text_section.head;

        input_text = start_text_section.text.slice(seg_start, seg_end);

    } else if (getEditLine(start_text_section) == getEditLine(end_text_section)) {

        const edit_line = getEditLine(start_text_section);

        complexity = DeletionComplexity.SECTION_OVERLAP;

        input_text = edit_line.toString();

        first_edit_line = edit_line.index;

    } else {

        complexity = DeletionComplexity.EDIT_LINE_OVERLAP;

        const effected_lines = edit_host.root.children
            .filter(c => c.head <= offset_end && c.tail >= offset_start);

        input_text = effected_lines
            .map(v => v.toString()).join("\n");

        first_edit_line = effected_lines[0].index;
        last_edit_line = first_edit_line + 1;

        if (start_text_section.head == offset_start) {
            //first_edit_line = first_edit_line - 1;
        }

        if (end_text_section.tail == offset_end)
            last_edit_line = -1;

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
                offset: offset_start,
                first_edit_line,
                last_edit_line
            }
        }, edit_host);


};

function redoDeleteText(redo_data: HistoryTask[TextCommand.DELETE_TEXT]["redo_data"], edit_host: EditHost) {

    edit_host.root.updateMetrics();


    let {
        complexity,
        length,
        offset
    } = redo_data;

    switch (complexity) {

        case DeletionComplexity.TEXT_SECTION: {
            //Get the target text section

            const text = getTextSectionAtOffset(offset, edit_host);

            text.removeText(offset - text.head, length);

            if (text.length == 0) {
                //Update markdown
                const edit_line = getEditLine(text);

                edit_line.updateElement();

                const node = getTextSectionAtOffset(offset, edit_host);

                setZeroLengthSelection(node.ele, offset - node.head);
            } else {
                setZeroLengthSelection(text.ele, offset - text.head);
            }

        } break;
        case DeletionComplexity.SECTION_OVERLAP: {
            const edit_line = getEditLine(getTextSectionAtOffset(offset, edit_host));

            modifySections(edit_line, offset, offset + length,
                {
                    on_text_segment: (s, start, end, mf) => {
                        s.removeText(start, end);
                    },
                    on_section_segment: (s, start, end, mf) => {
                        modifySections(s, start, end, mf);
                    },
                    on_seg_overlap: (s, start, end, mf) => {
                        s.remove();
                    },
                }
            );

            edit_host.root.updateElement();

            const node = getTextSectionAtOffset(offset, edit_host);

            setZeroLengthSelection(node.ele, offset - node.head);

        } break;

        case DeletionComplexity.EDIT_LINE_OVERLAP: {

            //Merge edit lines that overlap the deletion region
            const end_offset = length + offset;

            modifySections(edit_host.root, offset, end_offset, {
                on_text_segment: (s, start, end, mf) => {
                    s.removeText(start, end);
                },
                on_section_segment: (s, start, end, mf) => {
                    if (s instanceof EditLine) {
                        if (start <= s.head && end > s.head) {
                            s.mergeLeft();
                        }
                    }
                    modifySections(s, start, end, mf);
                },
                on_seg_overlap: (s, start, end, mf) => {
                    s.remove();
                },
            });

            edit_host.root.updateMetrics();
            edit_host.root.updateElement();

            const node = getTextSectionAtOffset(offset, edit_host);

            setZeroLengthSelection(node.ele, offset - node.head);
        }
            break;
    }
    // End -- Update Selection  
}


function undoDeleteText(undo_data: HistoryTask[TextCommand.DELETE_TEXT]["undo_data"], edit_host: EditHost) {

    edit_host.root.updateMetrics();

    const {
        complexity,
        input_text,
        offset,
        first_edit_line,
        last_edit_line
    } = undo_data;

    switch (complexity) {
        case DeletionComplexity.TEXT_SECTION: {

            const text = getTextSectionAtOffset(offset, edit_host);

            text.insertText(offset - text.head, input_text);

            setSelection(
                text.ele,
                offset - text.head,
                text.ele,
                offset - text.head + input_text.length
            );

        } break;
        case DeletionComplexity.SECTION_OVERLAP: {

            replaceEditLineContent(input_text, edit_host.root.children[first_edit_line], edit_host);

            edit_host.root.updateElement();
            edit_host.root.updateMetrics();
            const node_start = getTextSectionAtOffset(offset, edit_host);
            const node_end = getTextSectionAtOffset(offset, edit_host);


            console.log({ node_start: !!node_start, node_end: !!node_end });

            setSelection(
                node_start.ele,
                offset,
                node_end.ele,
                offset
            );

        } break;
        case DeletionComplexity.EDIT_LINE_OVERLAP: {

            const children = edit_host.root.children;

            if (first_edit_line < 0) {
                insertEditLineContent(input_text, children[first_edit_line], edit_host);
            } else {
                replaceEditLineContent(input_text, children[first_edit_line], edit_host);
            }
            edit_host.root.updateMetrics();
            edit_host.root.updateElement();

        } break;
    }
}


registerTask("edit", TextCommand.DELETE_TEXT, deleteText);
registerTask("undo", TextCommand.DELETE_TEXT, undoDeleteText);
registerTask("redo", TextCommand.DELETE_TEXT, redoDeleteText);

function insertEditLineContent(input_text: string, prev_edit_line: EditLine, edit_host: EditHost) {
    const md = parseMarkdownText(input_text);

    const edit_lines = convertMDASTToEditLines(md);

    let last = prev_edit_line;

    for (const edit_line of edit_lines) {
        edit_line.link(last, edit_host.root);
        last = edit_line;
    }
}

function replaceEditLineContent(input_text: string, prev_edit_line: EditLine, edit_host: EditHost) {

    insertEditLineContent(input_text, prev_edit_line, edit_host);

    prev_edit_line.remove();

}
