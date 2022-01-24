import { complete } from "@hctoolkit/runtime";
import { FunctionMaps, Markdown } from "./ast.js";
import { TodoError } from './errors/todo_error.js';
import { attachListeners } from './listeners';
import { Bytecode, Entrypoint, ReduceNames } from "./parser_data.js";
import { convertMDASTToEditLines } from './sections.js';
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

function updateHost(edit_host: EditHost) {
    edit_host.host_ele.innerHTML = "";

    for (const section of edit_host.sections)
        section.toElement(edit_host.host_ele);

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
        command_history: [],
        sections: [],
        host_ele,
        history_pointer: 0,
        options: {},
    };

    const { result, err } = complete<Markdown>(string, Entrypoint.markdown, Bytecode, FunctionMaps, ReduceNames);

    if (err)
        throw err;

    // -- enabling content editable on host node
    host_ele.setAttribute("contenteditable", "true");

    // TODO: Remove temporary innerHTML assignment
    //host_ele.innerHTML = string;

    //Convert Markdown to Editable Content
    convertMDASTToEditLines(result, edit_host);

    attachListeners(edit_host);

    updateHost(edit_host);

    return edit_host;
}

export function renderMarkdown(edit_host: EditHost) {
    return edit_host.sections.map(s => s.toString()).join("\n");
}