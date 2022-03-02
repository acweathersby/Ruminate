#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod rumi_app {
    use difference::*;
    use lib_ruminate::primitives::uuid::UUID;
    use lib_ruminate::query::query::*;
    use lib_ruminate::store::store::*;
    use lib_ruminate::*;
    use log::{debug, info, LevelFilter, Metadata, Record};
    use stopwatch::*;
    use tauri::Manager;

    static mut GLOBAL_STORE: Option<Store> = None;

    #[tauri::command]
    pub fn init(data: String) {
        println!("{}", data);
        info!("Initializing stores");
    }

    #[tauri::command]
    pub fn create_note() -> u32 {
        if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
            return note_create(store);
        }
        return 0;
    }

    #[tauri::command]
    pub fn get_notes_from_query(query: String) -> Vec<NoteLocalID> {
        if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
            let string = query.as_str();
            execute_query(store, string)
        } else {
            vec![]
        }
    }

    #[tauri::command]
    pub fn set_note_name(note_local_id: u32, name: String) {
        if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
            note_set_name(store, note_local_id, &name);
        }
    }

    #[tauri::command]
    pub fn get_note_name(note_local_id: u32) -> String {
        if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
            return note_get_name(store, note_local_id);
        }

        "".to_string()
    }

    #[tauri::command]
    pub fn set_note_container_path(note_local_id: u32, container_path: String) {
        if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
            note_set_container_path(store, note_local_id, &container_path);
        }
    }

    #[tauri::command]
    pub fn get_note_container_path(note_local_id: u32) -> String {
        if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
            return note_get_container_path(store, note_local_id);
        }
        "".to_string()
    }

    #[tauri::command]
    pub fn get_local_id_from_uuid(uuid_string: String) -> u32 {
        if let Ok(uuid) = UUID::from(&uuid_string) {
            if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
                if let Some(local_id) = note_get_local_id_from_uuid(store, uuid) {
                    return local_id;
                }
            }
        }
        0
    }

    #[tauri::command]
    pub fn get_note_uuid_string(note_local_id: u32) -> String {
        if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
            if let Some(uuid) = note_get_uuid_from_local_id(store, note_local_id) {
                return uuid.to_string();
            }
        }
        String::from("")
    }

    #[tauri::command]
    pub fn get_tags() -> Vec<(String, u32)> {
        if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
            let tags = tag_get_tags(store);
            let out = Vec::from_iter(tags.iter().map(|v| (v.1.to_owned(), v.0)));
            return out;
        }
        vec![]
    }

    #[tauri::command]
    pub fn get_notes_from_tag(tag_string: String) -> Vec<NoteLocalID> {
        if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
            if let Some(note_ids) = tag_get_notes(store, &tag_string) {
                let out = Vec::from_iter(note_ids.iter().map(|f| f.to_owned()));
                return out;
            }
        }
        vec![]
    }

    #[tauri::command]
    pub fn add_tag(note_local_id: u32, tag_string: String) -> u32 {
        if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
            if let Ok(id) = tag_add(store, note_local_id, &tag_string) {
                return id;
            }
        }
        return 0;
    }

    #[tauri::command]
    pub fn remove_tag(note_local_id: u32, tag_string: String) -> bool {
        if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
            if let Ok(_) = tag_remove(store, note_local_id, &tag_string) {
                return true;
            }
        }
        return false;
    }

    #[tauri::command]
    pub fn get_tag_string(tag_local_id: u32) -> String {
        if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
            if let Some(string) = tag_get_string_from_tag(store, tag_local_id) {
                return string;
            }
        }
        String::from("")
    }

    #[tauri::command]
    pub fn get_tag_ids(note_local_id: u32) -> Vec<u32> {
        if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
            if let Some(a) = tag_get_tags_from_note(store, note_local_id) {
                return Vec::from_iter(a.iter().map(|tag| *tag));
            }
        }
        vec![]
    }
    use similar::{ChangeTag, TextDiff};
    #[tauri::command]
    pub fn merge_text(note_local_id: u32, string: String) -> bool {
        if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
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
                                note_insert_text(store, note_local_id, offset, val);
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
                    println!("{}", &get_text(note_local_id));
                    println!("-================================================-");
                }
                return true;
            }
        }
        false
    }

    #[tauri::command]
    pub fn insert_text(note_local_id: u32, insert_index: u32, string: String) -> bool {
        if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
            if let Ok(_) = note_insert_text(store, note_local_id, insert_index as usize, &string) {
                return true;
            }
        }

        false
    }

    #[tauri::command]
    pub fn delete_text(note_local_id: u32, insert_index: u32, count: u32) -> bool {
        if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
            if let Ok(_) = note_delete_text(store, note_local_id, insert_index as usize, count) {
                return true;
            }
        }
        false
    }
    #[tauri::command]
    pub fn get_text(note_local_id: u32) -> String {
        if let Some(store) = unsafe { GLOBAL_STORE.as_mut() } {
            if let Some(string) = note_get_text(store, note_local_id) {
                return string;
            }
        }
        String::from("")
    }

    // Updates a note's data store with differences found in the input string and
    // the note's data.
    // Input string should be the full note text as it appears to the user.
    #[tauri::command]
    pub fn update_note_text(note_local_id: u32, new_text: String) -> bool {
        false
    }

    pub fn main() {
        tauri::Builder::default()
            .setup(|_app| {
                log::set_max_level(LevelFilter::Debug);
                unsafe { GLOBAL_STORE = Some(store_create()) };

                let rumi_note = create_note();

                if rumi_note > 0 {
                    if insert_text(
                        rumi_note,
                        0,
                        "
Welcome to Ruminate. {{chocolate}}
                    "
                        .to_string(),
                    ) {
                        set_note_name(rumi_note, "Tutorial".to_string());
                        set_note_container_path(rumi_note, "/".to_string());

                        println!("Loaded base note {:?}", rumi_note)
                    } else {
                        println!("Unable to load introduction note")
                    }
                }

                #[cfg(debug_assertions)]
                add_debug_components();

                Ok(())
            })
            .invoke_handler(tauri::generate_handler![
                init,
                create_note,
                get_local_id_from_uuid,
                get_note_uuid_string,
                get_tags,
                get_notes_from_tag,
                add_tag,
                remove_tag,
                get_tag_string,
                get_tag_ids,
                merge_text,
                insert_text,
                delete_text,
                get_text,
                set_note_name,
                get_note_name,
                set_note_container_path,
                get_note_container_path
            ])
            .run(tauri::generate_context!())
            .expect("error while running tauri application");
    }

    fn add_debug_components() {
        // Build test notes

        //Adds basic debug note.
        let debug_note = create_note();
        set_note_name(debug_note, "Debug Note".to_string());
        set_note_container_path(debug_note, "/debug/".to_string());
        insert_text(
            debug_note,
            0,
            String::from(
                "
# Debug note
",
            ),
        );

        //Adds long form note.
        let long_form_note = create_note();
        set_note_name(long_form_note, "Longform Note".to_string());
        set_note_container_path(long_form_note, "/debug/".to_string());
        insert_text(
              long_form_note,
              0,
              String::from(
                  "
# Why Hello there!

If you are viewing this note then you are working in the 
debug mode of Mem. 

# This is a test note 

Our bluetooth earbuds adopt the most advanced Bluetooth 5.0 technology which provided more stable connection 
(connection distance up to 50ft), faster paring(just need 2 seconds ) and universal compatibility. 
Suitable for all models of mobile phones. Only need to take out two earbuds or any single earbud after 
you open Bluetooth function, they will open and connect automatically you phone, pc and android smartphones!


Our bluetooth earbuds adopt the most advanced Bluetooth 5.0 technology which provided more stable connection 
(connection distance up to 50ft), faster paring(just need 2 seconds ) and universal compatibility. 
Suitable for all models of mobile phones. Only need to take out two earbuds or any single earbud after 
you open Bluetooth function, they will open and connect automatically you phone, pc and android smartphones!

Our bluetooth earbuds adopt the most advanced Bluetooth 5.0 technology which provided more stable connection 
(connection distance up to 50ft), faster paring(just need 2 seconds ) and universal compatibility. 
Suitable for all models of mobile phones. Only need to take out two earbuds or any single earbud after 
you open Bluetooth function, they will open and connect automatically you phone, pc and android smartphones!

Our bluetooth earbuds adopt the most advanced Bluetooth 5.0 technology which provided more stable connection 
(connection distance up to 50ft), faster paring(just need 2 seconds ) and universal compatibility. 
Suitable for all models of mobile phones. Only need to take out two earbuds or any single earbud after 
you open Bluetooth function, they will open and connect automatically you phone, pc and android smartphones!

Our bluetooth earbuds adopt the most advanced Bluetooth 5.0 technology which provided more stable connection 
(connection distance up to 50ft), faster paring(just need 2 seconds ) and universal compatibility. 
Suitable for all models of mobile phones. Only need to take out two earbuds or any single earbud after 
you open Bluetooth function, they will open and connect automatically you phone, pc and android smartphones!
Our bluetooth earbuds adopt the most advanced Bluetooth 5.0 technology which provided more stable connection 
(connection distance up to 50ft), faster paring(just need 2 seconds ) and universal compatibility. 
Suitable for all models of mobile phones. Only need to take out two earbuds or any single earbud after 
you open Bluetooth function, they will open and connect automatically you phone, pc and android smartphones!Our bluetooth earbuds adopt the most advanced Bluetooth 5.0 technology which provided more stable connection 
(connection distance up to 50ft), faster paring(just need 2 seconds ) and universal compatibility. 
Suitable for all models of mobile phones. Only need to take out two earbuds or any single earbud after 
you open Bluetooth function, they will open and connect automatically you phone, pc and android smartphones!
Our bluetooth earbuds adopt the most advanced Bluetooth 5.0 technology which provided more stable connection 
(connection distance up to 50ft), faster paring(just need 2 seconds ) and universal compatibility. 
Suitable for all models of mobile phones. Only need to take out two earbuds or any single earbud after 
you open Bluetooth function, they will open and connect automatically you phone, pc and android smartphones!
Our bluetooth earbuds adopt the most advanced Bluetooth 5.0 technology which provided more stable connection 
(connection distance up to 50ft), faster paring(just need 2 seconds ) and universal compatibility. 
Suitable for all models of mobile phones. Only need to take out two earbuds or any single earbud after 
you open Bluetooth function, they will open and connect automatically you phone, pc and android smartphones!
Our bluetooth earbuds adopt the most advanced Bluetooth 5.0 technology which provided more stable connection 
(connection distance up to 50ft), faster paring(just need 2 seconds ) and universal compatibility. 
Suitable for all models of mobile phones. Only need to take out two earbuds or any single earbud after 
you open Bluetooth function, they will open and connect automatically you phone, pc and android smartphones!
Our bluetooth earbuds adopt the most advanced Bluetooth 5.0 technology which provided more stable connection 
(connection distance up to 50ft), faster paring(just need 2 seconds ) and universal compatibility. 
Suitable for all models of mobile phones. Only need to take out two earbuds or any single earbud after 
you open Bluetooth function, they will open and connect automatically you phone, pc and android smartphones!
Our bluetooth earbuds adopt the most advanced Bluetooth 5.0 technology which provided more stable connection 
(connection distance up to 50ft), faster paring(just need 2 seconds ) and universal compatibility. 
Suitable for all models of mobile phones. Only need to take out two earbuds or any single earbud after 
you open Bluetooth function, they will open and connect automatically you phone, pc and android smartphones!
Our bluetooth earbuds adopt the most advanced Bluetooth 5.0 technology which provided more stable connection 
(connection distance up to 50ft), faster paring(just need 2 seconds ) and universal compatibility. 
Suitable for all models of mobile phones. Only need to take out two earbuds or any single earbud after 
you open Bluetooth function, they will open and connect automatically you phone, pc and android smartphones!
",
              ),
          );

        println!("DEBUG MODE notes added!");
    }
}

fn main() {
    rumi_app::main();
}
