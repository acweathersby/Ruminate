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

		typedef ParseBuffer<RUMINATE_COMMAND_NODES::Node> Allocator;

		static Allocator compileWString(const wstring& string)
		{
			Token tk(string);

			return parse<Allocator, HC_TEMP::Data<Allocator, RUMINATE_COMMAND_NODES::NodeFunctions<Allocator>>>(tk);
		}
	}
}
