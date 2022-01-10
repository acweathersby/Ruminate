import { invoke } from '@tauri-apps/api/tauri';

export function init() {

    invoke("init", { data: "Test" });

    console.log("Hello World : JS");
}