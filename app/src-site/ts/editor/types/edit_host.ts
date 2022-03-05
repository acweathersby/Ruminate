import { MDNode, NodeType } from '../task_processors/md_node';
import { HistoryTask } from './text_command_types';
import { WickRTComponent } from "@candlelib/wick";


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

    note_id: number;

    start_offset: number;
    end_offset: number;

    READ_ONLY: boolean;

    DIRTY_METRICS: boolean;

    root: MDNode<NodeType.ROOT>;

    host_ele: HTMLDivElement;

    options?: {};

    command_history: HistoryTask[];

    history_pointer: number;

    /**
     * Id's of notes already loaded in ancestors. 
     * Prevents recursive loading of notes.
     */
    active: Set<number>;

    meta_UIs: WickRTComponent[];

    event_handlers?: {
        selectionchange(): void,
        cut(arg: ClipboardEvent): void;
        copy(arg: ClipboardEvent): void;
        paste(arg: ClipboardEvent): void;
        keypress(arg: KeyboardEvent): void;
        keydown(arg: KeyboardEvent): void;
        keyup(arg: KeyboardEvent): void;
        beforeinput(arg: InputEvent): void;
        pointermove(arg: PointerEvent): void;
        pointerup(arg: PointerEvent): void;
        pointerdown(arg: PointerEvent): void;
    };
}

