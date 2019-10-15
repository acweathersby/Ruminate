#pragma once

#include "./node.h"

namespace RUMINATE_COMMAND_NODES
{
	struct UID_UID_n : public Node {

		unsigned random = 0;

		unsigned long long created = 0;

		UID_UID_n(unsigned r, unsigned long long c): Node(), random(r), created(c) {
			type = NodeType::UID;
		}

		virtual wostream& toStream(wostream& os) const {
			return os << "{type:\"UID\", created:" << created << ", random:" << random << "}";
		}
	};

	struct UID_List_n : public Node {

		vector<UID_UID_n *> uids;

		UID_List_n(): Node() { type = NodeType::UID_LIST;}

		virtual wostream& toStream(wostream& os) const {
			os << "{type:\"UID_LIST\", \nuids:[";

			for(auto iter = uids.begin(); iter != uids.end(); iter++) {
				os << (**iter) << ", ";
			}

			return os <<"]}";
		}
	};
};
