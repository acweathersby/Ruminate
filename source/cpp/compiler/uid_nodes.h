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

	typedef vector<UID_UID_n *> UID_List_n;
};
