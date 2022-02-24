import { get_text } from '../tauri/bridge.js';
import { attachListeners, removeListeners } from './events';
import { convertMDASTToEditLines as convertMDASTToMDNodeLines, parseMarkdownText } from './parser/parse_markdown.js';
import { MDNode, NodeType } from './task_processors/md_node.js';
//import "./task_processors/delete_text.js";
//import "./task_processors/insert_paragraph.js";
/**
 * Import processors. These will register
 * with processor store and made available
 * through the `getProcessor` function.
 */
import "./task_processors/actions/insert_text.js";
import "./task_processors/actions/delete_text.js";
import "./task_processors/actions/toggle_bold.js";
import "./task_processors/actions/toggle_italics.js";
import { setChildren } from './task_processors/operators.js';
import { setEditable, toHTML, updateHost, updateMarkdownDebugger } from './task_processors/view.js';
import { EditHost } from './types/edit_host.js';
import { pushHistory } from './task_processors/history';
import { initLength } from './task_processors/traverse/traverse.js';


export * from "./task_processors/history.js";
export * from "./task_processors/actions/register_action.js";

export async function constructEditHost(
    note_id: number,
    input_string = "Welcome To Ruminate"
): Promise<EditHost> {

    let string = "";

    if (note_id == -1) {
        string = input_string;
    } else {
        string = await get_text(note_id);
    }

    const edit_host: EditHost = {
        debug_data: {
            cursor_start: 0,
            cursor_end: 0,
            ele: null,
            DEBUGGER_ENABLED: true,
        },
        DIRTY_METRICS: true,
        READ_ONLY: false,
        command_history: [],
        root: null,
        host_ele: null,
        history_pointer: -1,
        options: {},
        end_offset: 0,
        start_offset: 0
    };


    const result = parseMarkdownText(string);

    edit_host.root = new MDNode(NodeType.ROOT);

    //Convert Markdown to Editable Content
    const lines = convertMDASTToMDNodeLines(result, edit_host);

    edit_host.root = setChildren(edit_host.root, ...lines);

    initLength(edit_host.root);

    pushHistory(edit_host);

    return edit_host;
}

export function addMarkdownPreviewTarget(edit_host: EditHost, target: HTMLDivElement) {

    if (edit_host) {

        edit_host.debug_data.ele = target;

        updateMarkdownDebugger(edit_host);
    }
}

export function setHostElement(edit_host: EditHost, element: HTMLDivElement) {

    removeListeners(edit_host);

    if (element) {
        edit_host.host_ele = element;
        setReadOnly(edit_host, edit_host.READ_ONLY);
        updateHost(edit_host);
    } else {
        edit_host.host_ele = null;
    }
}


export function setReadOnly(edit_host: EditHost, READ_ONLY: boolean = true) {

    if (READ_ONLY) {
        setEditable(edit_host, false);
        removeListeners(edit_host);
    } else {
        setEditable(edit_host, true);
        attachListeners(edit_host);
    }
}