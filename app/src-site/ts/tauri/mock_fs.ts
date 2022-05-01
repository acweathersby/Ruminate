import { createFolder, Folder } from '../primitives/folder';

let root = null;

function getRoot(): Folder {
    if (!root) {
        root = createFolder("/");
    }

    return root;
}

export function add_note_to_container_path(noteLocalId: number, containerPath: string) {

    const root = getRoot();
    let target = root;
    let path = [];

    if (containerPath[0] != "/") {
        containerPath = "/" + containerPath;
    }

    for (const segment of containerPath.split("/").slice(1)) {
        if (!target.sub_folders.has(segment)) {
            target.sub_folders.set(segment, createFolder(segment, path.join("/")));
        }

        target = target.sub_folders.get(segment);
        path.push(segment);
    }

    target.items.push(noteLocalId);

    return true;
}

export function remove_note_from_container_path(noteLocalId: number, containerPath: string) {

    const root = getRoot();
    let target = root;
    let parents: Folder[] = [];

    if (containerPath[0] == "/") {
        containerPath = containerPath.slice(1);
    }

    if (containerPath)
        for (const segment of containerPath.split("/")) {

            parents.push(target);

            if (!target.sub_folders.has(segment))
                return false;

            target = target.sub_folders.get(segment);
        }
    else {
        return false;
    }

    target.items = target.items.filter(i => i != noteLocalId);


    while (
        target.items.length == 0
        && target.sub_folders.size == 0
        && parents.length > 0
    ) {
        const parent = parents.pop();

        parent.sub_folders.delete(target.name);

        target = parent;
    }

    return true;
}

export function query_note_container_paths(noteLocalId: number): string[] {

    let candidate_paths = [getRoot()];

    let out_paths = [];

    for (const dir of candidate_paths) {

        if (dir.items.includes(noteLocalId)) {
            out_paths.push([dir.path, "/", dir.name].join(""));
        }

        candidate_paths.push(...dir.sub_folders.values());
    }

    return out_paths.map(p => p[0] == "/" ? p.slice(1) : p);
}

export function query_child_paths_from_parent_container(containerPath: string) {

    const root = getRoot();
    let target = root;

    if (containerPath[0] == "/")
        containerPath = containerPath.slice(1);

    if (containerPath[containerPath.length - 1] == "/")
        containerPath = containerPath.slice(0, -1);

    if (containerPath)
        for (const segment of containerPath.split("/")) {

            if (segment == "") continue;

            if (!target.sub_folders.has(segment))
                return ["invalid"];

            target = target.sub_folders.get(segment);
        }

    if (target.sub_folders.size == 0)
        return ["empty"];


    let append_path = containerPath ? containerPath + "/" : "";

    return [...target.sub_folders.keys()].map(k => append_path + k);
}

export function query_note_ids_from_container(containerPath: string) {
    const root = getRoot();
    let target = root;

    if (containerPath[0] == "/")
        containerPath = containerPath.slice(1);

    for (const segment of containerPath.split("/")) {

        if (segment == "") continue;

        if (!target.sub_folders.has(segment))
            return [];

        target = target.sub_folders.get(segment);
    }

    return target.items;
}