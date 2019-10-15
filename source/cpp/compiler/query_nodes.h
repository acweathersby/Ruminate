#pragma once

#include "./node.h"

namespace RUMINATE_COMMAND_NODES
{
	struct QUERY_ContainerIdentifier_n;

	typedef vector<QUERY_ContainerIdentifier_n *> QUERY_ContainerIdentifierList_n;
	typedef vector<Node *> QUERY_SortList_n;
	typedef vector<const wstring *> QUERY_IdentifierList_n;

	static wostream& operator << (wostream& os, QUERY_IdentifierList_n& id_list)
	{
		for(auto iter = id_list.begin(); iter != id_list.end(); iter++)
			os << **iter;
		return os;
	}

	struct QUERY_Sentence_n : public Node {
		wstring * string;

		QUERY_Sentence_n(wstring * str) : Node(), string(str) { type = NodeType::Sentence;}

		friend wostream& operator<<(wostream& os, const QUERY_Sentence_n& dt) {
			return os << "{sentence: \"" << (*dt.string) << "\"}";
		}
	};

	struct QUERY_Identifier_n : public Node {
		QUERY_IdentifierList_n & list;

		QUERY_Identifier_n(QUERY_IdentifierList_n * l) : Node(), list(*l) {type = NodeType::ID;}

		virtual wostream& toStream(wostream& os) const {
			return	os << "{id: \"" << list << "\"}";
		}
	};

	struct QUERY_ContainerIdentifier_n : public QUERY_Identifier_n {

		QUERY_ContainerIdentifier_n(QUERY_IdentifierList_n * l): QUERY_Identifier_n(l) {type = NodeType::ContainerID;}

		QUERY_ContainerIdentifier_n(QUERY_Identifier_n& id) : QUERY_Identifier_n(&id.list) {
			type = NodeType::ContainerID;
		}

		virtual wostream& toStream(wostream& os) const {
			return	os << "{ctnr-id: \"" << list << "\"}";
		}

		bool IS_WILD_CARD() {
			return list.size() == 1 && *list[0] == wstring(L"*");
		}
	};

	struct QUERY_Binary_n : public Node {

		Node * left;
		Node * right;

		QUERY_Binary_n(Node * l, Node * r) : Node(), left(l), right(r) {}

		virtual wostream& toStream(wostream& os) const {
			return	os << "{BINARY l:" << *left << ", r:" << *right << "}";
		}
	};

	struct QUERY_Not_n : public Node {

		Node * expr;

		QUERY_Not_n(Node * e) : Node(), expr(e) {type = NodeType::Not;}

		virtual wostream& toStream(wostream& os) const {
			return	os << "{NOT l:" << *expr  << "}";
		}
	};

	struct QUERY_And_n : public QUERY_Binary_n {

		QUERY_And_n(Node * l, Node * r) : QUERY_Binary_n(l, r) {type = NodeType::And;}

		virtual wostream& toStream(wostream& os) const {
			return	os << "{AND l:" << *left << ", r:" << *right << "}";
		}
	};

	struct QUERY_Or_n : public QUERY_Binary_n {

		QUERY_Or_n(Node * l, Node * r) : QUERY_Binary_n(l, r) {type = NodeType::Or;}

		virtual wostream& toStream(wostream& os) const {
			return	os << "{OR l:" << *left << ", r:" << *right << "}";
		}
	};

	struct QUERY_Comparison_n {

		enum Type {
		    ID,
		    Value,
		    MoreThan,
		    LessThan,
		    Range,
		    Date
		};

		Type type;
		QUERY_Identifier_n * id;
		double valueA = 0.0;
		double valueB = 0.0;

		QUERY_Comparison_n(Type t, QUERY_Identifier_n * i, double a = 0.0, double b = 0.0)
			: type(t)
			, id(i)
			, valueA(a)
			, valueB(b)
		{}

		friend wostream& operator << (wostream& os, const QUERY_Comparison_n& c) {
			os << "{id:";
			if(c.id)
				os << *c.id;
			else
				os << "null";

			return	os  << " valA: " << c.valueA << " valB:" << c.valueB <<  "}";
		}
	};

