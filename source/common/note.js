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
        get uid() { return uid},
        get id() { return note.id },
        get body() { return note.body },
        set body(str) {note.body = str},
        // saves the note's data to the backing server. returns true if the save was successfull, or returns false.
        save: store,
        store,
        // render the note's message data into a string output
        render: async function(handler) {
            var strings = [];

            for (const value of reducer(whind(note.body))){
                if(typeof value == "string")
                    strings.push(value);
                else {
                    const uid = new UID(value.value);

                    const note = (await graze.retrieve(uid))[0];
                    
                    if(note)
                        strings.push(await note.render());
                }
            }

            return strings.join("");
        }
    }
}
