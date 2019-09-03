#include <cstring>
#include <map>
#include <iostream>
#include "./tokenizer.h"
#include "./gnql_cpp.cpp"
#include "./nodes.h"
#include "./parser.h"

using HC_Tokenizer::Token;
using HC_Parser::parse;
using namespace HC_TEMP;

int main(int param_len, char *  params[]){
	
	std::cout << std::endl << "test" << std::endl;

	wstring str(L"as/div/test/");

	Token tk(str);
	tk.IGNORE_WHITE_SPACE = false;
	tk.reset();
	//*
	try{
		void * node = parse(
			tk,
			symbol_lu,
			state_lookup,
			goto_lookup,
			state_actions,
			error_actions
		);

		std::cout  << node << std::endl;

		std::wcout << (* (HC_NODES::QueryBodyNode *) node) << endl;
	}catch(int e){
		std::cout << e <<std::endl;
	}
	//*/

	return 0;
}
