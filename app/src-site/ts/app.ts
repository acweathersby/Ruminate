import * as tauri from "./tauri/bridge.js";
import * as folder from "./primitives/folder.js";
import * as note from "./primitives/note.js";

window.addEventListener("load", function () {
    tauri.init();
    //@ts-ignore
    note.init(wick);
    //@ts-ignore
    folder.init(wick);
});

export function init() {
    folder.init(wick, note.init(wick));
    tauri.init();
}