import net from "net";
import UID from "../../common/uid.js";
import Note from "../../common/note.js";

const EOT = String.fromCharCode(4); // End of Transmission https://en.wikipedia.org/wiki/End-of-Transmission_character

function SendQuery(query_string, server_data) {
    return new Promise((res, rej) => {

        const test_socket = new net.Socket({ readable: true, writable: true });

        test_socket.setEncoding("utf8");

        test_socket.on("data", (data) => {
            res(JSON.parse(data));
            test_socket.end(data => {
                console.log("Server Close Response", data);
            });
        });

        test_socket.connect(server_data.port, server_data.host, () => {
            test_socket.write(query_string);
            test_socket.write(EOT + " ");
        });
    })
}

class RuminateClientEngine {

    constructor() {
        this.server_host_data = { port: 15658, host: "127.0.0.1" };
    }

    //retrives note data from database. 
    async retrieve(retrieve_string) {
        const out = [];
        const payload = await SendQuery(retrieve_string, this.server_host_data);

        for (let i = 0; i < payload.result_info.note_count; i++) {


            const note = new Note(payload.notes[i], this);

            out.push(note);
        }

        return out;
    }

    async send(note) {

        if (!note)
            return null;

        const re = /\;/g;

        const
            uid = note.uid.toString(),
            body_string = note.updatedBodyData() || "", //Most recent body data since last call to updatedBodyData.
            tag_string = note.updatedTagData() || "", //Most recent tag data since last call to updatedTagData. 
            id_string = note.updatedIdData() || "", //Most recent id data since last call to id data. 


        add_string = `ADD ${uid};${id_string.replace(re,"")};test=22.2,maybery;${body_string}`;

        return await SendQuery(add_string, this.server_host_data);

    }

    async createNote(){
        const create_id = "/testing/new note"
        const create_string = `ADD ${create_id};;test=568;Lovely Day in the neighborhood!`;
        return await SendQuery(create_string, this.server_host_data);
    }
}


const engine = new RuminateClientEngine();

console.log(engine)

engine.createNote();

engine
    .retrieve("*/noteA")
    .then(notes=>{
        const note = notes[0];

        console.log(notes)

        note.id = "/silvia/parolie"

        note.body = "Mango Tree has returned Crast and demon roost. I do declare, this is the first time he has done that in over a score!";

        return note;
    })
    .then(engine.send.bind(engine))
    .then(result => {
        console.log(result);
    })