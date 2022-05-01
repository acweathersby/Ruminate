use std::collections::{HashMap, HashSet, VecDeque};
use std::hash::Hash;
use std::sync::{Arc, Mutex, RwLock, RwLockReadGuard};
use std::vec;



#[derive(Debug)]
/// Stores simple primitives in hierarchal, searchable, labeled structure.
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
pub struct Container<T: Sized + Copy + Hash + Eq> {
    quick_lookup: RwLock<HashMap<String, WrappedNode<T>>>,
    root: WrappedNode<T>,
}

type WrappedNode<T: Sized + Copy + Hash + Eq> = Arc<RwLock<Node<T>>>;
type Nodes<T: Sized + Copy + Hash + Eq> = Vec<WrappedNode<T>>;

#[derive(Debug)]
pub struct Node<T: Sized + Copy + Hash + Eq> {
    pub label: String,
    pub entries: HashSet<T>,
    pub nodes: HashMap<String, WrappedNode<T>>,
}

impl<T: Sized + Copy + Hash + Eq> Node<T> {
    pub fn new(label:&str) -> Self {
        Node {
            label: String::from(label),
            entries: HashSet::new(),
            nodes: HashMap::new(),
        }
    }

    fn add_entry(&mut self, item: T) {
        self.entries.insert(item);
    }

    fn remove_entry(&mut self, item: T) -> bool {

        self.entries.remove(&item);

        self.is_empty()
    }

    fn is_empty(&mut self) -> bool {
        self.entries.len() == 0 && self.nodes.len() == 0
    }
}

pub enum SearchResult {
    Ignore,
    Accept,
    Push,
    PushAndAccept
}

impl<T: Sized + Copy + Hash + Eq> Container<T> {
    pub fn new_threaded() -> Self {
        Container {
            quick_lookup: RwLock::new(HashMap::new()),
            root: Arc::new(RwLock::new(Node::new(""))),
        }
    }

    fn add_quick_lockup(&mut self, candidate: WrappedNode<T>, item: T, path: &str) {
        self.quick_lookup
            .write()
            .unwrap()
            .insert(String::from(path), candidate);
    }

    fn remove_quick_lookup(&mut self,  path: &str) {
        self.quick_lookup
            .write()
            .unwrap()
            .remove(path);
    }

    fn add_entry(candidate: WrappedNode<T>, item: T) {
        candidate.write().unwrap().entries.insert(item);
    }

    pub fn add(&mut self, path: &str, item: T) -> Result<(), &str> {
        let mut base = self.root.clone();

        let mut it = path.split("/").peekable();

        if let Some(candidate) = self.quick_lookup.read().unwrap().get(path) {

            candidate.write().unwrap().add_entry(item);

            return Ok(());
        }

        while let Some(part) = it.next() {

            if part == "" {
                continue;
            }

            let mut HAVE_MATCH = false;

            let read = base.clone();

            if let Some(candidate) = read.read().unwrap().nodes.get(part) {

                if it.peek().is_none() {
                    
                    candidate.write().unwrap().add_entry(item);
                    
                    self.add_quick_lockup(candidate.clone(), item, path);
                    
                    return Ok(());
                }

                base = candidate.clone();

                continue;
            } 

            let write = base.clone();

            let mut node = write.write().unwrap();

            let candidate = Arc::new(RwLock::new(Node::<T>::new(part)));

            node.nodes.insert(String::from(part), candidate.clone());

            if it.peek().is_none() {

                candidate.write().unwrap().add_entry(item);

                self.add_quick_lockup(candidate, item, path);

                return Ok(());
            }

            base = candidate.clone();
            
        }

        Err("failed to add")
    }

