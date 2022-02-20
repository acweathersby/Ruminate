import { MDNode, NodeType } from '../section/base/md_node';
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

    start_offset: number;
    end_offset: number;

    READ_ONLY: boolean;

    DIRTY_METRICS: boolean;

    root: MDNode<NodeType.ROOT>;

    host_ele: HTMLDivElement;

    options?: {};

    command_history: (HistoryTask[TextCommand])[];

    history_pointer: number;

    event_handlers?: {
        selectionchange(): void,
        cut(arg: ClipboardEvent): void;
        copy(arg: ClipboardEvent): void;
        paste(arg: ClipboardEvent): void;
        keypress(arg: KeyboardEvent): void;
        keydown(arg: KeyboardEvent): void;
        keyup(arg: KeyboardEvent): void;
        beforeinput(arg: InputEvent): void;
        pointerup(arg: PointerEvent): void;
        pointerdown(arg: PointerEvent): void;
    };
}

