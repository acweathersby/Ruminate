#pragma once

#include "./node.h"
#include "./note_nodes.h"
#include "./query_nodes.h"
#include "./uid_nodes.h"
#include <iostream>
#include <iterator>
#include <string>
#include <vector>

namespace RUMINATE_COMMAND_NODES
{
    struct COMMAND_Add_n : public Node {

        UID_UID_n * uid         = nullptr;
        QUERY_Container_n * ctr = nullptr;
        NOTE_Note_n * data      = nullptr;

        COMMAND_Add_n(NOTE_Note_n * d = nullptr) : Node(), data(d) { type = NodeType::ADD; }

        COMMAND_Add_n(UID_UID_n * u, NOTE_Note_n * d = nullptr) : Node(), uid(u), data(d) { type = NodeType::ADD; }

        COMMAND_Add_n(QUERY_Container_n * c, NOTE_Note_n * d = nullptr) : Node(), ctr(c), data(d)
        {
            type = NodeType::ADD;
        }

        virtual wostream & toStream(wostream & os) const
        {
            os << "{ \n type:\"ADD\"";

            if (uid) {
                os << ",\nid:" << (*uid);
            } else if (ctr) {
                os << ",\ncontainer:" << (*ctr);
            }

            os << ",\ndata: " << (*data);

            return os << "\n}";
        };

        bool hasContainer() { return (ctr != nullptr); }

        bool hasUID() { return (uid != nullptr); }
    };

    struct COMMAND_Delete_n : public Node {

        UID_List_n * uids = nullptr;

        QUERY_Body_n * query = nullptr;

        COMMAND_Delete_n(UID_List_n * l = nullptr) : Node(), uids(l) { type = NodeType::DELETE; }

        COMMAND_Delete_n(QUERY_Body_n * b = nullptr) : Node(), query(b) { type = NodeType::DELETE; }

        virtual wostream & toStream(wostream & os) const
        {
            os << "{ \n type:\"DELETE\"";

            if (uids) {
                os << ",\nids: " << *uids;
            } else if (query) {
                os << ",\nquery:" << (*query);
            }

            return os << "\n}";
        };

        bool hasQuery() { return (query != nullptr); }

        bool hasUIDList() { return (uids != nullptr); }
    };

    struct COMMAND_Retrieve_n : public Node {

        UID_List_n * uids = nullptr;

        QUERY_Body_n * query = nullptr;

        COMMAND_Retrieve_n(UID_List_n * d = nullptr) : Node(), uids(d) { type = NodeType::RETRIEVE; }

        COMMAND_Retrieve_n(QUERY_Body_n * b = nullptr) : Node(), query(b) { type = NodeType::RETRIEVE; };

        virtual wostream & toStream(wostream & os) const
        {
            os << "{ \n type:\"RETRIEVE\"";

            if (uids) {
                os << ",\nids: " << *uids;
            } else if (query) {
                os << ",\nquery:" << (*query);
            }

            return os << "\n}";
        };

        bool hasQuery() { return (query != nullptr); }

        bool hasUIDList() { return (uids != nullptr); }
    };
} // namespace RUMINATE_COMMAND_NODES
