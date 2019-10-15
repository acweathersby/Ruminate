#pragma once

#include "./query_nodes.h"

namespace RUMINATE_COMMAND_NODES
{

	struct NOTE_Tag_n : public Node {

		wstring * key = nullptr;

		double num_val = 0;

		wstring * val = nullptr;

		NOTE_Tag_n(wstring * k, wstring * v): Node(), key(k), val(v) {
			type = NodeType::NOTE_TAG;
		}

		NOTE_Tag_n(wstring * k, double v): Node(), key(k), num_val(v) {
			type = NodeType::NOTE_TAG;
		}

		NOTE_Tag_n(wstring * k): Node(), key(k) {
			type = NodeType::NOTE_TAG;
		}

	};

	typedef vector<NOTE_Tag_n *> NOTE_TagList_n;

	struct NOTE_Note_n : public Node {
		unsigned note_type = 0;
		QUERY_Container_n * ctr = nullptr;
		NOTE_TagList_n * tags = nullptr;
		wstring * body = nullptr;

		NOTE_Note_n(unsigned t, QUERY_Container_n* c, NOTE_TagList_n* tl, wstring * b): Node(), note_type(t), ctr(c), tags(tl), body(b) {
			type = NodeType::NOTE;
		}
	};
};
