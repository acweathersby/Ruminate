# Ruminate



## Database Handler
The DB handler will auto cache data and run a scanner process to determine which notes should be offloaded to backing store(s) when the note access grows cold.

DB handler can deal with multiple backing stores. This is achieved by actively syncing data between stores and maintaining up-to-date records on notes that have updated. This implies that backing stores must monitor activity in their storage space and update the handler when a note has been updated. updates are then propagated through to the other stores.

When a note is added to the DB, the handler will automatically sync the note across the databases it's maintaining. The note's UID and Modified time are used to determine if the note is updated or not.


## Database Container

Handles the long term storage and retrieval of notes. Notes are indexed by their UID value and their ID value. Works in unison with the container store to allow notes to be retrieved through queries.

Add Note - Return 0 if the note that is to be added is has been created or there exist an older version of the note that is updated to the version of the added note. Return not 0 if there exists an newer version of the note in the database. Should be followed up with a local retrieve-update-store process by the database handler.

## Note 

Notes are comprised of two data structures relavent meta data. The UID of a note is the primary means to lookup a unique note. The container information is used to organize notes into hierachal structures. The modified time is used for basic data base synchronization and database updating. The tags of a note are user defined key-value pairs useful as meta, attribute, and primary data for a note. The body of a note can be used for acyclic composition of notes as well as providing the primary store of user defined unordered information. 

UID - Spec defined unique identifier. 
MODIFIED DATE - Numerical Date for. 
CONTAINER DATA - Hierachial Text based index. 
TAGS - Text and Numerical based Key-Value Pairs
BODY - Implementation defined binary / text data. 

The exact form of the body data is ambigious and is only defined by the unique implementation of a note type. 

(()) Are binding points that allow one note to be composed into another note. 

Note JSON payload

{
	result_info : text,
	note_count : number of notes in payload
	notes : array of notes
}




### Actions

- Lookup Notes
- Create notes
- Update notes
