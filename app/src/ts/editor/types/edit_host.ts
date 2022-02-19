import { SectionRoot } from "../section/base/root";
import { HistoryTask, TextCommand } from './text_command_types';


/**
 * General store of editing data for a 
 * single note.
 */
export interface EditHost {

    debug_data: {

        DEBUGGER_ENABLED: boolean;

        cursor_start: number;

        cursor_end: number;

        ele?: HTMLDivElement;
    };

    READ_ONLY: boolean;

    DIRTY_METRICS: boolean;

    root: SectionRoot;

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
        keyup(arg: KeyboardEvent): void;
        beforeinput(arg: InputEvent): void;
        pointerup(arg: PointerEvent): void;
    };
}

