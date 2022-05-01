use crate::globals::get_store;

use super::globals::{GLOBAL_STORE};
use super::store::{load_notes, schedule_note_update};
use difference::*;
use lib_ruminate::primitives::{NoteData, NoteLocalID};
use lib_ruminate::primitives::uuid::UUID;
use lib_ruminate::query::query::*;
use lib_ruminate::store::store::*;
use lib_ruminate::*;
use log::{debug, info, LevelFilter, Metadata, Record};
use stopwatch::*;
use tauri::Manager;

#[tauri::command]
pub fn init(data: String) {
    println!("{}", data);
    info!("Initializing stores");
}

#[tauri::command]
pub fn create_note() -> NoteLocalID {

    if let Some(store) = get_store() {

        return note_create_text(store);
    }

    return 0;
}


/// Retrieve a Vector of local note ids that are matched from the
/// given query string.
#[tauri::command]
pub async fn get_notes_from_query(query: String) -> Vec<NoteLocalID> {

    if let Some(store) = get_store() {

        let string = query.as_str();

        execute_query(store, string)
    } else {

        vec![]
    }
}

/// Return the most recent clock value from the givin note, ignoring
/// site component.
#[tauri::command]
pub async fn get_note_clock(note_local_id: NoteLocalID) -> u32 {

    if let Some(store) = get_store() {

        note_get_clock(store, note_local_id).get_clock()
    } else {

        0
    }
}

#[tauri::command]
pub fn set_note_name(note_local_id: NoteLocalID, name: String) {

    if let Some(store) = get_store() {

        note_set_name(store, note_local_id, &name);
    }
}

#[tauri::command]
pub fn get_note_name(note_local_id: NoteLocalID) -> String {

    if let Some(store) = get_store() {

        return note_get_name(store, note_local_id);
    }

    "".to_string()
}

#[tauri::command]
pub fn get_local_id_from_uuid(uuid_string: String) -> u32 {
    
    if let Ok(uuid) = UUID::from(&uuid_string) {
    
        if let Some(store) = get_store() {
    
            if let Some(local_id) = note_get_local_id_from_uuid(store, uuid) {
    
                return local_id;
            }
        }
    }

    0
}

#[tauri::command]
pub fn get_note_uuid_string(note_local_id: NoteLocalID) -> String {
    
    if let Some(store) = get_store() {
    
        if let Some(uuid) = note_get_uuid_from_local_id(store, note_local_id) {
    
            return uuid.to_string();
        }
    }

    String::from("")
}

use similar::{ChangeTag, TextDiff};

#[tauri::command]
pub async fn merge_text(note_local_id: NoteLocalID, string: String) -> bool {

    if let Some(store) = get_store() {

        if let Some(old_string) = note_get_text(store, note_local_id) {

            let mut sw_diff = Stopwatch::new();

            let mut sw_note = Stopwatch::new();

            sw_diff.start();

            let diffs = TextDiff::from_lines(&old_string, &string);

            let mut offset = 0;

            sw_diff.stop();

            sw_note.start();

            for diff in diffs.iter_all_changes() {

                if let Some(val) = diff.as_str() {

                    match diff.tag() {

                        ChangeTag::Equal => offset += val.len(),

                        ChangeTag::Insert => {
                            note_insert_text(store, note_local_id, offset, val.as_bytes());
                            offset += val.len();
                        }

                        ChangeTag::Delete => {
                            note_delete_text(store, note_local_id, offset, val.len() as u32);
                        }
                    }
                }
            }
            
            sw_note.stop();

            #[cfg(debug_assertions)]
            {
                println!("+================================================-");
                println!(
                    "Diff: {}ms Note: {}ms",
                    sw_diff.elapsed_ms(),
                    sw_note.elapsed_ms()
                );
                println!("clock: {:?}", note_get_clock(store, note_local_id));
                println!("+================================================-");
                println!("{}", &string);
                println!("--------------------------------------------------");
                println!("{}", &note_get_text(store, note_local_id).unwrap());
                println!("-================================================-");
            }
            return true;
        }
    }
    false
}

#[tauri::command]
pub async fn get_note_type(note_local_id: NoteLocalID) -> String {
    if let Some(store) = get_store() {
        if let Some(data) = note_get_raw_data(store, note_local_id){
            return match data {
                NoteData::BINARY(bin) => String::from("bin"),
                NoteData::CRDT(crdt) => String::from("crdt")
            }
        }
    }
    String::from("")
}

#[tauri::command]
pub async fn debug_print_note(note_local_id: NoteLocalID, comment: String) -> bool {
    if let Some(store) = get_store() {
        if let Some(data) = note_get_raw_data(store, note_local_id){
            match data {
                NoteData::BINARY(bin) => {
                    #[cfg(debug_assertions)]
                    {
                        println!("+Debug Binary Note Print================================-");
                        println!("{}", comment);
                        println!("num of bytes: {}", bin.len());
                        println!("-================================================-");
                    }
                },
                NoteData::CRDT(crdt) => {
                    #[cfg(debug_assertions)]
                    {
                        println!("+Debug Note Print================================-");
                        println!("{}", comment);
                        println!("-- clock: {:?} --", note_get_clock(store, note_local_id));
                        println!("{:?}", &crdt);
                        println!("-================================================-");
                    }
                }
            }
            return true;
        }
    }
    false
}


