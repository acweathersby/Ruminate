// Stores a hierarchy of notids based on container name paths. 

typedef unsigned int LocalNoteId;

struct ContainerNode {

    std::vector<unsigned int> notes;
    
    ContainerNode * parent      = nullptr;
    ContainerNode * first_child = nullptr;
    ContainerNode * last_child  = nullptr;
}