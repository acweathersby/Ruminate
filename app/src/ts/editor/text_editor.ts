import { TodoError } from './errors/todo_error.js';
import { attachListeners } from './events';
import { convertMDASTToEditLines, parseMarkdownText } from './parser/parse_markdown.js';
import { SectionRoot } from "./section/base/root";
import { EditHost } from './types/edit_host.js';

import "./task_processors/delete_text.js";
import "./task_processors/insert_paragraph.js";
/**
 * Import processors. These will register
 * with processor store and made available
 * through the `getProcessor` function.
 */
import "./task_processors/insert_text.js";
import "./task_processors/toggle_bold.js";
import "./task_processors/toggle_italics.js";
import { toggleEditable, updateMarkdownDebugger } from './task_processors/common.js';

export * from "./task_processors/history.js";
export * from "./task_processors/register_task.js";

function updateHost(edit_host: EditHost) {
    edit_host.host_ele.innerHTML = "";
    edit_host.root.toElement(edit_host.host_ele);
}

export async function constructEditHost(
    note_id: number,
    host_ele: HTMLDivElement,
    input_string = "Welcome To Ruminate"
): Promise<EditHost> {

    if (!host_ele || !(host_ele instanceof HTMLDivElement))
        throw new Error("Expected a DIV element for the edit area host.");

    let string = "";

    if (note_id == -1) {
        string = input_string;
    } else {
        throw new TodoError("Pull note text data from store");
    }

    const edit_host: EditHost = {
        DEBUGGER_ENABLED: true,
        DIRTY_METRICS: true,
        command_history: [],
        root: null,
        host_ele,
        history_pointer: 0,
        options: {},
    };

    // -- enabling content editable on host node
    toggleEditable(edit_host);

    const result = parseMarkdownText(string);

    //Convert Markdown to Editable Content
    const lines = convertMDASTToEditLines(result);

    edit_host.root = new SectionRoot(lines);

    attachListeners(edit_host);

    updateHost(edit_host);

    return edit_host;
}

export function addMarkdownPreviewTarget(edit_host: EditHost, target: HTMLDivElement) {

    if (edit_host) {

        edit_host.markdown_debugger_element = target;

        updateMarkdownDebugger(edit_host);
    }
}

export function renderMarkdown(edit_host: EditHost) {
    return edit_host.root.toString();
}