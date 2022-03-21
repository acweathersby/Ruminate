import { get_text } from '../tauri/bridge.js';
import { attachListeners, removeListeners } from './events';
import {
    convertMDASTToEditLines,
    parseMarkdownText
} from './parser/parse_markdown.js';
import { MDNode, NodeType } from './task_processors/md_node.js';
import { heal, setChildren } from './task_processors/operators.js';
import { initLength, traverse } from './task_processors/traverse/traverse.js';
import {
    setEditable, updateHost, updateMarkdownDebugger
} from './task_processors/view.js';
import { EditHost } from './types/edit_host.js';



/**
 * Import processors. These will register
 * with processor store and made available
 * through the `getProcessor` function.
 */
import "./task_processors/actions/delete_text.js";
import "./task_processors/actions/insert_line.js";
import "./task_processors/actions/insert_text.js";
import "./task_processors/actions/toggle_bold.js";
import "./task_processors/actions/toggle_italics.js";
import "./task_processors/actions/set_header_size.js";
export * from "./task_processors/actions/register_action.js";
export * from "./task_processors/history/history.js";
export * from "./task_processors/view.js";



export async function constructReadOnlyHost(
    note_id: number,
    active: Set<number> = new Set
): Promise<EditHost> {


    const
        edit_host: EditHost =

            createEditHostObj(note_id, true, active),

        string = await get_text(note_id),

        result = parseMarkdownText(string),

        lines = convertMDASTToEditLines(result, edit_host);

    edit_host.root = new MDNode(NodeType.ROOT);

    edit_host.root = setChildren(edit_host.root, 0, ...lines);

    initLength(edit_host.root);

    return edit_host;
}


export async function constructTestHost(
    md_text: string
): Promise<EditHost> {

    const
        edit_host: EditHost = createEditHostObj(1, false),

        result = parseMarkdownText(md_text),

        lines = convertMDASTToEditLines(result, edit_host, 0);

    edit_host.root = new MDNode(NodeType.ROOT);

    edit_host.root = setChildren(edit_host.root, 0, ...lines);

    edit_host.root = heal(edit_host.root, 0).node;

    initLength(edit_host.root);

    edit_host.history.push({
        state: edit_host.root,
        end_offset: edit_host.end_offset,
        start_offset: edit_host.start_offset,
        diffs: [],
        clock: 0
    });

    edit_host.history_pointer = 0;

    return edit_host;
}
export async function constructEditHost(
    note_id: number
): Promise<EditHost> {

    const
        edit_host: EditHost = createEditHostObj(note_id, false),

        string = await get_text(note_id),

        result = parseMarkdownText(string),

        lines = convertMDASTToEditLines(result, edit_host, 0);

    edit_host.root = new MDNode(NodeType.ROOT);

    edit_host.root = setChildren(edit_host.root, 0, ...lines);

    edit_host.root = heal(edit_host.root, 0).node;

    initLength(edit_host.root);

    edit_host.history.push({
        state: edit_host.root,
        end_offset: edit_host.end_offset,
        start_offset: edit_host.start_offset,
        diffs: [],
        clock: 0
    });

    edit_host.history_pointer = 0;

    return edit_host;
}

/**
 * Null all object references in an @type {EditHost} object in preparation
 * for garbage collection.
 */
export async function releaseEditHost(
    edit_host: EditHost
) {
    if (edit_host) {

        edit_host.history = null;

        edit_host.active = null;

        edit_host.debug_data = null;

        if (edit_host.host_ele && edit_host.host_ele.parentElement)
            edit_host.host_ele.parentElement.removeChild(edit_host.host_ele);

        for (const node of traverse(edit_host.root).map(v => v)) {
            node.meta = null;
            node.ele = null;
        }

        edit_host.root = null;
    }
}
function createEditHostObj(
    note_id: number,
    READ_ONLY = false,
    active: Set<number> = null
): EditHost {
    return {
        debug_data: {
            cursor_start: 0,
            cursor_end: 0,
            ele: null,
            DEBUGGER_ENABLED: !READ_ONLY,
        },
        active: active,
        note_id: note_id,
        DIRTY_METRICS: true,
        READ_ONLY: READ_ONLY,
        history: [],
        root: null,
        host_ele: null,
        history_pointer: -1,
        options: {},
        end_offset: 0,
        start_offset: 0,
        meta_UIs: [],
        NEW_LINE_MODE: false,
        new_line_data: {
            md_offset_start: -1,
            offset_start: -1,
            text_data: ""
        }
    };
}
export function addMarkdownPreviewTarget(
    edit_host: EditHost, target: HTMLDivElement
) {

    if (edit_host) {

        edit_host.debug_data.ele = target;

        updateMarkdownDebugger(edit_host);
    }
}

export function setHostElement(
    edit_host: EditHost, element: HTMLDivElement
) {

    removeListeners(edit_host);

    if (element) {
        edit_host.host_ele = element;
        setReadOnly(edit_host, edit_host.READ_ONLY);
        updateHost(edit_host);
    } else {
        edit_host.host_ele = null;
    }
}


export function setReadOnly(
    edit_host: EditHost, READ_ONLY: boolean = true
) {

    if (READ_ONLY) {
        setEditable(edit_host, false);
        removeListeners(edit_host);
    } else {
        setEditable(edit_host, true);
        attachListeners(edit_host);
    }
}