#pragma once
#include <iterator>
#include <iostream>
#include <vector>
#include <cstring>
#include "./tokenizer.h"
#include "./node_utils.h"

namespace HC_NODES {
using namespace HC_Tokenizer;
using namespace std;

struct Node;
struct ContainerIdentifier;

typedef vector<ContainerIdentifier *> ContainerList;
typedef vector<Node *> SortList;

enum class NodeType : char {
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
	QueryBody
};


struct Node {

	NodeType type = NodeType::Undefined;

	friend wostream& operator<<(wostream& os, const Node& dt) {
		return os << "Node" << (char)dt.type;
	}
};

struct Sentence : public Node {
	wstring * string;

	Sentence(wstring * str) : Node(), string(str) { type = NodeType::Sentence;}

	friend wostream& operator<<(wostream& os, const Sentence& dt) {
		return os << "{sentence: \"" << (*dt.string) << "\"}";
	}
};

struct Identifier : public Sentence {
	Identifier(wstring * str) : Sentence(str) {type = NodeType::ID;}
	friend wostream& operator<<(wostream& os, const Identifier& dt) {
		return os << "{id: \"" << (*dt.string) << "\"}";
	}
};

struct ContainerIdentifier : public Sentence {

	ContainerIdentifier(wstring * str) : Sentence(str) {type = NodeType::ContainerID;}

	friend wostream& operator<<(wostream& os, const ContainerIdentifier& dt) {
		return os << "{ctr-id: \"" << (*dt.string) << "\"}";
	}
};

struct BinaryExpression : public Node {
	Node * left;
	Node * right;
	BinaryExpression(Node * l, Node * r) : Node(), left(l), right(r) {}
};

struct NotExpression : public Node { Node * expr; NotExpression(Node * e) : Node(), expr(e) {type = NodeType::Not;}};
struct AndExpression : public BinaryExpression {	AndExpression(Node * l, Node * r) : BinaryExpression(l, r) {type = NodeType::And;}};
struct OrExpression : public BinaryExpression {	OrExpression(Node * l, Node * r) : BinaryExpression(l, r) {type = NodeType::Or;}};

struct Comparison {
	
	enum Type {
		ID,
		Value, 
		MoreThan,
		LessThan,
		Range,
		Date
	};

	Type type;
	Identifier * id;
	double valueA = 0.0;
	double valueB = 0.0;

	Comparison(Type t, Identifier * i, double a = 0.0, double b = 0.0)
		: type(t)
		, id(i)
		, valueA(a)
		, valueB(b)
		{}
};

struct CreatedStatement : public Node{
	Comparison * compare;
	bool order = 0;
	CreatedStatement(Comparison * c, bool o) : Node(), compare(c), order(o){}
};

struct ModifiedStatement : public Node{
	Comparison * compare;
	bool order = 0;
	ModifiedStatement(Comparison * c, bool o) : Node(), compare(c), order(o){}
};

struct SizeStatement : public Node{
	Comparison * compare;
	bool order = 0;
	SizeStatement(Comparison * c, bool o) : Node(), compare(c), order(o){}
};

struct TagStatement : public Node{
	Comparison * compare;
	bool order = 0;
	TagStatement(Comparison * c, bool o) : Node(), compare(c), order(o){}
};



struct SortClause : public Node {

	SortList* list;

	SortClause(SortList* lst) : Node(), list(lst) {
		type = NodeType::SortClause;
	}

	friend wostream& operator<<(wostream& os, const SortClause& dt) {
		return os << "sort";
	}
};

struct FilterClause : public Node {

	Node * expr;

	FilterClause(Node * e) : Node(), expr(e) {
		type = NodeType::FilterClause;
	}

	friend wostream& operator<<(wostream& os, const FilterClause& dt) {
		return os << "filter";
	}
};

struct ContainerClause : public Node {

	ContainerList* list;
	Identifier* id;

	ContainerClause(ContainerList* lst, Identifier* id) : Node(), list(lst), id(id) {
		type = NodeType::ContainerClause;
	}

	friend wostream& operator<<(wostream& os, const ContainerClause& dt) {
		
		ContainerList& list = *dt.list;

		os << "{";

		if (dt.id) {
			os << *dt.id;
		}

		for (auto itr = list.cbegin(); itr != list.cend(); itr++) {
			os << "[" << (**itr) << "]";
		}

		return os << "}";
	}
};

struct QueryBodyNode : public Node {

	ContainerClause * container;
	FilterClause * filter;
	SortClause * sort;

	QueryBodyNode(
	    ContainerClause * ctr,
	    FilterClause * fltr,
	    SortClause * srt
	) 	: Node()
		, container(ctr)
		, filter(fltr)
		, sort(srt)
	{
		type = NodeType::QueryBody;
	}

