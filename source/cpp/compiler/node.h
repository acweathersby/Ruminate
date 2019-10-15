#pragma once

#include <iterator>
#include <iostream>
#include <vector>
#include <string>
#include <cstring>

#include "./tokenizer.h"

namespace RUMINATE_COMMAND_NODES
{
	using namespace HC_Tokenizer;

	using std::wstring;
	using std::vector;
	using std::unordered_map;
	using std::wcout;
	using std::cout;
	using std::endl;

	enum class NodeType : char
	{
	    //QUERY NODES
	    Undefined,
	    And,
	    Or,
	    Not,
	    Created,
	    Modified,
	    Size,
	    Tag,
	    ID,
	    Sentence,
	    ContainerID,
	    FilterClause,
	    ContainerClause,
	    SortClause,
	    QueryBody,
	    CreatedStatement,
	    ModifiedStatement,
	    SizeStatement,
	    TagStatement,

	    //COMMAND NODES
	    ADD,
	    DELETE,
	    RETRIEVE,

	    //UID NODES
	    UID,
	    UID_LIST,

	    //NOTE NODES
	    NOTE,
	    NOTE_TAGS,
	    NOTE_TAG,
	    NOTE_TAG_VALUE,
	    NOTE_ID,
	    NOTE_BODY
	};

	struct Node {

		NodeType type = NodeType::Undefined;

		virtual wostream& toStream(wostream& os) const {
			return os << "NODE";
		};
	};

	inline wostream& operator << (wostream& os, Node& node)
	{
		return node.toStream(os);
	}
};
