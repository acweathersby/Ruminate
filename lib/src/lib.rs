
#![feature(path_try_exists)]
#![feature(trait_alias)]

/**
 * Ruminate Library
 *
 * Copyright 2022 Anthony C Weathersby
 *
 * All rights reserved
 *
 * See License at ../../LICENSE.md
 *
 * If license was not provided with this distribution then refer to
 * github.com/acweathersby/ruminate/LICENSE.md
 */




//Query System
pub mod query;

//---
pub mod primitives;
pub mod store;
pub mod store_fs;

use std::{collections::HashSet, iter::FromIterator, result::Result, str::FromStr};

use log::debug;
use primitives::{crdt::op_id::OPID, uuid::UUID, NoteData, crdt::{CRDTString, CRDTData}, NoteLocalID, NoteUUID, TagString, SiteUUID, SiteLocalID, NoteLinkID, TagLocalID, note};

use store::store::*;

type NotePackage<T> = (
    NoteUUID,
    NoteData<T>,
    Vec<TagString>
);

/// Initializes a new store for notes
pub fn store_create<T: CRDTData>() -> Store<T> {
    debug!(target:"store actions", "Creating new Store");
    Store::new()
}

pub fn store_import_note_package<T: CRDTData>(store: &mut Store<T>, note_package: NotePackage<T>) {}

pub fn store_create_note_package<T: CRDTData>(
    store: &mut Store<T>,
    note_local_id: NoteLocalID,
) -> Option<NotePackage<T>> {
    None
}

pub fn store_get_notes<T: CRDTData>(store: &mut Store<T>) -> Result<Vec<NoteLocalID>, &'static str> {
    Err("Test")
}

pub fn store_get_self_site_uuid<T: CRDTData>(store: &mut Store<T>) -> SiteUUID {
    SiteUUID::new(0)
}

pub fn store_get_local_site_id<T: CRDTData>(store: &mut Store<T>) -> SiteLocalID {
    0
}

pub fn store_get_uuid_from_site_id<T: CRDTData>(store: &mut Store<T>, site_local_id: SiteUUID) -> SiteLocalID {
    0
}

//----------- NOTES

///
/// Creates a new new note and returns the local id for that note.
///
pub fn note_create_text<T: CRDTData>(store: &mut Store<T>) -> NoteLocalID {
    //Create the CRDT Base structure and note UUID

    debug!(target:"note actions", "Creating new Note");

    let local_site_id: u32 = 1;

    let new_note_uuid = NoteUUID::new(local_site_id);

    let new_note_local_id: u32 = (store.note_uuid_to_local_id.len() + 1) as u32;

    let new_note_data = Box::new(NoteData::<T>::CRDT(CRDTString::<T>::new(local_site_id)));

    debug!(target:"note actions", "Note created with {:?} and local id [{:?}]",new_note_uuid, new_note_local_id);

    store
        .note_uuid_to_local_id
        .insert(new_note_uuid, new_note_local_id);

    store
        .note_local_id_to_uuid
        .insert(new_note_local_id, new_note_uuid);

    store
        .note_id_to_note_content
        .insert(new_note_local_id, new_note_data);

    return new_note_local_id;
}


#[test]
fn test_note_create_text(){
    let mut store = Store::<u8>::new();
    assert_eq!(note_create_text(&mut store), 1);
    assert_eq!(note_create_text(&mut store), 2);
}

pub fn note_create_binary<T: CRDTData>(store: &mut Store<T>) -> NoteLocalID {
    //Create the CRDT Base structure and note UUID

    debug!(target:"note actions", "Creating new Note");

    let local_site_id: u32 = 1;

    let new_note_uuid = NoteUUID::new(local_site_id);

    let new_note_local_id: u32 = (store.note_uuid_to_local_id.len() + 1) as u32;

    let new_note_data = Box::new(NoteData::<T>::BINARY(Vec::<u8>::new()));

    debug!(target:"note actions", "Note created with {:?} and local id [{:?}]",new_note_uuid, new_note_local_id);

    store
        .note_uuid_to_local_id
        .insert(new_note_uuid, new_note_local_id);

    store
        .note_local_id_to_uuid
        .insert(new_note_local_id, new_note_uuid);

    store
        .note_id_to_note_content
        .insert(new_note_local_id, new_note_data);

    return new_note_local_id;
}

#[test]
fn test_note_create_binary(){
    let mut store = Store::<u8>::new();
    assert_eq!(note_create_binary(&mut store), 1);
    assert_eq!(note_create_binary(&mut store), 2);
}

