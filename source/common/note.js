import reducer from "../compiler/reduce_tree";
import whind from "@candlefw/whind";
import UID from "./uid";

export default function Note(graze, uid, id, tags, body, refs, created, modified) {

    let note = {
        uid,
        id,
        tags,
        body,
        refs,
        created,
        modified
    }

    const store = async () => (await graze.store(note)) > 0;

    return {
        get created() { return note.created },
        get modified() { return note.modified },
        get __graze_retrieve_note__() { return note },
        get uid() { return uid },
        get id() { return note.id },
        get body() { return note.body },
        set body(str) { note.body = str },
        get tags() { return note.tags },
        //set tags(str) { note.tags = str },
        get meta() { return note.tags },
        //set meta(str) { note.tags = str },
        // saves the note's data to the backing server. returns true if the save was successfull, or returns false.
        save: store,
        store,
        // render the note's message data into a string output
        render: async function(handler, set = new Set) {

            if (!set.has(this.uid.string))
                set.add(this.uid.string)

            var strings = [];

            for (const value of reducer(whind(note.body))) {
                if (typeof value == "string")
                    strings.push(value);
                else {
                    for (const note of await graze.retrieve(value.value)) {
                        
                        if (set.has(note.uid.string))
                            continue;

                        if (note)
                            strings.push(await note.render(handler, new Set(set)));
                    }
                }
            }

            return strings.join("");
        }
    }
}
