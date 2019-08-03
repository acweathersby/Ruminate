import UID from "../../common/uid";

export default (function(){

	var store = new Map();

	//Resolved path of data file to retrieve and save Note data;
	var file_path = "";

	return Object.freeze({
		type:"JSONDB",

		/* 
			Connects the server to the given json file. 
			This will return false if the connection cannot be made
			in cases were the file cannot be accessed, or the data
			within the file cannot be parsed as JSON data. 
			return true otherwise
		*/
		connect : function(json_file_path){
		},

		/* Stores new note or updates existing note with new values */
		storeNote : function(note){

			var stored_note = null;

			const 
				uid = note.uid.string,
				modifed_time = (Date.now() / 1000)|0;

			
			if(store.has(uid))
				stored_note = store.get(uid);
			else 
				stored_note = {
					created : note.created
				}	
			stored_note.modifed = modifed_time;
			stored_note.uid = uid;
			stored_note.body = note.body;
			stored_note.id = note.id;
			stored_note.tags = note.tags;
			stored_note.query_data = `${note.id} ${note.tags.join(";")} ${note.body}}`;


			store.set(uid, stored_note);

			return true;
		},

		removeNote : function(uid){
		},

		retrieveNote : function(){
		},

		query : async function(id, query){
			
			var container = "", query_object = null;
			
			const out = [];

			if(id instanceof UID)
				return store.get(id.string);

			if(Array.isArray(id)){

				for(let item of id)
					if(item = this.query(item))
						out.push(item);

				return out;
			}

			//Force string value for id;
			id = id + ""; 

			//Generate query engine and run against the data set.
			const temps = [];
			//Brute force search of ids
			if(id)
				for(const note of store.values())
					note.id.includes(id) ? temps.push(note) : null;

			out.push(...temps);
			
			return (out.length == 1) ? out[0] : out;
		},

		/* 
			Deletes all data in store. 
		 	Returns a function that returns a function that actually does the clearing.
		 	Example server.implode()()();
		 	This is deliberate to force dev to use this intentionally.
		 */
		implode: ()=> ()=> ()=> {
			store = new Map();
			file_path = "";
		},


    	get type(){ return "JSONDB" }
		
	})
})()
