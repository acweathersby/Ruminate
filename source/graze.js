import UID from "./common/uid";
import Note from "./common/note";
import OptionHandler from "./common/option";
import NoteContainer from "./common/container";
import fuzzy from "./common/fuzzy";
import {
    GRAZE_NOTE,
    GRAZE_NOTE_UPDATE,
    GRAZE_NOTES,
    GRAZE_SYNC_RATE,
    GRAZE_SYNC_INTERVAL_REF,
    GRAZE_SERVER,
    GRAZE_UPDATE_QUEUE,
    GRAZE_UPDATE_QUEUE_ALERT,
} from "./common/symbols";



export default class Graze {

    constructor(options) {
        //Private

        //Queue of notes that need to be synced with the server. 
        this[GRAZE_UPDATE_QUEUE] = [];

        //The server that stores the data and provides query functionality.
        this[GRAZE_SERVER] = null;

        //Store of notes that have been pulled from server. Indexed by uid.
        this[GRAZE_NOTES] = new Map();

        // The rate at which to synchronize the active notes with the server. 
        // Value is in milliseconds. Default is 5 seconds.        
        this[GRAZE_SYNC_RATE] = 5000;

        // Reference to the synchronization interval index 
        this[GRAZE_SYNC_INTERVAL_REF] = -1;

        this.lastCheck = Date.now();

        // List of options that are accepted by graze
        const acceptable_options = new Map([
            ["server", { value: this.connect }],
            ["sync_rate", { value: "sync_rate", parse: [parseInt, null, undefined] }]
        ])

        OptionHandler(options, this, "Graze", acceptable_options);
    }

    //******************************** SERVER ********************************//

    /* Connects the Graze instance to a server */
    connect(server) {

        //Check for appropiate server methods
        const storeNote = (typeof server.storeNote == "function") | 0;
        const removeNote = (typeof server.removeNote == "function") | 0;
        const implode = (typeof server.implode == "function") | 0;
        const getUpdatedUIDs = (typeof server.getUpdatedUIDs == "function") | 0;
        const query = (typeof server.query == "function") | 0;

        const ACCEPTABLE = !!((storeNote & removeNote & implode & getUpdatedUIDs & query) | 0)

        if (!ACCEPTABLE) {
            const error_message = ["Server object is not suitable. " + server.type + ":"];

            if (!storeNote)
                storeNote.push(`\tThe method "storeNote" ([note]) is not present`)
            if (!getUpdatedUIDs)
                error_message.push(`\tThe method "getUpdatedUIDs" ([Date]) is not present`)
            if (!removeNote)
                error_message.push(`\tThe method "removeNote" ([note | uid]) is not present`)
            if (!query)
                error_message.push(`\tThe method "query" ([string | UID, UID, ...]) is not present`)
            if (!implode)
                error_message.push(`\tThe method "implode" () is not present`)

            throw new Error(error_message.join("\n"))
        }

        this[GRAZE_SERVER] = server;
    }

    /* Disconnects from the connected server */
    disconnect() {

        if (!this[GRAZE_SERVER])
            return false;

        this[GRAZE_SERVER] = null;

        return true;
    }

    //************************** SYNCHRONIZATION ******************************//

    [GRAZE_UPDATE_QUEUE_ALERT](note_ref) {
        this[GRAZE_UPDATE_QUEUE].push(note_ref);
    }

    // Accepts a numerical value with the type milliseconds
    // sets the rate at which graze synchonizes with the server.
    // minimum value is 1000    (one second);
    // maximum value is 3600000 (one hour);
    // If the value passed is null, the synchronization is disabled. 
    set sync_rate(value) {
        if (value === null) this[GRAZE_SYNC_RATE] = -1;
        else
            this[GRAZE_SYNC_RATE] = Math.min(3600000, Math.max(1000, parseInt(value) || 1000));
        this.setAutoSync(GRAZE_SYNC_RATE, GRAZE_SYNC_INTERVAL_REF)
    }