	struct QUERY_Created_n : public Node {
		QUERY_Comparison_n * compare;
		bool order = 0;
		QUERY_Created_n(QUERY_Comparison_n * c, bool o) : Node(), compare(c), order(o) {type = NodeType::CreatedStatement;}
	};

	struct QUERY_Modified_n : public Node {
		QUERY_Comparison_n * compare;
		bool order = 0;
		QUERY_Modified_n(QUERY_Comparison_n * c, bool o) : Node(), compare(c), order(o) {type = NodeType::ModifiedStatement;}
	};

	struct QUERY_Size_n : public Node {
		QUERY_Comparison_n * compare;
		bool order = 0;
		QUERY_Size_n(QUERY_Comparison_n * c, bool o) : Node(), compare(c), order(o) {type = NodeType::SizeStatement;}
	};

	struct QUERY_Tag_n : public Node {
		QUERY_Identifier_n * id;
		QUERY_Comparison_n * compare;
		bool order = 0;
		QUERY_Tag_n(QUERY_Identifier_n * i, QUERY_Comparison_n * c, bool o) : Node(), id(i), compare(c), order(o) {type = NodeType::TagStatement;}
		virtual wostream& toStream(wostream& os) const {
			if (compare)
				return	os << "{TAG id:" << *id << " comparision:" << *compare << "}";
			else
				return	os << "{TAG id:" << *id << "}";
		}
	};

	struct QUERY_Sort_n : public Node {

		QUERY_SortList_n* list;

		QUERY_Sort_n(QUERY_SortList_n* lst) : Node(), list(lst) {
			type = NodeType::SortClause;
		}

		friend wostream& operator<<(wostream& os, const QUERY_Sort_n& dt) {
			return os << "sort";
		}
	};

	struct QUERY_Filter_n : public Node {

		Node * expr;

		QUERY_Filter_n(Node * e) : Node(), expr(e) {
			type = NodeType::FilterClause;
		}

		friend wostream& operator<<(wostream& os, const QUERY_Filter_n& dt) {
			if(dt.expr)
				return os << *dt.expr;
			return os;
		}
	};

	struct QUERY_Container_n : public Node {

		QUERY_ContainerIdentifierList_n* list;
		QUERY_Identifier_n* id;

		QUERY_Container_n(QUERY_ContainerIdentifierList_n* lst, QUERY_Identifier_n* id) : Node(), list(lst), id(id) {
			type = NodeType::ContainerClause;
		}

		friend wostream& operator<<(wostream& os, const QUERY_Container_n& dt) {

			QUERY_ContainerIdentifierList_n& list = *dt.list;

			os << "{\ntype:\"Container Identifier\"";

			if (dt.id) {
				os << ",\nid:" << *dt.id;
			}

			if(dt.list) {
				os << ",\nctrs:[";
				int i =0;
				for (auto itr = list.cbegin(); itr != list.cend(); itr++, i++) {
					if(i > 0) os << ",";
					os  << (**itr) << "";
				}
				os << "]";
			}

			return os << "\n}";
		}
	};

	struct QUERY_Body_n : public Node {

		QUERY_Container_n * container;
		QUERY_Filter_n * filter;
		QUERY_Sort_n * sort;

		QUERY_Body_n(
		    QUERY_Container_n * ctr,
		    QUERY_Filter_n * fltr,
		    QUERY_Sort_n * srt
		) 	: Node()
			, container(ctr)
			, filter(fltr)
			, sort(srt) {
			type = NodeType::QueryBody;
		}

		virtual wostream& toStream(wostream& os) const {

			os << "{\ntype:\"Query\",\n";

			if (container)
				os << "container:" << (*container) << "\n";
			else
				os << "container:" <<  "null" << "\n";

			if (filter)
				os << "filter:" << (*filter) << "\n";
			else
				os << "filter:" << "null" << "\n";

			if (sort)
				os << "sort:" << (*sort) << "\n";
			else
				os << "sort:" <<  "null" << "\n";

			return os << "}";
		}
	};
};