    pub fn remove(&mut self, path: &str, item: T) -> Result<(), &str> {

        let ql = &self.quick_lookup;

        let mut base = self.root.clone();
        
        if let Some(candidate) = ql.read().unwrap().get(path) {
            base = candidate.clone();
        }else {
            return  Err("failed to remove")
        }

        if base.write().unwrap().remove_entry(item) {

            self.remove_quick_lookup(path);

            let mut par = self.root.clone();

            let mut pairs: Vec<(WrappedNode<T>, String)> = vec![];

            for part in path.split("/") {

                let read = par.clone();

                if let Some(candidate) = read.read().unwrap().nodes.get(part) { 
                    
                    pairs.push((par.clone(), String::from(part)));
                    
                    par = candidate.clone();
                };
            }

            pairs.reverse();

            for (par, label) in &pairs {

                let mut par = par.write().unwrap();

                par.nodes.remove(label);

                if !par.is_empty() {
                    break;
                }
            }
        }

        return Ok(());
    }

    pub fn get(&self,  path: &str )->HashSet<T> {
        
        let ql = &self.quick_lookup;

        if let Some(candidate) = ql.read().unwrap().get(path) {
            candidate.read().unwrap().entries.clone()
        } else {
            HashSet::<T>::new()
        }
    }

    pub fn get_nodes<'a>(&'a self,  path: &str )->Option<HashMap<String, WrappedNode<T>>> {
        
        let ql = &self.quick_lookup;

        if let Some(candidate) = ql.read().unwrap().get(path) {
            Some(candidate.read().unwrap().nodes.clone())
        } else {
            None
        }
    }

    pub fn search<F>(
        &self,
        mut search_function: F
    ) -> HashSet<T> where F : FnMut(u32, &String, &RwLockReadGuard<Node<T>>) -> SearchResult{
        
        let mut queue = VecDeque::<(u32,WrappedNode<T>)>::new();
        
        let root = String::from("root");

        let mut results = HashSet::<T>::new();

        let mut it = queue.iter_mut();

        //Deal with root first

        for (string, node) in &self.root.read().unwrap().nodes {

            let read = node.read().unwrap();

            match search_function(0, string, &read) {
                SearchResult::PushAndAccept => {
                    
                    for entry in &read.entries {
                        results.insert(entry.to_owned());
                    }

                    queue.push_back((1, node.clone()));
                },
                SearchResult::Accept => {
                    for entry in &read.entries {
                        results.insert(entry.to_owned());
                    } 
                },
                SearchResult::Push => queue.push_back((1, node.clone())),
                SearchResult::Ignore => {}
            }
        }

        //Now allow unlimited iteration through the levels of the container.

        while let Some((level, node)) = queue.pop_front() {
            
            let read = node.read().unwrap();

            for (string, node) in &read.nodes {

                let read = node.read().unwrap();
    
                match search_function(level, string, &read) {
                    SearchResult::PushAndAccept => {
                        
                        for entry in &read.entries {
                            results.insert(entry.to_owned());
                        }
    
                        queue.push_back((level+1, node.clone()));
                    },
                    SearchResult::Accept => {
                        for entry in &read.entries {
                            results.insert(entry.to_owned());
                        } 
                    },
                    SearchResult::Push => queue.push_back((level+1, node.clone())),
                    SearchResult::Ignore => {}
                }
            }
            
        };
        
        return results;
    }
}

#[cfg(test)]
mod tests {

    use super::*;

    #[test]
    fn test_add() {
        let mut store = Container::<bool>::new_threaded();

        assert!(store.add("/test/test", false).is_ok());
        assert!(store.add("/test/test", true).is_ok());

        let results = store.search(|level, path, node|  {

            if node.label == "test"{
                if level == 1{
                    SearchResult::Accept
                } else {
                    SearchResult::Push
                } 
            } else {
                SearchResult::Ignore
            }
        });

        assert_eq!(results.len(), 2);

        assert!(store.remove("/test/test", true).is_ok());
        assert!(store.remove("/test/test", false).is_ok());

        assert!(store.remove("/test/test", false).is_err());
        assert!(store.remove("/test/test", true).is_err());
    }
}
