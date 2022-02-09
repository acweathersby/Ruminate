import { TodoError } from './errors/todo_error.js';
import { attachListeners } from './listeners';
import { convertMDASTToEditLines, EditLine, SectionRoot } from './sections.js';
import { EditHost } from './types/edit_host';

export * from "./task_processors/register_task.js";
export * from "./task_processors/history.js";

/**
 * Import processors. These will register
 * with processor store and made available
 * through the `getProcessor` function.
 */
import "./task_processors/insert_text.js";
import "./task_processors/delete_text.js";
import "./task_processors/insert_paragraph.js";
import { parseMarkdownText } from './parse_markdown';

function updateHost(edit_host: EditHost) {
    edit_host.host_ele.innerHTML = "";

    edit_host.root.toElement(edit_host.host_ele);
}

export async function construct_edit_tree(note_id: number, host_ele: HTMLDivElement, input_string = "Welcome To Ruminate"): Promise<EditHost> {

    if (!host_ele || !(host_ele instanceof HTMLDivElement))
        throw new Error("Expected a DIV element for the edit area host.");

    let string = "";

    if (note_id == -1) {
        string = input_string;
    } else {
        throw new TodoError("Pull note text data from store");
    }

    const edit_host: EditHost = {
        DIRTY_METRICS: true,
        command_history: [],
        root: null,
        host_ele,
        history_pointer: 0,
        options: {},
    };

    // -- enabling content editable on host node
    host_ele.setAttribute("contenteditable", "true");

    // TODO: Remove temporary innerHTML assignment
    //host_ele.innerHTML = string;
    const result = parseMarkdownText(string);

    //Convert Markdown to Editable Content
    const lines = convertMDASTToEditLines(result);

    edit_host.root = new SectionRoot(lines);

    attachListeners(edit_host);

    updateHost(edit_host);

    return edit_host;
}

export function addMarkdownPreviewTarget(edit_host: EditHost, target: HTMLDivElement) {
    if (edit_host)
        edit_host.markdown_element = target;
}

export function renderMarkdown(edit_host: EditHost) {
    return edit_host.root.toString();
}