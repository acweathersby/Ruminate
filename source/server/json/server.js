import UID from "../../common/uid.js";
import { QueryEngine } from "../common/query/query.js";
import { matchString, parseContainer, parseId } from "../common/query/query_functions.js";
import { noteDataToBuffer, noteDataFromBuffer } from "../../common/serialization.js";
import fs from "fs";
import path from "path";
import Container from "../common/container.js";
//import crdt from "../../cpp/crdt.asm.js";



const fsp = fs.promises;
var log = "";

const writeError = e => log += e;
const warn = e => {};

function Server(delimeter = "/") {

    let watcher = null,
        file_path = "",
        READ_BLOCK = false;

    var
        uid_store = new Map,
        container_store = new Map,
        container = new Container;

    function getContainer(uid) {

        const id = uid + "";

        if (!container_store.has(id))
            container_store.set(id, new Map);

        return container_store.get(id);
    }

    /* Writes data to the stored file */
    async function write() {

        if (file_path) {

            const out = { data: [] };

            for (const note_store of container_store.values())
                for (const note of note_store.values())

                    out.data.push(note);

            READ_BLOCK = true

            try {
                await fsp.writeFile(file_path, JSON.stringify(out), "utf8")
            } catch (e) {
                writeError(e);
            }
            READ_BLOCK = false;
        }

        return false;
    }

    /* Read data from file into store */
    async function read(fp = file_path) {

        if (
            /*Prevent reading file that has just been updated from this server.*/
            READ_BLOCK ||
            !fp
        )
            return;

        let data = "",
            STATUS = false;

        await fsp.readFile(fp, "utf8")
            .then((d) => (STATUS = true, data = d))
            .catch(writeError);
        // Create new storage systems.
        container_store = new Map;
        uid_store = new Map;
        container = new Container;

        try {
            if (STATUS) {

                if (data) {

                    const json = JSON.parse(data);

                    if (json.data)
                        for (const note of json.data) {
                            if (note.uid) {
                                getContainer(container.get(note.id).uid).set(note.uid, note);

                                uid_store.set(note.uid, note.id);
                            }
                        }
                }
            }

            if (data)
                STATUS = updateDB(data);

        } catch (e) {
            writeError(e);
            STATUS = false;
        }

        return STATUS;
    }


    /* Updates store with data from json_String */
    function updateDB(json_data_string) {
        try {

            const json = JSON.parse(json_data_string);

            if (json.data)
                for (const note of json.data)
                    if (note.uid) {
                        getContainer(container.get(note.id).uid).set(note.uid, note);
                        uid_store.set(note.uid, note.id);
                    }
            return true;
        } catch (e) {
            writeError(e);
        }
        return false
    }

    function noteFromUID(uid) {
        const id = uid_store.get(uid + "");

        if (!id) return null;

        return noteFromID(id, uid);
    }

    function noteFromID(id, uid) {
        return getContainer(container.get(id, delimeter).uid).get(uid) || null;
    }

    const queryRunner = QueryEngine({
            getNotesFromContainer: container_uid => [...getContainer(container_uid).values()],
            getNoteFromUID: note_uid => noteFromUID(note_uid)
        },
        false
    );  

    let CPP_RUNTIME_LOADED = true;//false

    //const crdt_watcher = new Promise(res=>crdt({onRuntimeInitialized: function() {CPP_RUNTIME_LOADED = true; res()}}))

    return new(class Server {

        get type() {
            return "JSONDB"
        }

        /* 
            Connects the server to the given json file. If file does not exist than an attempt is made to create it.
            This will return false if the connection cannot be made
            in cases were the file cannot be accessed, or the data
            within the file cannot be parsed as JSON data. 
            return true otherwise
        */
        async connect(json_file_path) {

            //Await C++ Runtime
            if(!CPP_RUNTIME_LOADED)
                await crdt_watcher;

            let result = false;

            const temp = path.resolve(process.cwd(), json_file_path);

            if (await read(temp)) {
                file_path = temp;
                result = true;
            } else {
                try {
                    await fsp.writeFile(temp, "")
                    file_path = temp;
                    result = true;modified
                } catch (e) { writeError(e) }
            }
            if (result) {
                if (watcher)
                    watcher.close();

                watcher = fs.watch(file_path, { encoding: "utf8" }, (event, data) => {
                    if (event == "change")
                        read();
                })
            }
            return result;
        }

        /* Stores new note or updates existing note with new values */
        async storeNote(note_buffer) {    

            var stored_note = null;

            const note = noteDataFromBuffer(note_buffer);

            const tag_value = ""

            const
                uid = note.uid.toString(),
                modified_time = Date.now();
                
            stored_note = noteFromUID(uid);

            if (!stored_note)
                stored_note = { id: note.id }

            const old_id = stored_note.id;

            stored_note.buffer = note_buffer;
            stored_note.modified = modified_time;
            stored_note.uid = uid;
            stored_note.body = note.body;
            stored_note.id = note.id;
            stored_note.tags = note.tags;
            stored_note.query_data = `${note.id.split(".").pop()}  ${tag_value}`;

            uid_store.set(uid, note.id);
            
            getContainer(container.change(old_id, note.id, delimeter).uid).set(uid, stored_note);

            await write();
            return true;
        }

        removeNote(uid) {}

        async query(query_string) {
            await read(); //Hack - mack sure store is up to date;
            return (await queryRunner(query_string, container)).map(note => noteDataToBuffer(new UID(note.uid), note.modified, note.id, note.tags, note.body))
        }

        // Return a list of all uid's that a modified time greater than [date] given
        async getUpdatedUIDs(date){
            
            await read(); //Hack - mack sure store is up to date;

            const d = (new Date(date).valueOf());

            const out = [];

            for(const store of container_store.values()){

                for(const note of store.values()){
                    if(note.modified > d)
                        out.push(note.uid.toString());
                }
            }
            return out;
        }

        /* 
            Deletes all data in container_store. 
            Returns a function that returns a function that actually does the clearing.
            Example server.implode()()();
            This is deliberate to force dev to use this intentionally.
         */
        implode() {
            file_path && warn("Warning: Calling the return value can lead to bad things!");
            return () => (file_path && warn(`Calling this return value WILL delete ${file_path}`),
                async () => {

                    container_store = new Map;
                    uid_store = new Map;
                    container = new Container;

                    try {
                        if (file_path)
                            await fsp.unlink(file_path).catch(e => {});
                    } catch (e) {
                        writeError(e);
                    }

                    file_path = "";
                })
        }
    })
}

export default function() {
    if (new.target);
    return Server();
}
