#pragma once

#include "./query_nodes.h"

namespace RUMINATE_COMMAND_NODES
{

	static const double NaN = nan("NOTE_NAN");

	struct NOTE_Tag_n : public Node {

		parse_string * key = nullptr;

		double num_val = NaN;

		parse_string * val = nullptr;

		NOTE_Tag_n(parse_string * k, parse_string * v): Node(), key(k), val(v) {
			type = NodeType::NOTE_TAG;
		}

		NOTE_Tag_n(parse_string * k, double v): Node(), key(k), num_val(v) {
			type = NodeType::NOTE_TAG;
		}

		NOTE_Tag_n(parse_string * k): Node(), key(k), num_val(NaN) {
			type = NodeType::NOTE_TAG;
		}

		virtual wostream& toStream(wostream& os) const {
			os << "{\n type:\"TAG\"";

			os << ",\nkey:\"" << * key << "\"";

			if (hasNumberValue()) {
				os << ",\nval:" << num_val;
			} else if (val) {
				os << ",\nval:\"" << * val << "\"";
			}
			return os << "\n}";
		};

		bool shouldRemove() const {
			return false;
		}

		bool hasStringValue()const  {
			return val != nullptr;
		}

		bool hasNumberValue()const  {
			return !isnan(num_val);
		}

	};

	typedef vector<NOTE_Tag_n *, ParseBuffer<NOTE_Tag_n *>> NOTE_TagList_n;

	struct NOTE_Note_n : public Node {
		unsigned note_type = 0;
		QUERY_Container_n * ctr = nullptr;
		NOTE_TagList_n * tags = nullptr;
		parse_string * body = nullptr;

		NOTE_Note_n(unsigned t, QUERY_Container_n* c, NOTE_TagList_n* tl, parse_string * b): Node(), note_type(t), ctr(c), tags(tl), body(b) {
			type = NodeType::NOTE;
		}

		virtual wostream& toStream(wostream& os) const {
			os << "{ \n type:\"NOTE\", \n n_type:" << note_type;

			if (ctr) {
				os << ",\ncontainer:" << (*ctr);
			}

			if(tags) {
				os << ",\ntags:[ ";
				for(auto iter = tags->begin(); iter != tags->end(); iter++) {
					os << (**iter) << ", ";
				}
				os << "]";
			}

			if (body) {
				os << ",\nbody:\"" << *body << "\"";
			}

			return os << "\n}";
		};
	};
};
