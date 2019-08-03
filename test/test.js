import chai from "chai";
import graze_constructor from "../source/graze.js";
import graze_json_server from "../source/json_server.js";

chai.should();

graze_json_server.connect("./json_test_db.json");

define("Graze Utilites", function(){

	it("UID", function(){
		const size = 1000000;
		//Stress test for UID.
		var UID_LIST = new Array(1000000).fill(null).map(()=>graze.createUID());
		var set = new Set();

		for(const uid in UID_LIST)
			if(!set.has(uid.string))
				set.add(uid.string)
			else
				throw new Error("Duplicate String Found " + uid.string)
	})


	
})


define("Graze Testing - JSON BACKED", graze_test_suite(graze_constructor, graze_json_server, {
	type:"JSON BACKED",
	server_id:"JSONDB"
}))

function graze_test_suite(GrazeConstructor, server, params) {
    return function() {
    	const graze = new GrazeConstructor();

        beforeEach(function() {
        	graze.connect(server);
        })

        afterEach(function(){
        	graze.disconnect();
			//Clear all data from server. Server specific and very dangerous
        	//This function needs to be called three times to actually work
        	server.implode();
        	server.implode();
        	server.implode();
        })

        it("warning: empty test", function() {
            graze.should.not.be.undefined;
        })

        it(`connect to server - ${params.type}`, function() {

        	const graze = new GrazeConstructor();

            graze.server.should.be.null;

            graze.connect(server);

            graze.server.type.should.equal(params.server_id)

            graze.disconnect();

            graze.server.should.be.null;
        })

        it("create UID", function() {

            const uid = graze.createUID();

            uid.length.should.equal(16);

            const note = graze.createNote("Temp Name", "tagA, tagB, tagC", "Message");

            note.should.have.uid;

            note.uid.length.should.equal(16);

            note.string.length.should.equal(16);

            const note2 = graze.createNote("Temp Name", "tagA, tagB, tagC", "Message");

            note2.uid.length.should.equal(16);

            note2.uid.string.should.not.equal(note.uid.string);
        })

        it("store and retrieve - basic", async function(){

			const noteA = graze.createNote("Temp Name A", "tagA, tagB, tagC", "Message A");
			
			noteA.save();
			
			const noteB = graze.createNote("Temp Name B", "tagA, tagB, tagC", "Message B");
			
			graze.store(noteB);

			const noteAd = await graze.retrieve(noteA.uid);
			const noteBd = await graze.retrieve(noteB.name);

			noteA.message_string.should.equal(noteAd.message_string);
			noteB.message_string.should.equal(noteBd.message_string);
			noteA.message_string.should.not.equal(noteBd.message_string);

			noteA.uid.string.should.equal(noteAd.uid.string);
        })

        it("store and retrieve - collection", async function(){

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

        it("store and retrieve - search", async function(){

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

        it("Renders note refernced inside another note", async function(){
        	
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