import { EditLine } from "../sections";
import { HistoryTask, TextCommand } from './text_command_types';

/**
 * General store of editing data for a 
 * single note.
 */
export interface EditHost {
    sections: EditLine[];

    host_ele: HTMLDivElement;

    options?: {};

    command_history: (HistoryTask[TextCommand])[];

    history_pointer: number;

    event_handlers?: {
        cut(arg: ClipboardEvent): void;
        copy(arg: ClipboardEvent): void;
        paste(arg: ClipboardEvent): void;
        keypress(arg: KeyboardEvent): void;
        keydown(arg: KeyboardEvent): void;
        beforeinput(arg: InputEvent): void;
    };
}