    get sync_rate() {
        return this[GRAZE_SYNC_RATE];
    }

    //Sets the synchronization 
    setAutoSync(rate_symbol, interval_reference) {
        if (rate_symbol === GRAZE_SYNC_RATE && GRAZE_SYNC_INTERVAL_REF === interval_reference) {

            if (this[interval_reference] > -1)
                clearInterval(this[interval_reference]);

            if (this[rate_symbol] > 0)
                this[interval_reference] = setInterval(this.sync.bind(this), this[rate_symbol]);
        }
    }

    // Synchronizes changed notes with the server and updates the local cache 
    // with any notes that have been changed remotely. **Candidate for web worker**
    async sync() {
        const server = this[GRAZE_SERVER],
            queue = this[GRAZE_UPDATE_QUEUE];

        if (server) {

            //get all updated notes from the store. 
            const uids = await server.getUpdatedUIDs(this.lastCheck);

            if (uids.length > 0)
                this.lastCheck = Date.now();

            for (const uid of uids)
                this.retrieve(uid);

            const out_queue = queue.slice();

            queue.length = 0;

            if (out_queue.length > 0) {

                for (const note_ref of out_queue) {

                    const RESULT = (await server.storeNote(note_ref.getNote()));

                    if (!RESULT) {
                        console.warn(`Unable to sync note ${id} with uid ${note.uid}`);
                    } else {
                        note_ref.getNote().modified = (new Date).valueOf();
                    }

                    note_ref.sync(RESULT);
                }
            }


        } else
            this.sync_rate = null; //Make sure auto sync is off.
    }

    //*************************** NOTE HANDLING *********************************//

    // Removes all notes from the Graze instance. Any existing client notes will still exists,
    // and can be reconnected by changing one of its values.
    purgeCache() {
        this[GRAZE_NOTES] = new Map;
    }

    createUID() { return new UID }

    get sort_indexes() { return NoteContainer.sort_indexes; }

    // Deprecate in favor of sync
    async store(...vals) {
        var RESULT = 0,
            note;

        for (const candidate of vals) {

            if (!(note = candidate.__graze_retrieve_note__))
                note = candidate;

            RESULT += (await this[GRAZE_SERVER].storeNote(note)) | 0;
        }

        return RESULT;
    }

    // Retrieves notes from server based on query. 
    // Caches all notes received from server.
    // Returns a NoteContainer with all notes reveived.
    // Returns null of no notes matched query.
    async retrieve(
        query // Query string
    ) {

        const
            output = [],
            results = await this[GRAZE_SERVER].query(query);


        if (results) {
            for (const note_data of results) {
                const uid = note_data.uid.toString();
                if (!note_data) continue;

                if (!this[GRAZE_NOTES].has(uid)) {
                    this[GRAZE_NOTES].set(uid, Note(
                        this,
                        new UID(uid),
                        note_data.id,
                        note_data.tags,
                        note_data.body,
                        note_data.refs || [],
                        note_data.modified,
                        false
                    ))
                } else {
                    this[GRAZE_NOTES].get(uid)[GRAZE_NOTE_UPDATE](note_data);
                }

                output.push(this[GRAZE_NOTES].get(uid));
            }
        }

        return new NoteContainer(...output);
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
        } else if (!Array.isArray(note_tags) || note_tags.reduce((r, v) => (typeof v !== "string" && typeof v !== "number") || r, false)) {
            throw new Error(`
                                graze.createNote: [note_tags] argument must be a string of comma separated values or an array of [strings | numbers].Got $ { note_tags.map(e => typeof e) }
                                `);
        }

        if (typeof body !== "string")
            throw new Error("body argument must be a string value");

        if (!(uid instanceof UID))
            throw new Error("uid argument must be a UID instance");

        const note = Note(
            this,
            uid,
            note_id,
            note_tags,
            body,
            [],
            Date.now() | 0,
            true, // Auto sync with server
            GRAZE_NOTES
        )

        this[GRAZE_NOTES].set(uid.toString(), note);

        return note;
    }
}
