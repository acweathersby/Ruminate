use super::globals::{GLOBAL_STORE, DEFAULT_PATH, CRDTDataType};
use log::{debug, info, LevelFilter, Metadata, Record};
use lib_ruminate::store_fs::{ load, save, scan };
use lib_ruminate::primitives::uuid::UUID;
use lib_ruminate::query::query::*;
use lib_ruminate::store::store::*;
use lib_ruminate::*;

pub fn get_main_path() -> String {
    return String::from(unsafe { DEFAULT_PATH});
}

pub fn schedule_note_update(note_local_id: NoteLocalID) {

    //For now just save note data to file system.
    if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {

        if let Err(error) = save(&get_main_path(), note_local_id, store) {
            println!("{}", error);
        }else{
            debug!("Saving note")
        }
    }
}

pub fn load_notes() {

    if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {

        if let Ok(results) = scan(&get_main_path()){

            //TODO: Candidate for multi-threading - need to determine best way to 
            // approach shared stores such as the store tables. DONTEARLY!

            for note_path in results {
                
                if let Ok((uuid, data)) = load::<CRDTDataType>(&note_path){

                    note_create_from_parts(store,uuid, data);

                } else {
                    debug!("Could not candidate path {:?}", note_path);
                }
            }
        }
    }
}


