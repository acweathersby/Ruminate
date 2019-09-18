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

namespace RUMINATE
{
	using namespace CONTAINER;
	using namespace DB;

	namespace QUERY
	{

		using namespace RUMINATE_QUERY_NODES;

		using HC_Tokenizer::Token;
		using HC_Parser::parse;
		using namespace HC_TEMP;

		typedef ParseBuffer<RUMINATE_QUERY_NODES::QueryBodyNode> Allocator;

		template <class Note>
		Note ** runQuery(const wstring& string, const ContainerLU<Note>& containers, const NoteDB<Note>& db, unsigned& total, const unsigned node_count_size = 512)
		{

			unsigned count = node_count_size;

			Note ** out_B, **active_B;

			// Allocate stack space for note pointers.
			Note * active_buffer[count];
			Note * out_buffer[count];

			active_B = active_buffer;
			out_B = out_buffer;

			Token tk(string);

			try {

				auto query_buffer = HC_Parser::parse<Allocator, HC_TEMP::Data<Allocator, RUMINATE_QUERY_NODES::NodeFunctions<Allocator>>>(tk);

				auto node = query_buffer.getRootObject();

				wcout << (*node) << endl;

				if (node) {

					if (node->container) {

						total = 0;

						filterContainer<Note>(*(node->container), containers, db, total, node_count_size, out_B);
					}

					if(node->filter) {

						active_B = out_B;

						filterNotes<Note>(*(node->filter), active_B, out_B, total);






					}

					if(node->sort) {

					}
				}
			} catch (int e) {
				std::cout << e << std::endl;
			}

			if(total > 0) {

				Note ** ptr = new Note *[total] ;

				std::memcpy(ptr, out_B, total<<3);

				return ptr;
			}

			return nullptr;
		}

	}
}
