

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
#pragma once
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

		/**
			Parses query string and selects notes from input array that meet the query criteria.

			Selected notes are placed in the output buffer.
		**/

		bool compareQueryIdentifier(const Identifier& id, const wstring& string, bool FOLLOWING_WILD_CARD = false)
		{
			int offset = 0;

			for (int i = 0; i < id.list.size(); i++) {

				const wstring& str = *id.list[i];

				if (str == L"*") {
					if (i == id.list.size())
						return true;

					FOLLOWING_WILD_CARD = true;
					continue;
				}

				size_t start = string.find(str, offset);

				if (FOLLOWING_WILD_CARD || (int) start == 0) {

					offset = start + str.size();

					if (offset == string.size())
						return true;

					else continue;
				}

				return false;
			}

			return false;
		}

		template<class Note>
		int recurseContainerMatcher(const ContainerClause& container_query, const ContainerLU<Note>& container, unsigned& total, unsigned max_uids, UID * uids, unsigned container_offset = 0, unsigned FOLLOWING_WILD_CARD = 0)
		{

			if (container_offset >= container_query.list->size()) {
				if(container.uidSize() + total < max_uids) {
					container.fillUIDBuffer(&uids[total]);
					total += container.uidSize();
				}

				return 1;
			}

			if (container.containerSize() > 0) {
				auto ctr = (* (container_query.list))[container_offset];

				if(FOLLOWING_WILD_CARD || compareQueryIdentifier(*ctr, container.id) ) {

					FOLLOWING_WILD_CARD = ctr->IS_WILD_CARD();

					auto ctrs = container.containers;

					for(auto iter = ctrs.begin(); iter != ctrs.end(); iter++)
						recurseContainerMatcher<Note>(container_query, *(iter->second), total, max_uids, uids, container_offset + 1, FOLLOWING_WILD_CARD);
				}
			}

			return -1;
		}

//Filters out nodes based on container query.
		template<class Note>
		void filterContainer(ContainerClause& container, const ContainerLU<Note>& containers, const NoteDB<Note>& db, unsigned& total_results, unsigned max_results, Note ** buffer)
		{
			unsigned uid_buffer_size = 512;

			UID uids[uid_buffer_size];

			total_results = 0;

			recurseContainerMatcher<Note>(container, containers, total_results, uid_buffer_size, uids);
		}


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

				if (node) {

					if (node->container) {

						total = 0;

						auto query_container = node->container;

						filterContainer<Note>(*query_container, containers, db, total, node_count_size, out_B);
					}
				}

				if(node->filter) {

				}

				if(node->sort) {

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
