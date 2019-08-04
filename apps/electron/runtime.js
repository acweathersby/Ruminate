const graze = new graze_objects.graze;
const server = new graze_objects.server.json;

server.connect("./notes.json");
graze.connect(server)

const EPOCH_Date = wick.scheme.date;
const EPOCH_Time = wick.scheme.time;
const Longitude = wick.scheme.number;
const Latitude = wick.scheme.number;
const $Number = wick.scheme.number;
const $String = wick.scheme.string;
const $Boolean = wick.scheme.bool;

const presets = wick.presets({
    custom: { graze },
    schemas: {}
})

window.addEventListener("load", () => {
    wick("./components/main.html", presets)
        .pending
        .then(comp => comp.mount(document.body))
        .then(scope => scope.update("mounted"));
})
