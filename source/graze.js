import UID from "./common/uid";
import Note from "./common/note";
import NoteContainer from "./common/container"

export default class Graze {
    constructor() {
        //Private
        this.server = null;
        this.save = this.store;
    }

    get sort_indexes() { return NoteContainer.sort_indexes; }

    createUID() { return new UID }

    async store(...vals) {
        var RESULT = 0,
            note;

        for (const candidate of vals) {

            if (!(note = candidate.__graze_retrieve_note__))
                note = candidate;

            RESULT += (await this.server.storeNote(note)) | 0;
        }

        return RESULT;
    }

    async retrieve(
        id,
        query
    ) {
        const results = await this.server.query(id, query);

        if (results) {

            return new NoteContainer(
                ...results.map(
                    note_data =>
                    Note(
                        this,
                        new UID(note_data.uid),
                        note_data.id,
                        note_data.tags,
                        note_data.body,
                        note_data.refs || [],
                        note_data.created,
                        note_data.modified
                    )
                )
            )
        }

        return null;
    }

    createNote(
        note_id, // string : String identifier of note. Refere to notes on using container addressing. Required
        note_tags = "", // string | array : Array of string ids or Comma seperated list of ids in a string.
        body = "", // string : String identifier of note. Refere to notes on using container addressing
        uid = this.createUID() // string : String identifier of note. Refere to notes on using container addressing
    ) {
        //Verify arguments.

        if (typeof note_id !== "string")
            throw new Error("note_id argument must be a string value");

        if (typeof note_tags == "string") {
            if (note_tags)
                note_tags = note_tags.split(",");
            else
                note_tags = [];
        } else if (!Array.isArray(note_tags) || note_tags.reduce((r, v) => typeof v !== "string" || r, false))
            throw ("note_tags  argument must be string of comma seperated values or a an array of strings.");

        if (typeof body !== "string")
            throw new Error("body argument must be a string value");

        if (!(uid instanceof UID))
            throw new Error("uid argument must be a UID instance");

        const creation_date = (Date.now() / 1000) | 0

        return Note(
            this,
            uid,
            note_id,
            note_tags,
            body,
            [],
            creation_date,
            creation_date
        )
    }

    /* Connects the Graze instance to a server */
    connect(server) {

        //Check for appropiate server methods

        const ACCEPTABLE =
            typeof server.storeNote == "function" &&
            typeof server.removeNote == "function" &&
            typeof server.retrieveNote == "function" &&
            typeof server.query == "function";

        if (!ACCEPTABLE)
            throw new Error("Server object is not suitable.")

        this.server = server;
    }

    /* Disconnects from the connected server */
    disconnect() {

        if (!this.server)
            return false;

        this.server = null;

        return true;
    }
}
