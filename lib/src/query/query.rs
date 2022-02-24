use crate::store::container::Container;
use crate::store::store::NoteLocalID;

use super::super::store::store::Store;
use super::super::UUID;
use super::ast::*;
use super::parser::*;
use std::collections::VecDeque;
use std::thread;

///
/// Execute a lookup query against a note store.
///
/// ```
/// println!("Hello World");
/// ```
pub fn execute_query(root_store: &Store, query_input: &str) -> Vec<NoteLocalID> {
    if let Ok(query) = parse(query_input) {
        // Reduce inputs to containers found within container portion. If this is
        // an infinite result then the entire store MUST be made available for
        // processing.

        // Select a set of candidate UUIDs based on the container clause of the query

        // Cases
        //      : length 1 -  Either wildcard and all matches at given level are selected,
        //                    or its a whole text match.
        //      : length 2+ - Text elements are separated by wild cards. Use fuzzy or strict
        //                    text matching to sequences. Subsequent matches MUST be found
        //                    after the end of the previous match offset.

        if let Some(ctr_ref) = &query.as_ref().container {
            //Stores references to all end node containers that have target notes.
            //*
            let ctr_ref = ctr_ref.as_ref();

            let ctr_store = &root_store.containers;

            let mut i = 0;

            let mut container_result: Vec<usize> = Vec::new();

            let mut container_queue: VecDeque<(usize, usize)> = VecDeque::from([(0, 0)]);

            let mut HAS_NOTE_SPECIFIER = false;

            loop {
                if let Some((ctr_id, path_ref)) = container_queue.pop_front() {
                    if path_ref >= ctr_ref.path.len() {
                        container_result.push(ctr_id);
                    } else {
                        let segment = &ctr_ref.path[path_ref];

                        if let Some(par_container) = ctr_store.containers.get(ctr_id) {
                            if let ASTNode::PathPart(part) = segment {
                                let part = part.as_ref();

                                if part.ids.len() == 1 {
                                    match &part.ids[0] {
                                        ASTNode::TextFrag(text) => {
                                            let text = &text.as_ref().val;
                                            for &ctr_id in &(par_container.containers) {
                                                if let Some(ctr) = ctr_store.containers.get(ctr_id)
                                                {
                                                    // Using direct matching
                                                    if &ctr.name == text {
                                                        container_queue
                                                            .push_back((ctr.id, path_ref + 1));
                                                    }
                                                }
                                            }
                                        }
                                        ASTNode::WildCard(_) => {
                                            for &ctr in &par_container.containers {
                                                container_queue.push_back((ctr, path_ref + 1));
                                            }
                                        }
                                        _ => println!("Undefined container path part."),
                                    }
                                } else {
                                }
                            }
                        }
                    }
                } else {
                    break;
                }
            }

            let mut IDs: Vec<NoteLocalID> = Vec::new();

            for ctr_id in container_result {
                if let Some(ctr) = ctr_store.containers.get(ctr_id) {
                    for &uuid in (&ctr.uuids).into_iter() {
                        if HAS_NOTE_SPECIFIER {
                        } else {
                            IDs.push(uuid);
                        }
                    }
                }
            }

            // Run filter on uuids

            // Sort uuids

            return IDs;
        }

        // Filter the set of UUIDs based on filter clause

        // Sort based sort clause
    }

    vec![]
}

#[test]
fn test_basic_container_query() {
    let mut root_store = Store::new();

    root_store
        .containers
        .createContainer("testA".to_string(), 0);

    root_store
        .containers
        .createContainer("testB".to_string(), 0);

    root_store
        .containers
        .createContainer("testC".to_string(), 1);

    root_store.containers.containers[3].uuids.insert(1);

    execute_query(&root_store, "[testA/testC/]");
}
