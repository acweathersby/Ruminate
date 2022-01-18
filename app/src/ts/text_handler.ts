import { complete } from "@hctoolkit/runtime";
import { FunctionMaps, Markdown } from "./ast.js";
import { attachListeners } from './listeners';
import { Bytecode, Entrypoint, ReduceNames } from "./parser_data.js";
import { convertMDASTToEditLines } from './sections.js';
import { EditHost } from './types/edit_host';

function updateHost(edit_host: EditHost) {
    edit_host.host_ele.innerHTML = "";

    for (const section of edit_host.sections)
        section.toElement(edit_host.host_ele);

}

export async function construct_edit_tree(note_id: number, host_ele: HTMLDivElement) {

    if (!host_ele || !(host_ele instanceof HTMLDivElement))
        throw new Error("Expected a DIV element for the edit area host.");

    const edit_host: EditHost = {
        command_history: [],
        sections: [],
        host_ele,
        history_pointer: 0,
        options: {},
    };

    const string = `Welcome to *Ruminate* dagobah Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi`;//await rm.get_text(note_id);

    edit_host.string = string;

    const { result, err } = complete<Markdown>(string, Entrypoint.markdown, Bytecode, FunctionMaps, ReduceNames);

    if (err)
        throw err;

    console.log(result);

    // -- enabling content editable on host node
    host_ele.setAttribute("contenteditable", "true");

    // TODO: Remove temporary innerHTML assignment
    host_ele.innerHTML = string;

    //Convert Markdown to Editable Content
    convertMDASTToEditLines(result, edit_host);

    attachListeners(edit_host);

    updateHost(edit_host);
}