pub fn note_create_from_parts<T: CRDTData>(
    store: &mut Store<T>,
    new_note_uuid: NoteUUID, 
    new_note_data: NoteData<T>
) -> NoteLocalID {
    //Create the CRDT Base structure and note UUID

    debug!(target:"note actions", "Creating new Note from parts");

    let new_note_local_id: u32 = (store.note_uuid_to_local_id.len() + 1) as u32;

    let new_note_data = Box::new(new_note_data);

    debug!(target:"note actions", "Note created with {:?} and local id [{:?}]",new_note_uuid, new_note_local_id);

    store
        .note_uuid_to_local_id
        .insert(new_note_uuid, new_note_local_id);

    store
        .note_local_id_to_uuid
        .insert(new_note_local_id, new_note_uuid);

    store
        .note_id_to_note_content
        .insert(new_note_local_id, new_note_data);

    return new_note_local_id;
}

//Returns a notes UUID from its local id
pub fn note_get_uuid_from_local_id<T: CRDTData>(
    store: &mut Store<T>,
    note_local_id: NoteLocalID,
) -> Option<NoteUUID> {
    if let Some(uuid) = store.note_local_id_to_uuid.get(&note_local_id) {
        return Some(uuid.to_owned());
    }
    None
}

pub fn note_get_local_id_from_uuid<T: CRDTData>(store: &mut Store<T>, note_uuid: NoteUUID) -> Option<NoteLocalID> {
    if let Some(local_id) = store.note_uuid_to_local_id.get(&note_uuid) {
        return Some(local_id.to_owned());
    }

    None
}

pub fn note_get_data<'a, T: CRDTData>(
    store: &'a Store<T>,
    note_local_id: NoteLocalID,
) -> Option<&'a NoteData<T>> {
    match store.note_id_to_note_content.get(&note_local_id) {
        Some(data) => Some(data.as_ref()),
        None => None,
    }
}

#[test]
fn test_note_get_data(){
    let mut store = Store::<u8>::new();
    
    assert_eq!(note_create_binary(&mut store), 1);
    assert!(note_get_data(&mut store, 1).is_some());

    assert_eq!(note_create_text(&mut store), 2);
    assert!(note_get_data(&mut store, 2).is_some());

    assert!(note_get_data(&mut store, 44).is_none());
}

pub fn note_get_data_mut<'a, T: CRDTData>(
    store: &'a mut Store<T>,
    note_local_id: NoteLocalID,
) -> Option<&'a mut NoteData<T>> {
    match store.note_id_to_note_content.get_mut(&note_local_id) {
        Some(data) => Some(data.as_mut()),
        None => None,
    }
}

#[test]
fn test_note_get_data_mut(){
    let mut store = Store::<u8>::new();
    
    assert_eq!(note_create_binary(&mut store), 1);
    assert!(note_get_data_mut(&mut store, 1).is_some());

    assert_eq!(note_create_text(&mut store), 2);
    assert!(note_get_data_mut(&mut store, 2).is_some());

    assert!(note_get_data_mut(&mut store, 44).is_none());
}

pub fn note_get_clock<T: CRDTData>(store: &Store<T>, note_local_id: NoteLocalID) -> OPID {
    //Load the note CRDT
    if let Some(note_data) = note_get_data::<T>(store, note_local_id) {
        match note_data {
            NoteData::BINARY(_)=>OPID::new(0, 0),
            NoteData::CRDT(data)=>data.get_local_clock()
        }
    }else {
        OPID::new(0, 0)
    }
}

pub fn note_get_raw_data<'a, T:CRDTData>(store: &'a Store<T>, note_local_id: NoteLocalID) -> Option<&'a NoteData<T>>{
    return  note_get_data::<T>(store, note_local_id);
}

pub fn note_get_text<T: CRDTData>(store: &mut Store<T>, note_local_id: NoteLocalID) -> Option<String> {
    if let Some(note_data) = note_get_data::<T>(store, note_local_id) {
        match note_data {
            NoteData::<T>::BINARY(_)=>None,
            NoteData::<T>::CRDT(data)=>if let Ok(string) = String::from_utf8(data.utf8()){
                Some(string)
            }else {
                None
            }
        }
    }else {
        None
    }
}

pub fn note_get_binary<T: CRDTData>(store: &mut Store<T>, note_local_id: NoteLocalID) -> Option<Vec<u8>> {
    if let Some(note_data) = note_get_data::<T>(store, note_local_id) {
        match note_data {
            NoteData::<T>::BINARY(data)=>Some(data.clone()),
            NoteData::<T>::CRDT(data)=>Some(data.utf8())
        }
    }else {
        None
    }
}

