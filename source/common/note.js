export default function Note(graze, uid, id, tags, body, refs, created, modified) {

    const note = {
        uid,
        id,
        tags,
        body,
        refs,
        created,
        modified
    }

    return {
        get __graze_retrieve_note__() { return note },
        get uid(){ return uid.frozenClone() },
        get body(){ return body },
        get id(){return id},
        // saves the note's data to the backing server. returns true if the save was successfull, or returns false.
        save: async () => (await graze.store(note)) > 0,
        // render the note's message data into string output, transforming
        render : async function(){

        }
    }
}
