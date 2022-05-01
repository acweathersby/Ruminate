/**
 * Collection of passthrough functions that provide the interlink 
 * between JavaScript and Tauri Rust. 
 */
import { invoke } from '@tauri-apps/api/tauri';
import { locale } from '../locale/locale';
import * as mock from "./mock";
import * as mock_fs from "./mock_fs";

export const init = assert_DB_decorator(
    async function init(): Promise<void> {
        return invoke("init", { data: "" });
    }, mock.init);

export const debug_print_note = assert_DB_decorator(
    async function debug_print_note(noteLocalId: number, comment: string = ""): Promise<number[]> {
        return invoke("debug_print_note", { noteLocalId, comment });
    }, mock.debugPrintNote);

export const get_note_clock = assert_DB_decorator(
    async function get_note_clock(noteLocalId: number): Promise<number> {
        return invoke("get_note_clock", { noteLocalId });
    }, ((nonce: number = 0) => () => nonce++)());

export const get_notes_from_query = assert_DB_decorator(
    async function get_notes_from_query(query: string): Promise<number[]> {
        return invoke("get_notes_from_query", { query });
    }, mock.getNotesFromQuery);

export const create_note = assert_DB_decorator(
    async function create_note(): Promise<number> {
        return invoke("create_note");
    }, () => mock.createMockNote().id);

export const set_note_name = assert_DB_decorator(
    async function set_note_name(noteLocalId: number, name: String) {
        return invoke("set_note_name", { noteLocalId: noteLocalId, name });
    }, mock.setNoteName);

export const get_note_name = assert_DB_decorator(
    async function get_note_name(noteLocalId: number): Promise<string> {
        return invoke("get_note_name", { noteLocalId });
    }, mock.getNoteName);

export const get_binary = assert_DB_decorator(
    async function get_binary(noteLocalId: number): Promise<Uint8Array> {
        return invoke("get_binary", { noteLocalId });
    }, () => new Uint8Array());

export const set_binary = assert_DB_decorator(
    async function set_binary(noteLocalId: number, data: Uint8Array): Promise<boolean> {
        return invoke("set_binary", { noteLocalId, data });
    }, false);
export const insert_text = assert_DB_decorator(
    async function insert_text(noteLocalId: number, insertIndex: number, string: string): Promise<boolean> {
        return invoke("insert_text", { noteLocalId, insertIndex, string });
    }, (id: number, ind: number, txt: string) => mock.insertText(id, ind, txt));

export const delete_text = assert_DB_decorator(
    async function delete_text(noteLocalId: number, insertIndex: number, count: number): Promise<boolean> {
        return invoke("delete_text", { noteLocalId, insertIndex, count });
    }, (id: number, ind: number, c: number) => mock.deleteText(id, ind, c));

export const get_text = assert_DB_decorator(
    async function get_text(noteLocalId: number): Promise<string> {
        return invoke("get_text", { noteLocalId });
    }, (id: number) => mock.getText(id));

export const get_local_id_from_uuid = assert_DB_decorator(
    async function get_local_id_from_uuid(uuidString: string): Promise<number> {
        return invoke("get_local_id_from_uuid", { uuidString });
    });
export const get_note_uuid_string = assert_DB_decorator(
    async function get_note_uuid_string(noteLocalId: number): Promise<string> {
        return invoke("get_note_uuid_string", { noteLocalId });
    });



/*
    Containers ------------------------------------------------------------------------------
*/

export const add_note_to_container_path = assert_DB_decorator(
    async function add_note_to_container_path(noteLocalId: number, containerPath: String): Promise<boolean> {
        return invoke("add_note_to_container_path", { noteLocalId, containerPath });
    }, mock_fs.add_note_to_container_path);

export const remove_note_from_container_path = assert_DB_decorator(
    async function remove_note_from_container_path(noteLocalId: number, containerPath: String) {
        return invoke("remove_note_from_container_path", { noteLocalId, containerPath });
    }, mock_fs.remove_note_from_container_path);

export const query_note_container_paths = assert_DB_decorator(
    async function query_note_container_paths(noteLocalId: string): Promise<number[]> {
        return invoke("query_note_container_paths", { noteLocalId });
    }, mock_fs.query_note_container_paths);

export const query_child_paths_from_parent_container = assert_DB_decorator(
    async function query_child_paths_from_parent_container(containerPath: String): Promise<string[]> {
        return invoke("query_child_paths_from_parent_container", { containerPath });
    }, mock_fs.query_child_paths_from_parent_container);

export const query_note_ids_from_container = assert_DB_decorator(
    async function query_note_ids_from_container(containerPath: string): Promise<number[]> {
        return invoke("query_note_ids_from_container", { containerPath });
    }, mock_fs.query_note_ids_from_container);

/*
    Tags ------------------------------------------------------------------------------------
*/

export const get_tags = assert_DB_decorator(
    async function get_tags(): Promise<[string, number][]> {
        return invoke("get_tags", {});
    });

export const get_notes_from_tag = assert_DB_decorator(
    async function get_notes_from_tag(tagString: string): Promise<number[]> {
        return invoke("get_notes_from_tag", { tagString });
    });

export const add_tag = assert_DB_decorator(
    async function add_tag(noteLocalId: number, tagString: string): Promise<number> {
        return invoke("add_tag", { noteLocalId, tagString });
    });

export const remove_tag = assert_DB_decorator(
    async function remove_tag(noteLocalId: number, tagString: string): Promise<boolean> {
        return invoke("remove_tag", { noteLocalId, tagString });
    });
export const get_tag_string = assert_DB_decorator(
    async function get_tag_string(tagLocalId: number): Promise<string> {
        return invoke("get_tag_string", { tagLocalId });
    });

export const get_tag_ids = assert_DB_decorator(
    async function get_tag_ids(noteLocalId: number): Promise<number[]> {
        return invoke("get_tag_ids", { noteLocalId });
    });

export const merge_text = assert_DB_decorator(
    async function merge_text(noteLocalId: number, string: string): Promise<boolean> {
        return invoke("merge_text", { noteLocalId, string });
    }
);


//____________________________________________________________________________

export const main = assert_DB_decorator(
    async function main() { });

function assert_DB_decorator<T>(fn: T, alternate_value?: any): T {

    if (typeof globalThis["__TAURI__"] == "undefined") {
        //@ts-ignore
        return async function (...data) {
            console.warn(
                //@ts-ignore
                `[${fn.name}] `
                + locale["bridge warning"]
                + `\n arg_data: \n ${JSON.stringify(data)}`,
                "color:orange",
                "color:black",
            );
            if (typeof alternate_value == "function")
                return alternate_value(...data);
            return alternate_value;
        };
    }

    return fn;
}