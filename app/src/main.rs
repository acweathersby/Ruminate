#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
use tauri::Manager;

use crate::globals::init_store;


mod bridge;
mod store;
mod globals;
mod tests;



/// Pre-populates store with testing notes for 
/// UI/UX evaluation.`
fn add_debug_components() {
    
    use store::*;
    use bridge::*;
    // Build test notes

    //Adds basic debug note.
    let debug_note = create_note();
    set_note_name(debug_note, "Debug Note".to_string());
    add_note_to_container_path(debug_note, "/debug/".to_string());
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
    add_note_to_container_path(long_form_note, "/debug/".to_string());
    insert_text(
        long_form_note,
        0,
        String::from(
            "
# H1 Header

This is a simple paragraph. It only has two sentences.

## H2 Header

Some Lorem Ipsum for your pleasure: Lorem ipsum dolor sit amet, consectetur 
adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna 
aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris 
nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit 
in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur 
sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit 
anim id est laborum.

### H3 Header

The following is a link: [hello](D)

",
        ),
    );

    println!("DEBUG MODE notes added!");
}

fn main() {
    
    use store::*;
    use bridge::*;
    use log::{debug, info, LevelFilter, Metadata, Record};

    tauri::Builder::default()
        .setup(|_app| {

            init_store();

            log::set_max_level(LevelFilter::Debug);

            if let Err(err) = std::fs::create_dir_all(&get_main_path()){
                debug!("{}", err);
            }

            load_notes();

            #[cfg(debug_assertions)]
            add_debug_components();

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            init,
            create_note,
            get_note_clock,
            get_local_id_from_uuid,
            get_note_uuid_string,
            merge_text,
            insert_text,
            delete_text,
            get_text,
            set_note_name,
            get_note_name,
            debug_print_note,
            
            //Notes
            get_note_type,
            
            //Notes - Data
            get_binary,
            set_binary,
            
            //Containers
            add_note_to_container_path,
            remove_note_from_container_path,
            query_child_paths_from_parent_container,
            query_note_container_paths,
            query_note_ids_from_container,

            //Tags
            get_tags,
            get_notes_from_tag,
            add_tag,
            remove_tag,
            get_tag_string,
            get_tag_ids
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}