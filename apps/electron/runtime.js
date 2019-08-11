const server = new graze_objects.server.json;
const codemirror = require("codemirror");

server.connect("./notes.json");

const graze = new graze_objects.graze({sync_rate:2000, server});

const EPOCH_Date = wick.scheme.date;
const EPOCH_Time = wick.scheme.time;
const Longitude = wick.scheme.number;
const Latitude = wick.scheme.number;
const $Number = wick.scheme.number;
const $String = wick.scheme.string;
const $Boolean = wick.scheme.bool;


function CodeMirrorBootStrapper(element) {
    codemirror(element);
}



function renderer(scope, parentElement) {

    parentElement.innerHTML = "";

    var NEW_RUNNING = true,
        children = null,
        index = 0,
        length = 0;

    setInterval(function() {
        scope.note.body = HTMLtoMarkdown(parentElement);
    }, 2000)

    /** 
        This function is called by note.render and 
        recives either strings or array of notes
        as the body of the note is parsed by graze 
    **/
    return async function(type, obj, query) {

        if (NEW_RUNNING)
            children = parentElement.children, index = 0, length = children.length;
        switch (type) {
            case "string":
                index = ParseMarkdown(whind.default(obj)).merge(parentElement, length, children, index);
                break;
            case "notes":
                const type = query.meta;
                
                const scope = await wick("./components/list.html", presets)
                    .pending
                    .then(comp => comp.mount(parentElement, {notes:obj}));

                scope.ele.setAttribute("query", query.value);
                scope.ele.setAttribute("meta", query.meta || "");
                
                break;
            case "complete":
                //Remove any extra children
                NEW_RUNNING = true;
                return;
        }
    }
}


const presets = wick.presets({
    custom: { graze, cm: CodeMirrorBootStrapper, renderer },
    schemas: {}
})
//*

//graze.createNote("groceries.", "", "This is a reminder to get milk!").store();
//graze.createNote("groceries.", "", "This is a reminder to get butter!").store();
//graze.createNote("groceries.", "", "This is a reminder to get cream!").store();
//graze.createNote("signatures. main", "", "Anthony C Weathersby").store();
//graze.createNote("places to visit.", "", "I'd like to go to rome someday").store();
//*/
const n2 = graze.createNote("/test2", "",
    `# This is the markdown
I never really liked to eat too mutch

((*groceries*))[great]

> But theres always a I chance I could eat more.`);
//n2.store().then(() => {})
window.addEventListener("load", () =>
    wick("./components/main.html", presets)
    .pending
    .then(comp => comp.mount(document.body))
    .then(scope => scope.update("mounted"))
)
