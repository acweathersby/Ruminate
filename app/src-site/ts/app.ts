import * as tauri from "./tauri/bridge.js";
import * as store from "./store.js";

window.addEventListener("load", function () {
    tauri.init();
    //@ts-ignore
    store.init(wick);
});

export function init() { }