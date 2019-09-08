#include <cstring>
#include <map>
#include <iostream>
#include "./tokenizer.h"
#include "./gnql_cpp.h"
#include "./nodes.h"
#include "./parser.h"

using HC_Tokenizer::Token;
using HC_Parser::parse;
using namespace HC_TEMP;

typedef ParseBuffer<RUMINATE_QUERY_NODES::QueryBodyNode> Allocator;

int mainOLD(int param_len, char *  params[])
{

	wstring str(L"as/div/test/test?#tree=2");

	Token tk(str);
	tk.IGNORE_WHITE_SPACE = false;
	tk.reset();
	//*
	try {

		auto buffer = parse<Allocator,HC_TEMP::Data<Allocator,RUMINATE_QUERY_NODES::NodeFunctions<Allocator>>>(tk);

		auto node = buffer.getRootObject();

		std::wcout << (node) << endl;

	} catch (int e) {
		std::cout << e << std::endl;
	}
	//*/

	return 0;
}