pub fn note_set_binary<T: CRDTData>(store: &mut Store<T>, note_local_id: NoteLocalID, data:&Vec<u8>) -> Result<(), ()> {
    if let Some(note_data) = note_get_data_mut::<T>(store, note_local_id) {
        match note_data {
            NoteData::<T>::BINARY(note_data)=>{
                note_data.clear();
                note_data.append(&mut data.clone());
                Ok(())
            },
            NoteData::<T>::CRDT(data)=>Err(())
        }
    }else {
        Err(())
    }
}

pub fn note_set_name<T: CRDTData>(store: &mut Store<T>, note_local_id: NoteLocalID, name: &str) {
    store
        .note_id_to_name
        .insert(note_local_id, name.to_string());
}

pub fn note_get_name<T: CRDTData>(store: &mut Store<T>, note_local_id: NoteLocalID) -> String {
    if let Some(name) = store.note_id_to_name.get(&note_local_id) {
        name.to_owned()
    } else {
        "!!undefined!!".to_string()
    }
}

pub fn note_set_container_path<T: CRDTData>(store: &mut Store<T>, note_local_id: NoteLocalID, path: &str) {
    store.containers.add(path, note_local_id);
}

pub fn note_remove_container_path<T: CRDTData>(store: &mut Store<T>, note_local_id: NoteLocalID, path: &str) {
    store.containers.remove(path, note_local_id);
}

pub fn note_get_container_path<T: CRDTData>(store: &mut Store<T>, note_local_id: NoteLocalID) -> String {
    if let Some(path) = store.note_id_to_container_path.get(&note_local_id) {
        path.to_owned()
    } else {
        "".to_string()
    }
}

pub fn note_get_text_at_clock<T: CRDTData>(
    store: &mut Store<T>,
    note_local_id: NoteLocalID,
    clock: u32,
) -> Option<String> {
    None
}

pub fn note_insert_text<T: CRDTData>(
    store: &mut Store<T>,
    note_local_id: NoteLocalID,
    index: usize,
    text: &[T],
) -> Result<(), &'static str> {
    debug!(target:"note actions", "Inserting text [{:?}] at index {:?} into Note [{:?}]", text, index, note_local_id);
    if let Some(note_data) = note_get_data_mut(store, note_local_id) {
        match note_data {
            NoteData::<T>::BINARY(_)=>Err("Note is binary data, not a CRDT"),
            NoteData::<T>::CRDT(data)=>{
                data.insert(index, text);
                Ok(())
            }
        }
        
    } else { 
        Err("Failed to write to CRDT") 
    }
}

pub fn note_delete_text<T: CRDTData>(
    store: &mut Store<T>,
    note_local_id: NoteLocalID,
    index: usize,
    count: u32,
) -> Result<(), &'static str> {
    debug!(target:"note actions", "Removing [{:?}] characters starting at index {:?} from Note [{:?}]", count, index, note_local_id);
    if let Some(note_data) = note_get_data_mut(store, note_local_id) {
        match note_data {
            NoteData::<T>::BINARY(_)=>Err("Note is binary data, not a CRDT"),
            NoteData::<T>::CRDT(data)=>{
                data.delete(index, count);
                Ok(())
            }
        }
    }else{
        return Err("Failed to write to CRDT");
    }
}

pub fn note_merge_data<T: CRDTData>(store: &mut Store<T>, note_local_id: NoteLinkID, foreign_note: NotePackage<T>) {}

//----------- Links / Query

pub fn link_create<T: CRDTData>(
    store: &mut Store<T>,
    note_local_id: NoteLinkID,
    index: usize,
    lnk_text: String,
) -> Option<NoteLinkID> {
    None
}

pub fn link_update<T: CRDTData>(store: &mut Store<T>, link_id: NoteLinkID, link_text: String) -> bool {
    false
}

pub fn link_get_notes<T: CRDTData>(store: &mut Store<T>, link_id: NoteLinkID) -> Option<Vec<NoteLocalID>> {
    None
}

pub fn link_get_links_from_note<T: CRDTData>(store: &mut Store<T>, link_id: NoteLinkID) -> Option<Vec<NoteLinkID>> {
    None
}

//----------- TAGS
/**
 * TODO: Rebuild this section using string hashes
 */
