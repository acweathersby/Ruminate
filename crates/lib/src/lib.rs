/**
 * Ruminate Library
 *
 * Copyright 2021 Anthony C Weathersby
 *
 * All rights reserved
 *
 * See License at ../../LICENSE.md
 *
 * If license was not provided with this distribution then refer to
 * github.com/acweathersby/ruminate/LICENSE.md
 */
//---
pub mod primitives;
pub mod tables;

use primitives::uuid::UUID;
use tables::*;

type NotePackage = (
    NoteUUID,
    NoteInternalCRDT,
    Vec<TagString>,
    Vec<NoteLinkMeta>,
);

//Initializes a new store for notes
pub fn create_store() -> Store {
    Store::new()
}

pub fn import_note(store: &mut Store, note_package: NotePackage) {}

pub fn export_note() -> NotePackage {}

//----------- NOTES

//Creates a new new note and returns the local id for that note.
pub fn create_note(store: &mut Store) -> NoteLocalID {
    return 0;
}

//Returns a notes UUID from its local id
pub fn get_note_uid(store: &mut Store, note_local_id: NoteLocalID) -> NoteUUID {
    return UUID::new(0);
}

pub fn get_note_crdt(store: &mut Store, note_local_id: NoteLinkID) -> NoteInternalCRDT {}

pub fn get_note_clock(store: &mut Store, note_local_id: NoteLocalID) -> u32 {
    //Load the note CRDT
}

pub fn get_note_text(store: &mut Store, note_local_id: NoteLocalID) -> String {}

pub fn insert_text(store: &mut Store, note_local_id: NoteLocalID, index: usize, text: String) {}

pub fn delete_text(store: &mut Store, note_local_id: NoteLocalID, index: usize, count: usize) {}

pub fn merge_note_data(store: &mut Store, note_local_id: NoteLinkID, foreign_note: NotePackage) {}

//----------- Links / Query

pub fn create_link(
    store: &mut Store,
    note_local_id: NoteLinkID,
    index: usize,
    lnk_text: String,
) -> NoteLinkID {
}

pub fn update_link(store: &mut Store, link_id: NoteLinkID, link_text: String) {}

pub fn get_notes_from_link(store: &mut Store, link_id: NoteLinkID) -> Vec<NoteLocalID> {}

//----------- Containers

pub fn add_note_to_container(store: &mut Store, container_path: String, note_local_id: NoteLinkID) {
}

pub fn remove_note_from_container(
    store: &mut Store,
    container_path: String,
    note_local_id: NoteLinkID,
) {
}

pub fn get_notes_from_container(store: &mut Store, container_path: String) -> Vec<NoteLocalID> {}

pub fn get_number_of_notes_in_container(store: &mut Store, container_path: String) -> u32 {
    0
}

pub fn get_number_of_sub_containers(store: &mut Store, container_path: String) -> u32 {
    0
}

//----------- TAGS

pub fn add_tag(store: &mut Store, note_local_id: NoteLocalID, tag: TagString) -> TagLocal {
    return UUID::new(0);
}

pub fn remove_tag(store: &mut Store, note_local_id: NoteLocalID, tag: TagString) -> NoteUUID {
    return UUID::new(0);
}

pub fn get_notes_from_tag(store: &mut Store, tag: TagString) -> Vec<NoteLocalID> {}

//----------- Query

pub async fn get_notes_from_query(store: &mut Store, query_text: String) -> Vec<NoteLocalID> {}

//----------- Language Server

pub fn extract_notes_from_text(input_text_label: String, input_text: String) -> Vec<NoteLocalID> {}

pub fn update_notes_in_text(input_text_label: String, input_text: String) -> String {}

//----------- Maintenance

pub fn purge_history(store: &mut Store, note_local_id: NoteLinkID) {}

pub fn purge_unreferenced(store: &mut Store) {}
