use super::super::primitives::uuid::UUID;
use std::collections::HashSet;

///
/// POD used to model the hierarchal relationship of notes
///
pub struct Container {
    pub id: usize,
    pub parent_id: usize,
    pub name: String,
    pub uuids: HashSet<UUID>,
    pub containers: Vec<usize>,
}

pub struct ContainerStore {
    pub containers: Vec<Container>,
}

impl ContainerStore {
    pub fn new() -> ContainerStore {
        ContainerStore {
            containers: vec![Container {
                id: 0,
                parent_id: 0,
                name: "__Root__".to_string(),
                uuids: HashSet::new(),
                containers: Vec::new(),
            }],
        }
    }

    pub fn getContainer() {}

    pub fn deleteContainer() {}

    /// Creates and stores new container in the ContainerStore. Appends
    /// the new container's id to the `containers` list of the parent container
    /// identified by `parent_id`.
    ///
    /// If there is no container found at `parent_id` then an
    /// error is raised.  
    ///
    /// ```
    /// # use lib_ruminate::store::container::ContainerStore;
    /// # let mut store = ContainerStore::new();
    ///
    /// store.createContainer("Sub Container".to_string(), 0);
    /// ```
    ///
    pub fn createContainer(&mut self, name: String, mut parent_id: usize) {
        let id = self.containers.len();

        if let Some(ctr) = self.containers.get_mut(parent_id) {
            parent_id = ctr.id;
            ctr.containers.push(id);
        } else {
        }

        self.containers.push(Container {
            id: id,
            parent_id: parent_id,
            name,
            uuids: HashSet::new(),
            containers: Vec::new(),
        });
    }
}