pub fn tag_add<T: CRDTData>(
    store: &mut Store<T>,
    note_local_id: NoteLocalID,
    tag: &str,
) -> Result<TagLocalID, &'static str> {
    debug!(target:"tag actions", "Adding Tag [{:?}] to Note [{:?}]", tag, note_local_id);

    //Check to see if tag already exists
    if let Ok(string) = String::from_str(tag) {
        if !store.tag_string_to_id.contains_key(&string) {
            //Lock access to tag stores at this point

            debug!(target:"tag actions", "Tag [{:?}] does not exist, creating storage support for new tag", tag);

            let tag_local_id = (store.tag_string_to_id.len() + 1) as u32;

            store.tag_id_to_string.insert(tag_local_id, string.clone());

            store.tag_string_to_id.insert(string.clone(), tag_local_id);

            store
                .tag_id_to_note_id_list
                .insert(tag_local_id, HashSet::new());
        }

        if let Some(tag_local_id) = store.tag_string_to_id.get(&string) {
            if let Some(note_id_list) = store.tag_id_to_note_id_list.get_mut(tag_local_id) {
                note_id_list.insert(note_local_id);
            }

            if !store.note_id_to_tag_id_list.contains_key(&note_local_id) {
                store
                    .note_id_to_tag_id_list
                    .insert(note_local_id, HashSet::new());
            }
            if let Some(tag_id_list) = store.note_id_to_tag_id_list.get_mut(&note_local_id) {
                tag_id_list.insert(*tag_local_id);
            }

            return Ok(*tag_local_id);
        }
    }
    return Err("Failed to create tag string");
}

pub fn tag_remove<T: CRDTData>(
    store: &mut Store<T>,
    note_local_id: NoteLocalID,
    tag: &str,
) -> Result<(), &'static str> {
    //Check to see if tag already exists
    debug!(target:"tag actions", "Removing Tag [{:?}] to Note [{:?}]", tag, note_local_id);
    let mut complete_removal = true;

    if let Ok(string) = String::from_str(tag) {
        if !store.tag_string_to_id.contains_key(&string) {
            debug!(target:"tag actions", "Tag [{:?}] does not exist, aborting", tag);
            return Ok(());
        }

        if let Some(tag_local_id) = store.tag_string_to_id.get(&string) {
            if let Some(note_id_list) = store.tag_id_to_note_id_list.get_mut(tag_local_id) {
                complete_removal &= note_id_list.remove(&note_local_id);
            } else {
                complete_removal &= false;
            }
            if let Some(tag_id_list) = store.note_id_to_tag_id_list.get_mut(&note_local_id) {
                complete_removal &= tag_id_list.remove(tag_local_id);
            } else {
                complete_removal &= false;
            }
        }
    }

    if !complete_removal {
        return Err("Failed to completely remove tag from note");
    }

    return Ok(());
}

pub fn tag_get_notes<T: CRDTData>(store: &mut Store<T>, tag: &str) -> Option<Vec<NoteLocalID>> {
    debug!(target:"tag actions", "Retrieving note list from Tag [{:?}] ", tag);
    if let Ok(string) = String::from_str(tag) {
        if let Some(tag_local_id) = store.tag_string_to_id.get(&string) {
            if let Some(note_id_list) = store.tag_id_to_note_id_list.get_mut(tag_local_id) {
                let vector = Vec::from_iter(note_id_list.iter().map(|a| a.clone()));
                debug!(target:"tag actions", "Retrieved note list for Tag [{:?}] - List contains ${:?} notes", tag, vector.len());
                return Some(vector);
            }
        }
    }
    debug!(target:"tag actions", "Could not retrieve note list for Tag [{:?}] ", tag);
    None
}

pub fn tag_get_tags_from_note<T: CRDTData>(
    store: &mut Store<T>,
    note_local_id: NoteLocalID,
) -> Option<Vec<TagLocalID>> {
    debug!(target:"tag actions", "Retrieving tag list from Note [{:?}] ", note_local_id);
    if let Some(tag_id_list) = store.note_id_to_tag_id_list.get_mut(&note_local_id) {
        let vector = Vec::from_iter(tag_id_list.iter().map(|a| a.clone()));
        debug!(target:"tag actions", "Retrieved tag list for Note [{:?}] - List contains {:?} tags", note_local_id, vector.len());
        return Some(vector);
    }

    None
}

pub fn tag_get_string_from_tag<T: CRDTData>(store: &mut Store<T>, tag_local_id: TagLocalID) -> Option<String> {
    if let Some(tag_string) = store.tag_id_to_string.get(&tag_local_id) {
        return Some(tag_string.clone());
    }
    None
}

