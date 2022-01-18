/**
 * Collection of passthrough functions that provide the interlink 
 * between JavaScript and Tauri Rust. 
 */
import { invoke } from '@tauri-apps/api/tauri';
export async function init(data: string) {
    return invoke("init", { data });
}
export async function create_note(): Promise<number> {
    return invoke("create_note");
}
export async function set_note_name(noteLocalId: number, name: String) {
    return invoke("set_note_name", { noteLocalId: noteLocalId, name });
}
export async function get_note_name(noteLocalId: number): Promise<string> {
    return invoke("get_note_name", { noteLocalId });
}
export async function set_note_container_path(noteLocalId: number, containerPath: String) {
    return invoke("set_note_container_path", { noteLocalId, containerPath });
}
export async function get_note_container_path(noteLocalId: number): Promise<string> {
    return invoke("get_note_container_path", { noteLocalId });
}
export async function get_local_id_from_uuid(uuidString: string): Promise<number> {
    return invoke("get_local_id_from_uuid", { uuidString });
}
export async function get_note_uuid_string(noteLocalId: number): Promise<string> {
    return invoke("get_note_uuid_string", { noteLocalId });
}
export async function get_tags(): Promise<[string, number][]> {
    return invoke("get_tags", {});
}
export async function get_notes_from_tag(tagString: string): Promise<number[]> {
    return invoke("get_notes_from_tag", { tagString });
}
export async function add_tag(noteLocalId: number, tagString: string): Promise<number> {
    return invoke("add_tag", { noteLocalId, tagString });
}
export async function remove_tag(noteLocalId: number, tagString: string): Promise<boolean> {
    return invoke("remove_tag", { noteLocalId, tagString });
}
export async function get_tag_string(tagLocalId: number): Promise<string> {
    return invoke("get_tag_string", { tagLocalId });
}
export async function get_tag_ids(noteLocalId: number): Promise<number[]> {
    return invoke("get_tag_ids", { noteLocalId });
}
export async function insert_text(noteLocalId: number, insertIndex: number, string: string): Promise<boolean> {
    return invoke("insert_text", { noteLocalId, insertIndex, string });
}
export async function delete_text(noteLocalId: number, insertIndex: number, count: number): Promise<boolean> {
    return invoke("delete_text", { noteLocalId, insertIndex, count });
}
export async function get_text(noteLocalId: number): Promise<string> {

    return invoke("get_text", { noteLocalId });
}
export async function main() { }