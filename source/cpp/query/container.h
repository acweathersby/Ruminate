#pragma once

#include <cstring>
#include "../compiler/nodes.h"
#include "../uid/uid.h"
#include "../note/note.h"
#include "../container/container.h"
#include "../database/base.h"
//#include "./container.h"

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
					cout << "TEST ME  "<< id.list.size() << " " << i << endl;
					if (i == (id.list.size()-1))
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
			if(!container_query.list) {
				container.fillUIDBuffer(&uids[total]);
				total += container.uidSize();
				return 1;
			}

			auto ctr = (* (container_query.list))[container_offset];

			if(container.id == L"" || ctr->IS_WILD_CARD() || compareQueryIdentifier(*ctr, container.id) ) {

				auto ctrs = container.containers;

				unsigned offset = (FOLLOWING_WILD_CARD || container.id == L"") ? container_offset: container_offset + 1;

				if (offset >= container_query.list->size()) {

					if(container.uidSize() + total < max_uids) {

						container.fillUIDBuffer(&uids[total]);

						total += container.uidSize();
					}
				} else if (container.containerSize() > 0) {
					for(auto iter = ctrs.begin(); iter != ctrs.end(); iter++)
						recurseContainerMatcher<Note>(container_query, *(iter->second), total, max_uids, uids,  offset, FOLLOWING_WILD_CARD);
				}
			}

			return -1;
		}

		//Filters out nodes based on container query.
		template<class Note>
		int filterContainer(ContainerClause& container, const ContainerLU<Note>& containers, const NoteDB<Note>& db, unsigned& total_results, unsigned max_results, Note ** buffer)
		{
			unsigned uid_buffer_size = 512;

			UID * uids = (UID *)malloc(sizeof(UID)*uid_buffer_size);

			total_results = 0;

			if(!uids) return -1;

			recurseContainerMatcher<Note>(container, containers, total_results, uid_buffer_size, uids);

			for(int i = 0; i < total_results; i++)
				buffer[i] = db.getNote(uids[i]);

			if(container.id) {

				unsigned j = 0;

				for(int i = 0; i < total_results; i++) {
					auto note = buffer[i];

					if(compareQueryIdentifier(*container.id, note->id_name()))
						buffer[j++] = note;
				}

				total_results = j;
			}

			free(uids);

			return 0;
		}
	}
}
