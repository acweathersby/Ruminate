#pragma once

#include <iterator>
#include <iostream>
#include <vector>
#include <string>
#include "./node.h"
#include "./query_nodes.h"
#include "./note_nodes.h"
#include "./uid_nodes.h"

namespace RUMINATE_COMMAND_NODES
{
	struct COMMAND_Add_n : public Node {

		UID_UID_n * uid = nullptr;
		QUERY_Container_n * ctr = nullptr;
		NOTE_Note_n * data = nullptr;

		COMMAND_Add_n(UID_UID_n * u, NOTE_Note_n * d = nullptr) : Node(), uid(u), data(d) {type = NodeType::ADD;}

		COMMAND_Add_n(QUERY_Container_n * c, NOTE_Note_n * d = nullptr) : Node(), ctr(c), data(d) {type = NodeType::ADD;}
	};

	struct COMMAND_Delete_n : public Node {

		UID_List_n * uids = nullptr;
		QUERY_Body_n * query = nullptr;

		COMMAND_Delete_n(UID_List_n * l = nullptr) : Node(), uids(l) {type = NodeType::DELETE;}

		COMMAND_Delete_n(QUERY_Body_n * b = nullptr) : Node(), query(b) {type = NodeType::DELETE;}
	};

	struct COMMAND_Retrieve_n : public Node {

		UID_List_n * uids = nullptr;

		QUERY_Body_n * query = nullptr;

		COMMAND_Retrieve_n(UID_List_n * d = nullptr) : Node(), uids(d) {type = NodeType::RETRIEVE;}

		COMMAND_Retrieve_n(QUERY_Body_n * b = nullptr) : Node(), query(b) {
			type = NodeType::RETRIEVE;
		};

		virtual wostream& toStream(wostream& os) const {
			os << "{ \n type:\"RETRIEVE\", \n val:";

			if(uids) {
				os << "[ ";
				for(auto iter = uids->begin(); iter != uids->end(); iter++) {
					os << (*iter) << ", ";
				}
				os << "]";
			} else if (query) {
				os << *query;
			}

			return os << "\n}";
		};
	};
}
