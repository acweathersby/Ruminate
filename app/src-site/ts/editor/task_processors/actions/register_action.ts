import { EditHost } from '../../types/edit_host';
import { TextCommand } from '../../types/text_command_types';
import { initLength } from '../traverse/traverse';
import * as vw from "../view";

type TaskProcessor = (..._: any) => any;

const task_registry: Map<string, Map<TextCommand, TaskProcessor>> = new Map;

export function registerAction(type: string, key: TextCommand, processor: TaskProcessor) {
    if (!task_registry.has(type))
        task_registry.set(type, new Map);

    const processor_registry = task_registry.get(type);

    if (processor_registry) {
        processor_registry.set(key, processor);
    }
}

export function getProcessor(type: string, key: TextCommand): TaskProcessor {
    return task_registry.get(type)?.get(key) ?? null;
}

/**
 * Runs a given command, passing arguments on to the 
 * command function 
 */
export function runCommand(
    command: TextCommand,
    edit_host: EditHost,
    ...args: any[]
) {
    getProcessor("edit", command,)(edit_host, ...args);

    initLength(edit_host.root);

    if (edit_host.debug_data.DEBUGGER_ENABLED)
        vw.updatePointerData(edit_host);

    vw.updateHost(edit_host);

    vw.handleMetaViews(edit_host);
}

export { TextCommand };
