#pragma once

#include "../note/note.h"
#include "../database/include/db_runner.h"

namespace RUMINATE
{

	namespace QUERY
	{

		using namespace DB;

		class QueryResult final
		{

		private:

			wstring query;
			int length = 0;
			bool READY_BOOL = false;
			unsigned * references;
			DBRunner& db;


		public:
			UID * uids = nullptr;

			friend std::ostream& operator << (std::ostream& stream, const QueryResult query) {
				stream << "{type:\"search result\", size: " << query.length;
				stream << "}";
				stream << std::endl;
				return stream;
			}

			unsigned size() const {return length;};

			QueryResult(const wstring& q, DBRunner& d) : db(d) {
				references = new unsigned(1);
				READY_BOOL = true;
				query = q;
			}

			QueryResult(const wstring& q, UID * result, unsigned size, DBRunner& d) : db(d) {
				references = new unsigned(1);
				uids = result;
				length = size;
				READY_BOOL = true;
				query = q;
			}

			QueryResult(const QueryResult& query): db(query.db) {
				uids = query.uids;
				length = query.length;
				READY_BOOL = query.READY_BOOL;

				references = query.references;

				(*references)++;
			}

			~QueryResult() {
				(*references)--;

				if(*references == 0 && uids) {
					free(uids);
					delete references;
				}
			}

			bool READY() const noexcept {
				return READY_BOOL;
			}

			Note& operator[] (unsigned index) {

				if(index+1 > length || !READY_BOOL)
					return NullNote;

				return * db.getNote(uids[index]);
			}
		};
	}
}
