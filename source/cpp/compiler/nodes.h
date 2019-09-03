#pragma once
#include <iterator>
#include <iostream>
#include <vector>
#include <cstring>
#include "./tokenizer.h"

namespace HC_NODES {
	using namespace HC_Tokenizer;
	using namespace std;

	struct ContainerIdentifier;
	
	typedef vector<ContainerIdentifier *> ContainerList;

	struct Node{

		unsigned type = 0;

		friend wostream& operator<<(wostream& os, const Node& dt){
			return os << "Node" << dt.type;
		}
	};

	struct ContainerIdentifier : public Node{
		wstring * string;

		ContainerIdentifier(wstring * str) : Node(), string(str) {
			type = 88;
		}

		friend wostream& operator<<(wostream& os, const ContainerIdentifier& dt){
			return os << "{id: \"" << (*dt.string) << "\"}";
		}
	};

	struct ContainerClause : public Node{
		
		ContainerList& list;

		ContainerClause(ContainerList& lst) : Node(), list(lst) {
			type = 44;
		}

		friend wostream& operator<<(wostream& os, const ContainerClause& dt){
			ContainerList& list = dt.list;
			os<< "{";

			for(auto itr = list.cbegin(); itr != list.cend(); itr++){
				os << "[" << (**itr) << "]";
			}

			return os << "}";
		}
	};

	struct QueryBodyNode : public Node{
		
		ContainerClause * container;

		QueryBodyNode(ContainerClause * ctr) : Node() , container(ctr) {
			type = 22;
		}

		friend wostream& operator<<(wostream& os, const QueryBodyNode& dt) {
			return os << "{ctr:"<< (*dt.container) <<"} ";
		}
	};



	/****************************/

	void * QueryBody(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output){

		cout << "===== QueryBody ===== " << bitfield << " jiving" << endl;

		return new QueryBodyNode((ContainerClause *)output[output_offset]);
	}

	void * ContainerClause(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
	
		return new struct ContainerClause(*(ContainerList *) output[output_offset]);
	}
	void * ContainerIdentifierList(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
		ContainerList * ctr = NULL;

		if(reduce_size == 1){
			ctr = new ContainerList;
			ctr->push_back((ContainerIdentifier *)output[output_offset]);
		}else{
			ctr = (ContainerList *) output[output_offset];
			ctr->push_back((ContainerIdentifier *)output[output_offset+1]);
		}

		cout << "--- > size " << ctr->size() << " reduce_size " << reduce_size<< endl;

		return ctr;
	}
	void * ContainerIdentifier(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
		return new struct ContainerIdentifier((wstring *)output[output_offset]);
	}
	void * FilterClause(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
		cout << "FilterClause ===================================" << endl;
		return new int[2555];
	}
	void * AndNode(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
		cout << "AndNode ===================================" << endl;
		return new int[2555];
	}
	void * OrNode(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
		cout << "OrNode ===================================" << endl;
		return new int[2555];
	}
	void * NotNode(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
		cout << "NotNode ===================================" << endl;
		return new int[2555];
	}
	void * WrappedExpression(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
		cout << "WrappedExpression ===================================" << endl;
		return new int[2555];
	}
	void * SortClause(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
		cout << "SortClause ===================================" << endl;
		return new int[2555];
	}
	void * SortStatementList(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
		cout << "SortStatementList ===================================" << endl;
		return new int[2555];
	}
	void * CreatedStatement(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
		cout << "CreatedStatement ===================================" << endl;
		return new int[2555];
	}
	void * ModifiedStatement(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
		cout << "ModifiedStatement ===================================" << endl;
		return new int[2555];
	}
	void * SizeStatement(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
		cout << "SizeStatement ===================================" << endl;
		return new int[2555];
	}
	void * TagStatement(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
		cout << "TagStatement ===================================" << endl;
		return new int[2555];
	}
	void * ComparisonExpressionEquals(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
		cout << "ComparisonExpressionEquals ===================================" << endl;
		return new int[2555];
	}
	void * ComparisonExpressionMore(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
		cout << "ComparisonExpressionMore ===================================" << endl;
		return new int[2555];
	}
	void * ComparisonExpressionLess(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
		cout << "ComparisonExpressionLess ===================================" << endl;
		return new int[2555];
	}
	void * LAST(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
		cout << "LAST ===================================" << endl;
		return new int[2555];
	}
	void * RangeExpression(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
		cout << "RangeExpression ===================================" << endl;
		return new int[2555];
	}
	void * DateExpression(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
		cout << "DateExpression ===================================" << endl;
		return new int[2555];
	}
	void * OrderDescending(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
		cout << "OrderDescending ===================================" << endl;
		return new int[2555];
	}
	void * OrderAscending(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
		cout << "OrderAscending ===================================" << endl;
		return new int[2555];
	}
	void * Identifier(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
		const wstring& string = tk.string;

		unsigned 
			start = (unsigned long long) output[output_offset],
			end = tk.offset;

		cout << start <<"-> <-"<< end << endl;
		
		wstring * str = new wstring(string.substr(start, end-start));

		return str;
	}
	void * Sentence(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
		return output[ output_offset + 1 ];
	}
	void * StringData(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
		return output[ output_offset];
	}
	void * StringDataVal(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
		return output[ output_offset ];
	}
	void * EscapedValue(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
		return new int[2555];
	}
	void * SYMBOL(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {		
		return output[output_offset];
	}
	void * NUMBER(Token& tk, unsigned reduce_size, unsigned bitfield, int output_offset, void ** output) {
		return new int[2555];
	}
}
