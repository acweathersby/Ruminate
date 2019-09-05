#include <cstring>
#include <map>
#include <iostream>
#include "./tokenizer.h"
#include "./gnql_cpp.h"
#include "./gnql_cpp.cpp"
#include "./nodes.h"
#include "./parser.h"

using HC_Tokenizer::Token;
using HC_Parser::parse;
using namespace HC_TEMP;

typedef ParseBuffer<HC_NODES::QueryBodyNode> Allocator;

int main(int param_len, char *  params[]) {

	wstring str(L"as/div/test/test?ds");

	Token tk(str);
	tk.IGNORE_WHITE_SPACE = false;
	tk.reset();
	//*
	try {
		auto buffer = parse<Allocator,HC_TEMP::Data<Allocator,HC_NODES::NodeFunctions<Allocator>>>(tk);

		auto node = (buffer.getRootObject());

		std::wcout << (node) << endl;

	} catch (int e) {
		std::cout << e << std::endl;
	}
	//*/

	return 0;
}