	friend wostream& operator<<(wostream& os, const QueryBodyNode& dt) {
		os << dt.container << endl;
		os << dt.filter << endl;
		os << dt.sort << endl;
		return os << "{ctr:" << (*dt.container) << "} ";
	}
};

template<class Allocator>
struct NodeFunctions
{
	
/****************************/

static void * QueryBody(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {

	OptionalNodes<struct ContainerClause *, struct FilterClause *, struct SortClause *> options(bitfield, output_offset, output);


	return new(*allocator) QueryBodyNode(options.a, options.b, options.c);
}

/**** CLAUSES ****/
static void * ContainerClause(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {

	OptionalNodes<int, ContainerList *, struct Identifier *> options(bitfield, output_offset, output);

	return new(*allocator) struct ContainerClause(options.b, options.c);
}

static void * FilterClause(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {

	OptionalNodes<int, Node *> options(bitfield, output_offset, output);

	return new(*allocator) struct FilterClause(options.b);
}

static void * SortClause(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {

	OptionalNodes<int, SortList *> options(bitfield, output_offset, output);

	return new(*allocator) struct SortClause(options.b);
}

static void * ContainerIdentifierList(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {

	ContainerList * ctr = NULL;



	if (reduce_size == 1) {
		ctr = new(*allocator) ContainerList;
		ctr->push_back((struct ContainerIdentifier *)output[output_offset]);
	} else {
		ctr = (ContainerList *) output[output_offset];
		ctr->push_back((struct ContainerIdentifier *)output[output_offset + 1]);
	}



	return ctr;
}

static void * SortStatementList(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {
	SortList * ctr = NULL;

	if (reduce_size == 1) {
		ctr = new(*allocator) SortList;
		ctr->push_back((Node *)output[output_offset]);
	} else {
		ctr = (SortList *) output[output_offset];
		ctr->push_back((Node *)output[output_offset + 2]);
	}

	return ctr;
}

static void * ContainerIdentifier(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {
	return output[output_offset];
}

static void * AndNode(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {
	return new(*allocator) AndExpression((Node *) output[output_offset], (Node *) output[output_offset + 1]);
}
static void * OrNode(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {
	return new(*allocator) OrExpression((Node *) output[output_offset], (Node *) output[output_offset + 1]);
}

static void * NotNode(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {
	return new(*allocator) NotExpression((Node *) output[output_offset]);
}

static void * WrappedExpression(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {
	return output[output_offset];
}


static void * CreatedStatement(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {
	
	OptionalNodes<int, Comparison *, bool> options(bitfield, output_offset, output);

	return new(*allocator) struct CreatedStatement(options.b, options.c);
}


static void * ModifiedStatement(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {
	
	OptionalNodes<int, Comparison *, bool> options(bitfield, output_offset, output);

	return new(*allocator) struct ModifiedStatement(options.b, options.c);
}

static void * SizeStatement(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {
	
	OptionalNodes<int, Comparison *, bool> options(bitfield, output_offset, output);

	return new(*allocator) struct SizeStatement(options.b, options.c);
}


static void * TagStatement(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {
	
	OptionalNodes<int, Comparison *, bool> options(bitfield, output_offset, output);

	return new(*allocator) struct TagStatement(options.b, options.c);
}


static void * ComparisonExpressionEquals(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {
	return new(*allocator) Comparison(Comparison::Value, nullptr, (((double *) output)[output_offset+1]));
}


static void * ComparisonExpressionMore(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {
	return new(*allocator) Comparison(Comparison::MoreThan, nullptr, (((double *) output)[output_offset+1]));
}

static void * ComparisonExpressionLess(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {
	return new(*allocator) Comparison(Comparison::LessThan, nullptr, (((double *) output)[output_offset+1]));
}

static void * RangeExpression(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {
	OptionalNodes<int, double, double> options(bitfield, output_offset, output);
	return new(*allocator) Comparison(Comparison::Range, nullptr, options.b, options.c);
}

static void * DateExpression(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {
	OptionalNodes<int, double, double> options(bitfield, output_offset, output);
	return new(*allocator) Comparison(Comparison::Range, nullptr, options.b, options.c);
}

static void * OrderDescending(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {
	return (void *) 0;
}

static void * OrderAscending(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {
	return (void *) 1;
}

static void * Identifier(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {
	const wstring& string = tk.string;

	unsigned
	
		start = (unsigned long long) output[output_offset],
		
		end = tk.offset;

	wstring * str = new(*allocator) wstring(string.substr(start, end - start));

	return new(*allocator) struct Identifier(str);
}

static void * Sentence(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {
	const wstring& string = tk.string;

	unsigned
	start = (unsigned long long) output[output_offset],
	end = tk.offset;


	wstring * str = new(*allocator) wstring(string.substr(start, end - start));

	return new(*allocator) struct Sentence(str);
}

static void * StringData(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {
	return output[ output_offset];
}
static void * StringDataVal(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {
	return output[ output_offset ];
}
static void * EscapedValue(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {
	return nullptr; //new(*allocator) int[2555];
}
static void * SYMBOL(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {
	return output[output_offset];
}
static void * NUMBER(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {
	
	((double *)output)[output_offset] = stod(tk.text());

	return output[output_offset];
}

static void * LAST(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output, Allocator* allocator) {
	return output[output_offset + reduce_size - 1];
}
};
};
