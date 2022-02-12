import { SectionRoot } from "../section/base/root";
import { HistoryTask, TextCommand } from './text_command_types';

/**
 * General store of editing data for a 
 * single note.
 */
export interface EditHost {
    DEBUGGER_ENABLED: boolean,
    DIRTY_METRICS: boolean;

    root: SectionRoot;

    host_ele: HTMLDivElement;

    options?: {};

    markdown_debugger_element?: HTMLDivElement;

    command_history: (HistoryTask[TextCommand])[];

    history_pointer: number;

    event_handlers?: {
        cut(arg: ClipboardEvent): void;
        copy(arg: ClipboardEvent): void;
        paste(arg: ClipboardEvent): void;
        keypress(arg: KeyboardEvent): void;
        keydown(arg: KeyboardEvent): void;
        keyup(arg: KeyboardEvent): void;
        beforeinput(arg: InputEvent): void;
    };
}
