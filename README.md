# GRAZE NOTES

#### seriously, an experimental work-in-progress

For those quick, daydreaming ideas that quickly float off, and the rest. 📓


version 0.*.* - The console miester

#usage
```bash

yarn install graze

graze 

```

Methodes - 
	Lookup Note
	Add Note
	Edit Note
	Delete Note

Note structure
	Note Body
	Note Title
	Note Tags
	Note Ref Count
	Note UID
	Note Refs

Adding Note
	Use Query To Identify note 
	Check to see if the host is refered in any of claim's references
	If passed ref test insert note, update claim ref count. Add claim to the existing notes references.


Note Structure. Notes maintain UID references references to the 

Note : {	
	
}



API 
createUID

Graze Server API:

	storeNote
	retrieveNote
	removeNote
	query
	implode


Graze Runtime

	properties:

		note_count : number of notes stored in the current store. 

		cache : references to notes that have been retrieved from store. 

		sort_indexes: 

				create_time : 1
				modify_time : 2
				id : 3
				tags : 4
				body : 5


	methods:

		createUID - 

			Returns a UID value

		createNote -
			args => note_id : string [, note_tags : array of strings || csv string[, body : string[, UID]]]

			Creates a new note with a new UID, setting creation time stamp to moment of call. At this point, this note is NOT 
			stored within a data store. Either the notes store/save method must be called, or the note must be passed to graze.store()
			If UID is supplied, this must be a UID value unique to the store, otherwise, a new note will not be created and the 

			return new Note.

		retrieve - 
			args => collection or note name : string | uid [,   query : string]

			Retrieves a single note or a note collection. This function accepts a UID, the string name of the desired note, or a list of UID's, or the empty string.
			An optional query string can be supplied to further reduce the results. This function may return all notes if not supplied with any arguments, so use with caution. 

		remove -

			arg => note : Note | Array[, +]

			Removes a note from the store. Accepts an array of notes, or multiple arguments of notes. Removes the notes from the store. Notes are note fully removed unless the 
			reference parameter is set to zero, ie, there are no references to that note. Other wise, only the note's removed flag is set and the note can no longer be retrieved from the store. 

		store - 
			args => note : Note | Array[, +]

			Stores note(s) in the data store, or updates the stored copy with the new value;

Note Container

	Stores a collection of notes. Notes can be indexed by index location

	properties:

		length: number of notes in the container. 

	methods:

		sort:	Returns a new container with nodes sorted according to argument
				argument can either be a graze.sort_index value or a function


Note
	properties:
		
		uid: 128bit string number.  
		modify-date: UNIX TIME STAMP
		creation-date: UNIX TIME STAMP
		id: string - docs.test.me
		tags: string - csv tag names. could be auto generated
		body: string or line list or some appropriate data structure. 
		refs: array of UIDS of referred notes - virtaul 

	methods:

	 	store/save 	: async - saves the note's data to the backing server. returns true if the save was successfull, or returns false. 
	 	render 		: async - render the note's message data into string output, transforming reducing any note references. 
 					Accepts a transformer function argument that's used to customize the transformation process. 
