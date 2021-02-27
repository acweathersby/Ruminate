# RUMINATE NOTES

## Note Database, Query, and Composition Framework

Ruminate preseents a set of systems tuned to the task of taking, storing, and retrieving notes.
Notes in the context of ruminate represent a short set of sentences, paragraphs, and short form text data that can be quickly written by a user and referenced later as is or through the dynamic inclusion of the note in other works, including other Ruminate notes. 

Ruminate provides resources to store notes in long and short term storage solutions, such as databases or text files, or in system memory. A query langauge provides ways to retrieve notes through means other than basic keyword searches or hiearachal catagories such as folders. 

The storage of Ruminate data is in CRDT (cuasauly ralational data type) structures, providing a natural means of concurrent editing of note data, either through the act of a singlue user accessing the same note on different devices, or through multiple users interacting within the same note simultaneously. 

# Features

## version 1.0 - July 2021

- Base Note Structure 
	- Notes can be titled, tagged  
	- Linking of notes into other notes.
- Query language and query engine
-	 Container Queries
- CRDT Storage
- File System Storage
	- JSON file based note server

## version 2.0 - Oct 2021

- Website
- Database backed storage
	- Self hosting DB driven note server that can be installed as a service
- Reference UI implementation
	- Auto-complete query
	- Seamless MD based rendering
	- Cross Note Editing
- Dynamic note insertion engine
	- Pinning rendered note data.
	- Importing of note data into other file types. 
	- Export of notes from documents using note block syntax. 

## version 3.0 - Dec 2021

- API documentation
- User Documentation


