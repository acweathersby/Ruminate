import {fillTestData} from "./common.js";
import UID from "../source/common/uid.js";

export default function graze_test_suite(GrazeConstructor, ServerConstructor, params) {
    return function() {
        const graze = new GrazeConstructor();
        const server = new ServerConstructor();


        before(async function() {
            const s = new ServerConstructor()
            await s.connect(params.server_test_store);
            s.implode()()();
        })

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

        it.only("store and retrieve - basic", async function() {

            const noteA = graze.createNote("Temp Name A", "tagA, tagB, tagC", "Message A");

            noteA.save();

            const noteB = graze.createNote("Temp Name B", "tagA, tagB, tagC", "Message B");

            graze.store(noteB);

            const noteAd = (await graze.retrieve(noteA.uid.string))[0];
            const noteBd = (await graze.retrieve(noteB.id))[0];

            noteA.body.should.equal(noteAd.body);
            noteB.body.should.equal(noteBd.body);
            noteA.body.should.not.equal(noteBd.body);

            noteA.uid.string.should.equal(noteAd.uid.string);
        })

        it("store and retrieve - collection", async function() {

            const noteA = graze.createNote("temp/Temp Name A", "tagA, tagB, tagC", "Message A");

            await noteA.save();

            const noteB = graze.createNote("temp/Temp Name B", "tagA, tagB, tagC", "Message B");

            await graze.store(noteB);

            const noteC = graze.createNote("temp/temp/Temp Name B", "tagA, tagB, tagC", "Message B");

            await noteC.save();

            const notes = await graze.retrieve("temp/");

            notes.length.should.equal(2);

            notes.sort(graze.sort_indexes.create_time)[0].body.should.equal(noteA.body);
            notes.sort(graze.sort_indexes.create_time)[1].body.should.equal(noteB.body);

            const notes2 = await graze.retrieve("temp/temp/");

            notes2.length.should.equal(1);

            notes2[0].body.should.equal(noteC.body);
        })

        it("store and retrieve - search", async function() {

            const noteA = graze.createNote("temp/Temp Name A", "tagA, tagB, tagC", "Message A");

            noteA.save();

            const noteB = graze.createNote("temp/Temp Name B", "tagA, tagB, tagC", "Message B");

            graze.retrieve(noteB);

            const noteC = graze.createNote("temp/temp/Temp Name B", "tagA, tagB, tagC", "Message B");

            noteC.store();

            const notes = await graze.retrieve("temp/*  ? Name B && Message B");

            notes.length.should.equal(1);

            notes[0].body.should.equal(noteC.body);
        })

        it("Renders note referenced inside another note", async function() {

            const noteG = graze.createNote("temp/Temp Name A", "tagA, tagB, tagC", "inception");

            await noteG.save();

            const noteA = graze.createNote("temp/Temp Name A", "tagA, tagB, tagC", `inside ((${noteG.uid}))`);

            await noteA.save();

            const noteB = graze.createNote("temp/Temp Name B", "tagA, tagB, tagC", `referenced note text: ((${noteA.uid}))`);

            //note does not need to be saved in order to take advantage of reference rendering.

            (await noteB.render()).should.equal("referenced note text: inside inception");
        })
        //*
        //it("warns if no server is connected to graze");

        it("Loads permanently stored data", async function() {
            this.slow(500);
            this.timeout(750);

            const serverA = new ServerConstructor();
            const serverB = new ServerConstructor();
            const serverC = new ServerConstructor();
            //Connect server to data store
            await serverA.connect(params.server_test_store);
            await serverC.connect(params.server_test_store);

            graze.disconnect();

            await graze.connect(serverA);

            await (graze.createNote("temp/tempA/Temp Name A", "tagA, tagB, tagC", "Test 1").store());
            await (graze.createNote("temp/tempB/Temp Name B", "tagA, tagB, tagC", "Test 2").store());
            await (graze.createNote("temp/tempC/Temp Name C", "tagA, tagB, tagC", "Test 3").store());
            await (graze.createNote("temp/tempD/Temp Name D", "tagA, tagB, tagC", "Test 4").store());
            await (graze.createNote("temp/tempE/Temp Name E", "tagA, tagB, tagC", "Test 5").store());

            graze.disconnect();

            await serverB.connect(params.server_test_store);

            graze.connect(serverB);

            (await graze.retrieve("temp/*")).length.should.equal(5);

            graze.disconnect();

            graze.connect(serverC);

            (await graze.retrieve("temp/tempE/")).length.should.equal(1);
            (await graze.retrieve("temp/*")).length.should.equal(5);
        })

        it("Server.implode dumps all data from store - **dependent on previous test**", async function() {

            const serverA = new ServerConstructor();
            const serverB = new ServerConstructor();

            await serverA.connect(params.server_test_store);
            await serverB.connect(params.server_test_store);

            graze.connect(serverA);

            (await graze.retrieve("temp/*")).length.should.equal(5);

            serverA.implode()()();

            graze.disconnect();

            await graze.connect(serverB);

            (await graze.retrieve("temp/*")).length.should.equal(0);

        })

        it.skip("Advanced queries - Wild Card * ", async function() {
            this.slow(2000);
            this.timeout(5000);

            await fillTestData(graze);

            await fillTestData(graze, "locfr");

            (await graze.retrieve("*")).length.should.equal(12429);

            (await graze.retrieve("book 1/")).length.should.equal(1);

            (await graze.retrieve("book 1/*")).length.should.equal(1141);

            (await graze.retrieve("*/chapter */")).length.should.equal(11346);

            (await graze.retrieve("*/chapter */ ? The dog")).length.should.equal(1);

            (await graze.retrieve("*/chapter */ ? squirrel")).length.should.equal(3);

            (await graze.retrieve("*/chapter */ ? The dog or squirrel")).length.should.equal(4);

            (await graze.retrieve("*/chapter 1*/ ? The dog or squirrel")).length.should.equal(2);

            (await graze.retrieve("*/chapter 2*/ ? The dog or squirrel")).length.should.equal(0);

            (await graze.retrieve("*/films/")).length.should.equal(751);
        })

        it.skip("Avanced queries - Sorting", async function() {
            this.slow(2000);
            this.timeout(5000);
            await fillTestData(graze);
            await fillTestData(graze, "locfr");

            (await graze.retrieve("*/films/ sort #Released dec, #Created asc")).map(note => note.body);

            console.log((await graze.retrieve("book*/* filter: #footnote and #3 sort: #3")).map(note => note.body));
        })
        it("Auto update")
        it("Auto update")
        //*/
    }
}
