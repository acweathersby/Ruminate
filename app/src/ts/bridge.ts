import { invoke } from '@tauri-apps/api/tauri';

export async function getNoteContent(uuid: string) {
    const result = await invoke("getNoteContent", {
        uuid
    });
}