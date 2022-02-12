import { SectionRoot } from "../section/sections";
import { HistoryTask, TextCommand } from './text_command_types';

/**
 * General store of editing data for a 
 * single note.
 */
export interface EditHost {

    DIRTY_METRICS: boolean;

    root: SectionRoot;

    host_ele: HTMLDivElement;

    options?: {};

    markdown_element?: HTMLDivElement;

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