pub fn tag_get_tags<T: CRDTData>(store: &mut Store<T>) -> Vec<(TagLocalID, String)> {
    return Vec::from_iter(
        store
            .tag_id_to_string
            .iter()
            .map(|a| (a.0.clone(), a.1.clone())),
    );
}


//----------- Query

pub async fn query_get_notes<T: CRDTData>(store: &mut Store<T>, query_text: String) -> Option<Vec<NoteLocalID>> {
    None
}

//----------- Language Server

pub fn ls_extract_notes_from_text(
    input_text_label: String,
    input_text: String,
) -> Option<Vec<NoteLocalID>> {
    None
}

pub fn ls_update_notes_in_text(input_text_label: String, input_text: String) -> String {
    String::new()
}

//----------- Maintenance

pub fn purge_history<T: CRDTData>(store: &mut Store<T>, note_local_id: NoteLinkID) {}

pub fn purge_unreferenced_tags<T: CRDTData>(store: &mut Store<T>) {}

pub fn purge_unreferenced_notes<T: CRDTData>(store: &mut Store<T>) {}

pub fn purge_unreferenced_links<T: CRDTData>(store: &mut Store<T>) {}

#[cfg(test)]
mod tests {

    use super::*;

    use log::{LevelFilter, Metadata, Record};

    struct SimpleLogger;

    impl log::Log for SimpleLogger {
        fn enabled(&self, metadata: &Metadata) -> bool {
            true
        }

        fn log(&self, record: &Record) {
            println!("{} - {}", record.level(), record.args());
        }

        fn flush(&self) {}
    }
    static LOGGER: SimpleLogger = SimpleLogger;

    static mut LOGGER_INITIALIZED:bool = false;

    fn init_logging() {
        if ! unsafe { LOGGER_INITIALIZED } {
            if let Ok(_) = log::set_logger(&LOGGER) {
                log::set_max_level(LevelFilter::Debug);
                unsafe {LOGGER_INITIALIZED = true;}
            }
        }
    }
    
    #[test]
    fn test_store() {
        init_logging();

        let mut store = store_create::<u8>();

        let note_local_id = note_create_text::<u8>(&mut store);

        assert!(note_local_id > 0);
        
        if let Ok(()) = note_insert_text(&mut store, note_local_id, 0, " Test Data".as_bytes()) {
            if let Ok(()) = note_insert_text(&mut store, note_local_id, 0, "Test Data ".as_bytes()) {
                if let Some(string) = note_get_text(&mut store, note_local_id) {
                    if let Ok(str) = String::from_str("Test Data  Test Data") {
                        assert_eq!(string, str);
                    }
                } else {
                    panic!("Failed to get note text")
                }
            }
        } else {
            panic!("Failed to write to CRDT")
        }
        
    }

    #[test]
    fn test_note_delete_data_tiny() {

        init_logging();

        let mut store = store_create::<u8>();

        let note_local_id = note_create_text::<u8>(&mut store);
        
        if let Ok(_) = note_insert_text(&mut store, note_local_id, 0, "Test Data".as_bytes()) {
            if let Ok(()) = note_delete_text(&mut store, note_local_id, 5, 4) {
                if let Some(string) = note_get_text(&mut store, note_local_id) {
                    if let Ok(str) = String::from_str("Test ") {
                        assert_eq!(string, str);
                    } else {
                        panic!("Failed to write to CRDT")
                    }
                } else {
                    panic!("Failed to write to CRDT")
                }
            }
        }
        
    }

    #[test]
    fn test_note_add_tag() {
        
        init_logging();
        

        let mut store = store_create::<u8>();

        let note_local_id = note_create_text::<u8>(&mut store);

        if let Ok(tag_id) = tag_add(&mut store, note_local_id, "Error") {
            //Tag should equal 1 as it is the first tag entered into the store
            assert_eq!(tag_id, 1);

            if let Some(a) = tag_get_tags_from_note(&mut store, note_local_id) {
                let note_strings = a
                    .iter()
                    .map(|tag| tag_get_string_from_tag(&mut store, *tag));

                assert_eq!(note_strings.len(), 1);

                for opt in note_strings {
                    match opt {
                        Some(a) => assert_eq!(a, "Error"),
                        None => panic!("Tag string could not be recovered"),
                    }
                }

                return;
            }
        }
        
        panic!("Could not retrieve tag applied to note")
    }
}
