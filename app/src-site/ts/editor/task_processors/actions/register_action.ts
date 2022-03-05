import { TextCommand } from '../../types/text_command_types';

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

export { TextCommand };
