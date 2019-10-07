# Ruminate



## Database Handler
The DB handler will auto cache data and run a scanner process to determine which notes should be offloaded to backing store(s) when the note access grows cold.

DB handler can deal with multiple backing stores. This is achieved by actively syncing data between stores and maintaining up-to-date records on notes that have updated. This implies that backing stores must monitor activity in their storage space and update the handler when a note has been updated. updates are then propagated through to the other stores.

When a note is added to the DB, the handler will automatically sync the note across the databases it's maintaining. The note's UID and Modified time are used to determine if the note is updated or note.

When a new

## Database Container

Handles the long term storage and retrieval of notes. Notes are indexed by their UID value and their ID value. Works in unison with the container store to allow notes to be retrieved through queries.

Add Note - Return 0 if the note that is to be added is has been created or there exist an older version of the note that is updated to the version of the added note. Return not 0 if there exists an newer version of the note in the database. Should be followed up with a local retrieve-update-store process by the database handler.




### Actions

- Lookup Notes
- Create notes
- Update notes
