#pragma once

#include <cstring>
#include "../compiler/tokenizer.h"
#include "../compiler/gnql_cpp.h"
#include "../compiler/nodes.h"
#include "../compiler/parser.h"
#include "../uid/uid.h"
#include "../note/note.h"
#include "../tags/tags.h"
#include "../container/container.h"
#include "../database/base.h"
#include "./container.h"
#include "./filter.h"
#include "./query_result.h"

namespace RUMINATE
{
	using namespace CONTAINER;
	using namespace DB;
	using namespace NOTE;

	namespace QUERY
	{

		using namespace RUMINATE_QUERY_NODES;
		using namespace HC_TEMP;
		using HC_Tokenizer::Token;
		using HC_Parser::parse;

		typedef ParseBuffer<RUMINATE_QUERY_NODES::QueryBodyNode> Allocator;

		static QueryResult runQuery(const wstring& string, DBRunner& db)

		{
			const unsigned node_count_size = 512;

			unsigned count = node_count_size, total = 0;

			UID * out_B, *active_B;

			// Allocate stack space for note pointers.
			UID * out_buffer = (UID *) malloc(sizeof(UID) * count * 2);
			UID * active_buffer = out_buffer + count;

			active_B = active_buffer;
			out_B = out_buffer;

			Token tk(string);

			try {

				auto query_buffer = HC_Parser::parse<Allocator, HC_TEMP::Data<Allocator, RUMINATE_QUERY_NODES::NodeFunctions<Allocator>>>(tk);

				auto node = query_buffer.getRootObject();

				wcout << (*node) << endl;

				if (node) {

					if (node->container) {



						cout << node_count_size << " MAX" << endl;

						total = 0;

						filterContainer(*(node->container), db.getContainerTree(), db, total, node_count_size, out_B);
					}

					if(node->filter) {

						active_B = out_B;

						filterNotes(*(node->filter), db, active_B, out_B, total);

					}

					if(node->sort) {

					}
				}
			} catch (int e) {
				std::cout << e << std::endl;
			}

			if(total > 0)
				return QueryResult(string, out_buffer, total, db);

			free(out_buffer);

			return QueryResult(string, db);
		}

	}
}
