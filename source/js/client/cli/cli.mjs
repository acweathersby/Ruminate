import net from "net";
import UID from "../../common/uid.js";

const EOT = String.fromCharCode(4); // End of Transmission https://en.wikipedia.org/wiki/End-of-Transmission_character


function SendQuery(query_string, server_data) {
    return new Promise((res, rej) => {

        const test_socket = new net.Socket({ readable: true, writable: true });

        test_socket.setEncoding("utf8");

        test_socket.on("data", (data) => {
            res(JSON.parse(data));
            test_socket.end(data=>{
                console.log("Server Close Response", data);
            });
        });

        test_socket.connect(server_data.port, server_data.host, () => {
            test_socket.write(query_string);
            test_socket.write(EOT + " ");
        });
    })
}


SendQuery("*/*?#test", { port: 15658, host: "127.0.0.1" }).then(payload => {
    console.log(payload)

    var note = payload.notes[1];

    console.log("Incoming Data:", note);

    console.log("" + new UID(note.uid), new Date(note.modified / 10000))
})