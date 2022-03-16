import { getProcessor } from './task_processors/actions/register_action';
import { resolveStemLine } from './task_processors/actions/resolve_stem_line';
import {
    redo,
    undo,
    updatePointer
} from './task_processors/history/history';
import * as vw from './task_processors/view';
import * as history from './task_processors/history/history';
import { EditHost } from "./types/edit_host";
import { TextCommand } from './types/text_command_types';

export function attachListeners(edit_host: EditHost) {

    if (!edit_host.host_ele)
        return;

    edit_host.event_handlers = {
        selectionchange() {
            vw.getOffsetsFromSelection(edit_host);
            vw.updatePointerData(edit_host);
            vw.handleMetaViews(edit_host);
        },
        pointerup(e: PointerEvent) {
            edit_host.host_ele.releasePointerCapture(e.pointerId);
        },
        pointermove(e: PointerEvent) {
            if (edit_host.host_ele.hasPointerCapture(e.pointerId)) {
                setTimeout(_ => {
                    edit_host.event_handlers.selectionchange();
                }, 1);
            }
        },
        pointerdown(e: PointerEvent) {
            edit_host.host_ele.setPointerCapture(e.pointerId);

            setTimeout(_ => {
                edit_host.event_handlers.selectionchange();
            }, 1);
            //If the selected node is a non-selectable, update it's selection
        },
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
            vw.updatePointerData(edit_host);
            /*  if (e.code == "Space") {
                 insertText(" ", edit_host);
             } */
        },
        keyup(e: KeyboardEvent) {
            // updatePointerData(edit_host);
        },
        keydown(e: KeyboardEvent) {
            const sel = window.getSelection();

            if (
                ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "End", "Home"].includes(e.key)
            )
                return adaptArrowPress(e, edit_host);


            let NO_DEFAULT = false;

            if (e.key == 'Alt') {
                vw.toggleEditable(edit_host);
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

            if (NO_DEFAULT) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        },
        beforeinput(e: InputEvent) {
            if (e.preventDefault)
                e.preventDefault();
            processInputEvent(e, edit_host);
        },
    };

    for (const [name, listener] of Object.entries(edit_host.event_handlers)) {
        if (name == "selectionchange") {
            //document.addEventListener(name, <any>listener);
        } else {
            edit_host.host_ele.addEventListener(name, <any>listener);
        }
    }
}

export function removeListeners(edit_host: EditHost) {
    if (edit_host.event_handlers)

        for (const [name, listener] of Object.entries(edit_host.event_handlers))
            if (name == "selectionchange")
                document.addEventListener(name, <any>listener);
            else
                edit_host.host_ele.removeEventListener(name, <any>listener);
}

function adaptArrowPress(e: KeyboardEvent, edit_host: EditHost) {
    setTimeout(_ => {
        edit_host.event_handlers.selectionchange();
        if (resolveStemLine(edit_host)) {
            if (edit_host.debug_data.DEBUGGER_ENABLED)
                vw.updatePointerData(edit_host);
            vw.updateHost(edit_host);
        }
    }, 1);
    return;
    let { start_offset, end_offset } = edit_host;

    switch (e.key) {
        case "ArrowUp":
            break;
        case "ArrowDown":
            break;
        case "ArrowLeft":
            if (e.shiftKey) {
                start_offset -= 1;
            } else if (start_offset != end_offset) {
                end_offset = start_offset;
            } else {
                start_offset -= 1;
                end_offset = start_offset;
            }
            break;
        case "ArrowRight":
            if (e.shiftKey) {
                end_offset += 1;
            } else if (start_offset != end_offset) {
                start_offset = end_offset;
            } else {
                end_offset += 1;
                start_offset = end_offset;
            }
            break;
    }

    //Keep end > start

    edit_host.start_offset = Math.min(end_offset, start_offset);
    edit_host.end_offset = Math.max(end_offset, start_offset);

    //Update selection

    e.preventDefault();

    e.stopImmediatePropagation();

    e.stopPropagation();

    vw.updatePointerData(edit_host);

    vw.updateCaretData(edit_host);

    return false;
}


/**
 * Decouples the event handling from the event process, preventing
 * event timing violations.
 * @param e 
 * @param edit_host 
 */
async function processInputEvent(e: InputEvent, edit_host: EditHost) {
    updatePointer(edit_host);
    switch (e.inputType) {

        case "insertText": {
            insertText(edit_host, e.data);
            await resolveStemLine(edit_host);
            if (e.data == " ")
                await history.sync(edit_host);
            break;
        }
        case "insertLineBreak":
        case "insertParagraph": {
            await history.sync(edit_host);
            getProcessor("edit", TextCommand.INSERT_LINE)(edit_host);
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
            await history.sync(edit_host);
            if (edit_host.start_offset == edit_host.end_offset) {
                edit_host.end_offset = edit_host.start_offset;
                edit_host.start_offset--;
            }
            getProcessor("edit", TextCommand.DELETE_TEXT)(edit_host);
        } break;
        case "deleteContentForward": {
            await history.sync(edit_host);
            if (edit_host.start_offset == edit_host.end_offset)
                edit_host.end_offset = edit_host.start_offset + 1;

            getProcessor("edit", TextCommand.DELETE_TEXT)(edit_host);
        }; break;
        case "historyUndo": {
            await history.sync(edit_host);
            undo(edit_host);
        } break;
        case "historyRedo": {
            await history.sync(edit_host);
            redo(edit_host);
        } break;
        case "formatBold": {
            await history.sync(edit_host);
            getProcessor("edit", TextCommand.TOGGLE_BOLD)(edit_host);
            await history.sync(edit_host);
        }; break;
        case "formatItalic": {
            await history.sync(edit_host);
            getProcessor("edit", TextCommand.TOGGLE_ITALICS)(edit_host);
            await history.sync(edit_host);
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

    if (edit_host.debug_data.DEBUGGER_ENABLED)
        await vw.updatePointerData(edit_host);

    vw.updateHost(edit_host);
}

function insertText(edit_host: EditHost, text_data: string) {

    const { start_offset, end_offset } = edit_host;

    if (start_offset - end_offset !== 0)
        getProcessor("edit", TextCommand.DELETE_TEXT)(edit_host);

    getProcessor("edit", TextCommand.INSERT_TEXT)(edit_host, text_data);
}