import { getOffsetsFromSelection, invalidateMetrics, toggleEditable, updateMarkdownDebugger, updateMetrics } from './task_processors/common';
import { redo, undo } from './task_processors/history';
import { getProcessor } from './task_processors/register_task';
import { EditHost } from "./types/edit_host";
import { DeletionComplexity, FormatType, TextCommand, TextCommandTask } from './types/text_command_types';

export function attachListeners(edit_host: EditHost) {

    edit_host.event_handlers = {
        cut(e: ClipboardEvent) {
            debugger;
        },
        copy(e: ClipboardEvent) {
            debugger;
        },
        paste(e: ClipboardEvent) {
            //debugger;
        },
        keypress(e: KeyboardEvent) {
            /*  if (e.code == "Space") {
                 insertText(" ", edit_host);
             } */
        },
        keyup(e: KeyboardEvent) {
            console.log(e);
        },
        keydown(e: KeyboardEvent) {
            const sel = window.getSelection();

            let NO_DEFAULT = false;

            if (e.key == 'Alt') {
                toggleEditable(edit_host);
                return false;
            }

            if (e.ctrlKey && e.code) {
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
            console.log("A");
            if (e.preventDefault)
                e.preventDefault();
            processInputEvent(e, edit_host);
        },
    };

    for (const [name, listener] of Object.entries(edit_host.event_handlers))
        edit_host.host_ele.addEventListener(name, <any>listener);
}

export function removeListeners(edit_host: EditHost) {
    if (edit_host.event_handlers)
        for (const [name, listener] of Object.entries(edit_host.event_handlers))
            edit_host.host_ele.removeEventListener(name, <any>listener);
}
/**
 * Decouples the event handling from the event process, preventing
 * event timing violations.
 * @param e 
 * @param edit_host 
 */
async function processInputEvent(e: InputEvent, edit_host: EditHost) {
    invalidateMetrics(edit_host);
    updateMetrics(edit_host);

    switch (e.inputType) {
        case "insertText": insertText(edit_host, e.data); break;

        case "insertLineBreak": debugger; break;
        case "insertParagraph": {
            const command = <TextCommandTask[TextCommand.INSERT_PARAGRAPH]>{
                command: TextCommand.INSERT_PARAGRAPH,
                data: {
                    offset: getOffsetsFromSelection().start_offset
                }
            };
            getProcessor("edit", TextCommand.INSERT_PARAGRAPH)(command, edit_host);
        } break;
        case "insertOrderedList": debugger; break;
        case "insertUnorderedList": debugger; break;
        case "insertHorizontalRule": debugger; break;
        case "insertFromYank": debugger; break;
        case "insertFromDrop": debugger; break;
        case "insertReplacementText":
        case "insertFromPaste": {

            const cb = e.dataTransfer;
            const items = Array.from(cb.items).filter(i => i.kind == "string" && i.type == "text/plain");

            if (items[0]) {
                return new Promise(r => {
                    items[0].getAsString(data => {
                        insertText(edit_host, data);
                        r(void 1);
                    });
                });
            }
        }; break;
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
        case "deleteContentBackward": {

            const { start_offset, end_offset } = getOffsetsFromSelection();
            const command = <TextCommandTask[TextCommand.DELETE_TEXT]>{
                command: TextCommand.DELETE_TEXT,
                data: {
                    complexity: DeletionComplexity.UNDEFINED,
                    offset: start_offset,
                    length: end_offset - start_offset,
                }
            };

            if (start_offset == end_offset) {
                if (start_offset == 0) break;
                command.data.offset = start_offset - 1;
                command.data.length = 1;
            }
            getProcessor("edit", TextCommand.DELETE_TEXT)(command, edit_host);
        } break;
        case "deleteContentForward": {

            const { start_offset, end_offset } = getOffsetsFromSelection();
            const command = <TextCommandTask[TextCommand.DELETE_TEXT]>{
                command: TextCommand.DELETE_TEXT,
                data: {
                    complexity: DeletionComplexity.UNDEFINED,
                    offset: start_offset,
                    length: end_offset - start_offset,
                }
            };

            if (start_offset == end_offset) {
                if (start_offset == 0) break;
                command.data.offset = start_offset;
                command.data.length = 1;
            }

            getProcessor("edit", TextCommand.DELETE_TEXT)(command, edit_host);
        }; break;
        case "historyUndo": { undo(edit_host); } break;
        case "historyRedo": { redo(edit_host); } break;
        case "formatBold": {
            const { start_offset, end_offset } = getOffsetsFromSelection();

            if (start_offset == end_offset)
                break;

            const command = <TextCommandTask[TextCommand.TOGGLE_BOLD]>{
                command: TextCommand.TOGGLE_BOLD,
                data: {
                    type: FormatType.UNDEFINED,
                    ranges: [{
                        start_offset,
                        end_offset
                    }]
                }
            };

            getProcessor("edit", TextCommand.TOGGLE_BOLD)(command, edit_host);
        }; break;
        case "formatItalic": {
            const { start_offset, end_offset } = getOffsetsFromSelection();

            if (start_offset == end_offset)
                break;

            const command = <TextCommandTask[TextCommand.TOGGLE_ITALICS]>{
                command: TextCommand.TOGGLE_ITALICS,
                data: {
                    type: FormatType.UNDEFINED,
                    ranges: [{
                        start_offset,
                        end_offset
                    }]
                }
            };

            getProcessor("edit", TextCommand.TOGGLE_ITALICS)(command, edit_host);
        }; break;
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


    if (edit_host.DEBUGGER_ENABLED)
        updateMarkdownDebugger(edit_host);
}

function insertText(edit_host: EditHost, text_data: string) {

    const { start_offset, end_offset } = getOffsetsFromSelection();

    if (start_offset - end_offset !== 0) {
        const command = <TextCommandTask[TextCommand.DELETE_TEXT]>{
            command: TextCommand.DELETE_TEXT,
            data: {
                complexity: DeletionComplexity.UNDEFINED,
                offset: start_offset,
                length: end_offset - start_offset,
            }
        };
        getProcessor("edit", TextCommand.DELETE_TEXT)(command, edit_host);
        updateMetrics(edit_host, true);
    }

    const command = <TextCommandTask[TextCommand.INSERT_TEXT]>{
        command: TextCommand.INSERT_TEXT,
        data: {
            APPLY_MARKDOWN_FORMAT: false,
            input_text: text_data,
            offset: start_offset
        }
    };
    getProcessor("edit", TextCommand.INSERT_TEXT)(command, edit_host);
}