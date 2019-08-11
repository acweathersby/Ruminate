import reducer from "../compiler/reduce_tree";
import whind from "@candlefw/whind";
import UID from "./uid";
import * as jsdiff from "diff";

export default function Note(graze, uid, id, tags, body, refs, created, modified) {

    let note = {
        uid,
        id,
        tags,
        body,
        refs,
        created,
        modified,
        change_index: 0,
        changed: [] // For change states
    }

    const store = async () => (await graze.store(note)) > 0;

    return {
        get created() { return note.uid.date_created.valueOf() },
        get createdDateObj() { return note.uid.date_created },
        get modified() { return note.modified },
        get __graze_retrieve_note__() { return note },
        get uid() { return uid },
        get id() { return note.id },
        get body() { return note.body },
        set body(str) {
            let modstr = note.body,
                CHANGED = false;
            let offset = 0;

            //Get Minimum changes to note
            for (const diff of jsdiff.diffChars(note.body, str)) {
                if (diff.added) {
                    modstr = modstr.slice(0, offset) + diff.value + modstr.slice(offset);
                    CHANGED = true;
                } else if (diff.removed) {
                    modstr = modstr.slice(0, offset) + modstr.slice(offset + diff.count);
                    CHANGED = true;
                    offset -= diff.count;
                }
                offset += diff.count;
                //insert into string
            }

            //update store with new note changes. 
            if(CHANGED)
                note.body = modstr;
                graze.store(note);

        },
        get tags() { return note.tags },
        //set tags(str) { note.tags = str },
        get meta() { return note.tags },

        async insert(index, string) {
            note.body
            //note.changed.push({i:change_index++, type:update; ste:})
            //push upate to the server.
            await graze.store(note);
        },
        async delete(index, length) {},
        //set meta(str) { note.tags = str },
        // saves the note's data to the backing server. returns true if the save was successfull, or returns false.
        save: store,
        store,
        // render the note's message data into a string output
        render: async function(handler, set = new Set) {
            if (handler) {
                for (const value of reducer(whind(note.body))) {
                    if (typeof value == "string")
                        await handler("string", value);
                    else {
                        const notes = await graze.retrieve(value.value)
                        await handler("notes", notes, value);
                    }
                }
                handler("complete");
            } else {

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
}
