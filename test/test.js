import chai from "chai";
import graze_constructor from "../source/graze.js";
import graze_json_server from "../source/server/json/server.js";

chai.should();

graze_json_server.connect("./json_test_db.json");

describe.skip("Graze Utilites", function() {
	this.slow(50000)
	this.timeout(50000)

    const graze = new graze_constructor();

    it("UID", function() {
        const size = 1000000;
        //Stress test for UID.
        var UID_LIST = new Array(1000000).fill(null).map(graze.createUID);

        var set_ = new Set();

        for (const uid of UID_LIST)
            if (!set_.has(uid.string)) {
                set_.add(uid.string)
            } else {
                throw new Error("duplicate string found:" + uid + " " + uid.string)
            }
    })



})


describe("Graze Testing - JSON BACKED", graze_test_suite(graze_constructor, graze_json_server, {
    type: "JSON BACKED",
    server_id: "JSONDB"
}))

function graze_test_suite(GrazeConstructor, server, params) {
    return function() {
        const graze = new GrazeConstructor();

        beforeEach(function() {
            graze.connect(server);
        })

        afterEach(function() {
            graze.disconnect();
            //Clear all data from server. Server specific and very dangerous
            //This function needs to be called three times to actually work
            server.implode()()();
        })

        it("warning: empty test", function() {
            graze.should.not.be.undefined;
        })

        it(`connect to server - ${params.type}`, function() {

            const graze = new GrazeConstructor();

            graze.should.have.property("server", null);

            graze.connect(server);

            graze.server.type.should.equal(params.server_id)

            graze.disconnect();

            graze.should.have.property("server", null);
        })

        it("create UID", function() {

            const uid = graze.createUID();

            uid.length.should.equal(16);

            const note = graze.createNote("Temp Name", "tagA, tagB, tagC", "Message");

            note.should.have.property("uid");

            note.uid.should.have.lengthOf(16);

            note.body.length.should.equal(7);

            const note2 = graze.createNote("Temp Name", "tagA, tagB, tagC", "Message");

            note2.uid.length.should.equal(16);

            note2.uid.string.should.not.equal(note.uid.string);
        })

        it("store and retrieve - basic", async function() {

            const noteA = graze.createNote("Temp Name A", "tagA, tagB, tagC", "Message A");

            noteA.save();

            const noteB = graze.createNote("Temp Name B", "tagA, tagB, tagC", "Message B");

            graze.store(noteB);

            const noteAd = await graze.retrieve(noteA.uid);
            const noteBd = await graze.retrieve(noteB.id);
            
            noteA.body.should.equal(noteAd.body);
            noteB.body.should.equal(noteBd.body);
            noteA.body.should.not.equal(noteBd.body);

            noteA.uid.string.should.equal(noteAd.uid.string);
        })

        it("store and retrieve - collection", async function() {

            const noteA = graze.createNote("temp.Temp Name A", "tagA, tagB, tagC", "Message A");

            noteA.save();

            const noteB = graze.createNote("temp.Temp Name B", "tagA, tagB, tagC", "Message B");

            graze.store(noteB);

            const noteC = graze.createNote("temp.temp.Temp Name B", "tagA, tagB, tagC", "Message B");

            const notes = await graze.retrieve("temp.");

            notes.length.should.equal(2);

            notes.sort(graze.sort_indexes.create_time)[0].message_string.should.equal(noteA.message_string.name);
            notes.sort(graze.sort_indexes.create_time)[1].message_string.should.equal(noteB.message_string.name);

            const notes2 = await graze.retrieve("temp.temp.");

            notes2.length.should.equal(1)
            notes2[0].message_string.should.equal(noteC.message_string);
        })

        it("store and retrieve - search", async function() {

            const noteA = graze.createNote("temp.Temp Name A", "tagA, tagB, tagC", "Message A");

            noteA.save();

            const noteB = graze.createNote("temp.Temp Name B", "tagA, tagB, tagC", "Message B");

            graze.retrieve(noteB);

            const noteC = graze.createNote("temp.temp.Temp Name B", "tagA, tagB, tagC", "Message B");

            noteC.store();

            const notes = await graze.retrieve("", "temp.temp. && Name B && Message B");

            notes.length.should.equal(1);

            notes[0].message_string.should.equal(noteC.message_string);
        })

        it("Renders note refernced inside another note", async function() {

            const noteA = graze.createNote("temp.Temp Name A", "tagA, tagB, tagC", "inside");

            noteA.save();

            const noteB = graze.createNote("temp.Temp Name B", "tagA, tagB, tagC", `referenced note text: ((${noteA.uid}))`);

            //note does not need to be saved in order to take advantage of reference rendering.

            (await noteB.render()).should.equal("referenced note text: inside");
        })

        //storage
        //search
    }
}
