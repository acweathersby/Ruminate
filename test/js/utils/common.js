import path from "path";
import fs from "fs";
const fsp = fs.promises;

export async function fillTestData(ruminate, file = "w&p") {
    var data = "";
    switch (file.toLowerCase()) {
        case "uscb pop 2018":
        case "pop2018":
            data = await fsp.readFile(path.resolve(process.env.PWD, "./data/test/us_2018_pop_estimate.data.json"), "utf8");
            break;
        case "locfr":
        case "library of congress film registry":
            data = await fsp.readFile(path.resolve(process.env.PWD, "./data/test/loc_film_registry.data.json"), "utf8");
            break;
        case "war and peace":
        case "w&p":
        default:
            data = await fsp.readFile(path.resolve(process.env.PWD, "./data/test/war_and_peace.data.json"), "utf8");
    }

    const entries = JSON.parse(data).data;

    let count = 0;

    for (const entry of entries) {
        count++;
        await ruminate.createNote(entry.id, entry.meta.join(","), entry.body);
    }
    console.log(1)


    ruminate.sync()
}
