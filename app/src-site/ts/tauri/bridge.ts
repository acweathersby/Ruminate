/**
 * Collection of passthrough functions that provide the interlink 
 * between JavaScript and Tauri Rust. 
 */
import { invoke } from '@tauri-apps/api/tauri';
import { locale } from '../locale/locale';
import * as mock from "./mock";

export const init = assert_DB_decorator(
    async function init(): Promise<void> {
        return invoke("init", { data: "" });
    });

export const debug_print_note = assert_DB_decorator(
    async function debug_print_note(noteLocalId: number, comment: string = ""): Promise<number[]> {
        return invoke("debug_print_note", { noteLocalId, comment });
    }, (id: number, cmt: string) => mock.debugPrintNote(id, cmt));

export const get_note_clock = assert_DB_decorator(
    async function get_note_clock(noteLocalId: number): Promise<number> {
        return invoke("get_note_clock", { noteLocalId });
    }, ((nonce: number = 0) => () => nonce++)());

export const get_notes_from_query = assert_DB_decorator(
    async function get_notes_from_query(query: string): Promise<number[]> {
        return invoke("get_notes_from_query", { query });
    }, [1]);
export const create_note = assert_DB_decorator(
    async function create_note(): Promise<number> {
        return invoke("create_note");
    }, 1);
export const set_note_name = assert_DB_decorator(
    async function set_note_name(noteLocalId: number, name: String) {
        return invoke("set_note_name", { noteLocalId: noteLocalId, name });
    });
export const get_note_name = assert_DB_decorator(
    async function get_note_name(noteLocalId: number): Promise<string> {
        return invoke("get_note_name", { noteLocalId });
    }, "Dummy Note");
export const set_note_container_path = assert_DB_decorator(
    async function set_note_container_path(noteLocalId: number, containerPath: String) {
        return invoke("set_note_container_path", { noteLocalId, containerPath });
    });
export const get_note_container_path = assert_DB_decorator(
    async function get_note_container_path(noteLocalId: number): Promise<string> {
        return invoke("get_note_container_path", { noteLocalId });
    }, "/temp/notes");
export const get_local_id_from_uuid = assert_DB_decorator(
    async function get_local_id_from_uuid(uuidString: string): Promise<number> {
        return invoke("get_local_id_from_uuid", { uuidString });
    });
export const get_note_uuid_string = assert_DB_decorator(
    async function get_note_uuid_string(noteLocalId: number): Promise<string> {
        return invoke("get_note_uuid_string", { noteLocalId });
    });
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