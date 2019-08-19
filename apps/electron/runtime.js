const server = new ruminate_objects.server.json;
const codemirror = require("codemirror");

server.connect("./notes.json");

const ruminate = new ruminate_objects.ruminate({ sync_rate: 2000, server });

const EPOCH_Date = wick.scheme.date;
const EPOCH_Time = wick.scheme.time;
const Longitude = wick.scheme.number;
const Latitude = wick.scheme.number;
const $Number = wick.scheme.number;
const $String = wick.scheme.string;
const $Boolean = wick.scheme.bool;
const markdom = ruminate_objects.client.markdom;

function CodeMirrorBootStrapper(element) {
    codemirror(element);
}

function renderer(scope, note) {

    var parentElement,
        NEW_RUNNING = true,
        children = null,
        index = 0,
        length = 0;

    setInterval(function() {
        if (parentElement) {
            const d = markdom.MDify(parentElement);
            note.body = d;
        }
    }, 2000)

    /** 
        This function is called by note.render and 
        recives either strings or array of notes
        as the body of the note is parsed by ruminate 
    **/
    async function render(type, obj, query) {

        if (NEW_RUNNING)
            children = parentElement.children, index = 0, length = children.length;
        switch (type) {
            case "string":
                const vDOM = markdom.DOMify(obj);
                console.log(vDOM)
                markdom.merge(parentElement, vDOM, (notequery, meta) => {
                    const note = document.createElement("notes");
                    ruminate.retrieve(notequery).then(async (notes) => {
                        if (notes.length > 0) {
                            const scope = await wick("./components/list.html", presets)
                                .pending
                                .then(comp => comp.mount(note, { notes }));
                        }
                    })
                    note.setAttribute("query", notequery);
                    note.setAttribute("meta", meta || "");
                    return note;
                })
                break;
            case "notes":
                const type = query.meta;

                const scope = await wick("./components/list.html", presets)
                    .pending
                    .then(comp => comp.mount(parentElement, { notes: obj }));

                scope.ele.setAttribute("query", query.value);
                scope.ele.setAttribute("meta", query.meta || "");

                break;
            case "complete":
                //Remove any extra children
                NEW_RUNNING = true;
                return;
        }
    }

    return {
        async update(p) {
            parentElement = p;
            note.render(render);
        }
    }
}


const presets = wick.presets({
    custom: { ruminate, cm: CodeMirrorBootStrapper, renderer },
    schemas: {}
})
//*

//ruminate.createNote("groceries/milk", "", "This is a reminder to get milk!");
//ruminate.createNote("groceries/butter", "", "This is a reminder to get butter!");
//ruminate.createNote("groceries/cream", "", "This is a reminder to get cream!");
//ruminate.createNote("signatures. main", "", "Anthony C Weathersby");
//ruminate.createNote("places to visit.", "", "I'd like to go to rome someday");
/*/
const n2 = ruminate.createNote("/test2", "",
    `# This is the markdown

I never really liked to **eat** too mutch
((groceries/*?milk))
> But theres always a I chance I could eat more.

`);
/*/
//n2.store().then(() => {})
window.addEventListener("load", () =>
    wick("./components/main.html", presets)
    .pending
    .then(comp => comp.mount(document.body))
    .then(scope => scope.update("mounted"))
)
