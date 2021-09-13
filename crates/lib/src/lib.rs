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

use std::thread::LocalKey;

use primitives::uuid::UUID;
use tables::*;

type NotePackage = (
    NoteUUID,
    NoteInternalCRDT,
    Vec<TagString>,
    Vec<NoteLinkMeta>,
);

//Initializes a new store for notes
pub fn store_create() -> Store {
    Store::new()
}

pub fn store_import_note_package(store: &mut Store, note_package: NotePackage) {}

pub fn store_create_note_package(store: &mut Store, note_local_id: NoteLocalID) -> NotePackage {}

pub fn store_get_notes(store: &mut Store) -> Vec<NoteLocalID> {}

pub fn store_get_self_site_uuid(store: &mut Store) -> SiteUUID {}

pub fn store_get_local_site_id(store: &mut Store, site_uuid: SiteUUID) -> SiteLocalID {}

pub fn store_get_uuid_from_site_id(store: &mut Store, site_local_id: SiteUUID) -> SiteLocalID {}
//----------- NOTES

//Creates a new new note and returns the local id for that note.
pub fn note_create(store: &mut Store) -> NoteLocalID {
    return 0;
}

//Returns a notes UUID from its local id
pub fn note_get_uuid_from_local_id(store: &mut Store, note_local_id: NoteLocalID) -> NoteUUID {
    return UUID::new(0);
}

pub fn note_get_local_id_from_uuid(store: &mut Store, note_local_id: NoteLocalID) -> NoteUUID {
    return UUID::new(0);
}

pub fn note_get_crdt(store: &mut Store, note_local_id: NoteLinkID) -> NoteInternalCRDT {}

pub fn note_get_clock(store: &mut Store, note_local_id: NoteLocalID) -> u32 {
    //Load the note CRDT
}

pub fn note_get_text(store: &mut Store, note_local_id: NoteLocalID) -> String {}

pub fn note_insert_text(store: &mut Store, note_local_id: NoteLocalID, index: usize, text: String) {
}

pub fn note_delete_text(store: &mut Store, note_local_id: NoteLocalID, index: usize, count: usize) {
}

pub fn note_merge_data(store: &mut Store, note_local_id: NoteLinkID, foreign_note: NotePackage) {}

//----------- Links / Query

pub fn link_create(
    store: &mut Store,
    note_local_id: NoteLinkID,
    index: usize,
    lnk_text: String,
) -> NoteLinkID {
}

pub fn link_update(store: &mut Store, link_id: NoteLinkID, link_text: String) {}

pub fn link_get_notes(store: &mut Store, link_id: NoteLinkID) -> Vec<NoteLocalID> {}

//----------- Containers

pub fn container_add_note(store: &mut Store, container_path: String, note_local_id: NoteLinkID) {}

pub fn container_remove_note(store: &mut Store, container_path: String, note_local_id: NoteLinkID) {
}

pub fn container_get_notes(store: &mut Store, container_path: String) -> Vec<NoteLocalID> {}

pub fn container_get_note_count(store: &mut Store, container_path: String) -> u32 {
    0
}

pub fn container_get_sub_container_count(store: &mut Store, container_path: String) -> u32 {
    0
}

pub fn container_get_sub_container(store: &mut Store, container_path: String) -> String {
    0
}

//----------- TAGS

pub fn tag_create(store: &mut Store, note_local_id: NoteLocalID, tag: TagString) -> TagLocal {
    return UUID::new(0);
}

pub fn tag_remove(store: &mut Store, note_local_id: NoteLocalID, tag: TagString) -> NoteUUID {
    return UUID::new(0);
}

pub fn tag_get_notes(store: &mut Store, tag: TagString) -> Vec<NoteLocalID> {}

//----------- Query

pub async fn query_get_notes(store: &mut Store, query_text: String) -> Vec<NoteLocalID> {}

//----------- Language Server

pub fn ls_extract_notes_from_text(
    input_text_label: String,
    input_text: String,
) -> Vec<NoteLocalID> {
}

pub fn ls_update_notes_in_text(input_text_label: String, input_text: String) -> String {}

//----------- Maintenance

pub fn purge_history(store: &mut Store, note_local_id: NoteLinkID) {}

pub fn purge_unreferenced_tags(store: &mut Store) {}

pub fn purge_unreferenced_notes(store: &mut Store) {}

pub fn purge_unreferenced_containers(store: &mut Store) {}

pub fn purge_unreferenced_links(store: &mut Store) {}