#[tauri::command]
pub async fn get_binary(note_local_id: NoteLocalID) -> Vec<u8> {
    if let Some(store) = get_store() {
        if let Some(data) = note_get_binary(store, note_local_id) {
            return data
        }
    }
    vec![]
}

#[tauri::command]
pub async fn set_binary(note_local_id: NoteLocalID,data: Vec<u8>) -> bool{
    if let Some(store) = get_store() {
        if let Ok(_) = note_set_binary(store, note_local_id, &data) {
            return true
        }
    }
    false
}

#[tauri::command]
pub async fn insert_text(note_local_id: NoteLocalID, insert_index: u32, string: String) -> bool {

    if let Some(store) = get_store() {

        if let Ok(_) = note_insert_text(store, note_local_id, insert_index as usize, string.as_bytes()) {

            schedule_note_update(note_local_id);

            return true;
        }
    }

    false
}

#[tauri::command]
pub async fn delete_text(note_local_id: NoteLocalID, insert_index: u32, count: u32) -> bool {
    
    if let Some(store) = get_store() {
    
        if let Ok(_) = note_delete_text(store, note_local_id, insert_index as usize, count) {
    
            schedule_note_update(note_local_id);

            return true;
        }
    }

    false
}

#[tauri::command]
pub async fn get_text(note_local_id: NoteLocalID) -> String {

    if let Some(store) = get_store() {

        if let Some(string) = note_get_text(store, note_local_id) {

            return string;
        }
    }

    String::from("")
}


/*
    Containers ------------------------------------------------------------------------------
*/


#[tauri::command]
pub fn add_note_to_container_path(note_local_id: NoteLocalID, container_path: String) {
    
    if let Some(store) = get_store() {

        store.containers.add(container_path.as_str(), note_local_id);
    }
}

#[tauri::command]
pub async fn query_note_container_paths(note_local_id: NoteLocalID) -> Vec<String> {

    let mut strings = vec![];

    if let Some(store) = get_store() {

        store.containers.search(|level, path, node|{
            
            if node.entries.contains(&note_local_id) {
                strings.push(path.clone());
            }

            primitives::container::SearchResult::Push
        });
    }

    return strings;
}

#[tauri::command]
pub fn remove_note_from_container_path(note_local_id: NoteLocalID, container_path: String) -> bool{
    
    if let Some(store) = get_store() {
        store.containers.remove(container_path.as_str(), note_local_id).is_ok()
    }else {
        false
    }
}

#[tauri::command]
pub async fn query_child_paths_from_parent_container(parent_container: String) -> Vec<String>{
    if let Some(store) = get_store() {
        if let Some(result) = store.containers.get_nodes(&parent_container){
            let mut strings = vec![];
            if result.len() > 0{
                for (string,_) in result{
                    strings.push(string.clone());
                }
                strings
            }else { vec!["none"]}
        }else{ vec!["invalid"] }
    }else { vec!["invalid"] }
}

#[tauri::command]
pub async fn query_note_ids_from_container(parent_container: String) -> Vec<NoteLocalID>{

    let mut strings = vec![];

    if let Some(store) = get_store() {

        for node in store.containers.get(&parent_container){

            strings.push(node);
        }
    }

    return strings;
}

/*
    Tags ------------------------------------------------------------------------------------
*/
#[tauri::command]
pub fn get_tags() -> Vec<(String, u32)> {
    
    if let Some(store) = get_store() {
    
        let tags = tag_get_tags(store);
    
        let out = Vec::from_iter(tags.iter().map(|v| (v.1.to_owned(), v.0)));
    
        return out;
    }

    vec![]
}

#[tauri::command]
pub async fn get_notes_from_tag(tag_string: String) -> Vec<NoteLocalID> {
    
    if let Some(store) = get_store() {
    
        if let Some(note_ids) = tag_get_notes(store, &tag_string) {
    
            let out = Vec::from_iter(note_ids.iter().map(|f| f.to_owned()));
    
            return out;
        }
    }

    vec![]
}

#[tauri::command]
pub async fn add_tag(note_local_id: NoteLocalID, tag_string: String) -> u32 {
    if let Some(store) = get_store() {
        if let Ok(id) = tag_add(store, note_local_id, &tag_string) {
            return id;
        }
    }
    return 0;
}

#[tauri::command]
pub async fn remove_tag(note_local_id: NoteLocalID, tag_string: String) -> bool {
    if let Some(store) = get_store() {
        if let Ok(_) = tag_remove(store, note_local_id, &tag_string) {
            return true;
        }
    }
    return false;
}

#[tauri::command]
pub async fn get_tag_string(tag_local_id: u32) -> String {
    
    if let Some(store) = get_store() {
    
        if let Some(string) = tag_get_string_from_tag(store, tag_local_id) {
    
            return string;
        }
    }
    
    String::from("")
}

#[tauri::command]
pub async fn get_tag_ids(note_local_id: NoteLocalID) -> Vec<u32> {
    
    if let Some(store) = get_store() {
    
        if let Some(a) = tag_get_tags_from_note(store, note_local_id) {
    
            return Vec::from_iter(a.iter().map(|tag| *tag));
        }
    }
    
    vec![]
}


#[cfg(test)]
mod tests {

    use crate::globals::init_store;

        
    #[test]
    fn test_get_tag_ids() {
        
        init_store();


    }
}
