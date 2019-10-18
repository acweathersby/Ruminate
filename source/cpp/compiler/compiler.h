#pragma once

#include <cstring>
#include "./tokenizer.h"
#include "./nodes.h"
#include "./parser.h"
#include "./command_string.cpp.h"

namespace RUMINATE
{

	namespace COMPILER
	{
		using namespace RUMINATE_COMMAND_NODES;
		using namespace HC_TEMP;
		using namespace HC_Parser;


		using HC_Tokenizer::Token;

		static ParseBuffer<char> compileWString(const wstring& string)
		{
			Token tk(string);

			return parse<HC_TEMP::Data<RUMINATE_COMMAND_NODES::NodeFunctions>>(tk);
		}
	}
}
