use std::collections::{ HashMap, HashSet};
use std::sync::arc;





#[derive(Debug)]
struct Container<T: Sized + Copy> {
    quick_lookup: HashMap<String, WrappedNode<T>>,
    nodes: Nodes<T>,
}

type WrappedNode<T: Sized + Copy> = Arc<Node<T>>;
type Nodes<T: Sized + Copy> = Vec<WrappedNode<T>>;

#[derive(Debug)]
struct Node<T: Sized + Copy> {
    label: String,
    entries: HashSet<T>,
    nodes: Nodes<T>,
}

impl<T: Sized + Copy> Container<T> {

    pub fn new() -> Arc<Container<T>> {
        Arc::new(Container::<T> {
            quick_lookup: HashMap::new(),
            nodes: Vec::new(), 
        })
    }

    pub fn add(&mut self, path: &str, item: T) -> Result<(), &str> {
        Err("failed to add")
    }

    pub fn remove(&mut self) -> Result<(), &str> {
        Err("failed to remove")
    }
}

#[cfg(test)]
mod tests {

    use super::*;

    #[test]
    fn test_add() {

        let store = Container::<bool>::new();

        store.

        //assert!(store.add("/test/test", false).is_ok());
    }
}
