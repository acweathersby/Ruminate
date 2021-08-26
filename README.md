# RUMINATE NOTES

## Note Database, Query, and Composition Framework

Ruminate presents a set of systems tuned to the task of creating, storing, sharing, and composing notes.

A note is any short (less then 10000 characters) of text and textual data that can be quickly written by a 
user and referenced later as it was made, or through dynamic composition within other notes, or other text
based media. 

Ruminate is designed to make storage and retrieval of notes trivial, by allowing the choice of storage medium
and transmission medium to be aligned with the goals and use cases of the end user. 

Ruminate notes are stored in CRDT ( conflict-free replicated data type) structures, providing a natural means of concurrent editing of note data, either through the act of a single user accessing the same note on different devices, or through multiple users interacting within the same note simultaneously. 

Ruminate is designed to integrate with and be integrated in a variety of software and APIs

# Features

## version 1.0 - AUG 2021

- Base Note Structure 
	- Notes can be titled, tagged  
	- Linking of notes into other notes.
- Query language and query engine
-	 Container Queries
- CRDT Storage
- File System Storage
	- JSON file based note server

## version 2.0 - DEC 2021

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

## version 3.0 - FEB 2021

- API documentation
- User Documentation



