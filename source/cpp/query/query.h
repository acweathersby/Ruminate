#pragma once

#include <cstring>
#include "../note/uid/uid.h"
#include "../note/note.h"
#include "../note/tags/tags.h"
#include "../container/container.h"
#include "../database/include/base.h"

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

		using namespace RUMINATE_COMMAND_NODES;

		static QueryResult runQuery(const RUMINATE_COMMAND_NODES::QUERY_Body_n& node, DBRunner& db)

		{
			const unsigned node_count_size = 512;

			unsigned count = node_count_size, total = 0;

			UID * out_B, *active_B;

			// Allocate stack space for note pointers.
			UID * out_buffer = (UID *) malloc(sizeof(UID) * count * 2);
			UID * active_buffer = out_buffer + count;

			active_B = active_buffer;
			out_B = out_buffer;

			try {

				if (node.container) {

					total = 0;

					filterContainer(*(node.container), db, total, node_count_size, out_B);
				}

				if(node.filter) {

					active_B = out_B;

					filterNotes(*(node.filter), db, active_B, out_B, total);
				}

				if(node.sort) {

				}

			} catch (int e) {
				std::cout << e << std::endl;
			}

			if(total > 0)
				return QueryResult(wstring(L""), out_buffer, total, db);

			free(out_buffer);

			return QueryResult(wstring(L""), db);
		}
	}
}
