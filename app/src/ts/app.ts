import * as tauri from "./tauri/bridge.js";

export function init() {

    tauri.init("Test");

    console.log("Hello World : JS");
}