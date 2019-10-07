#pragma once

#include "../note/note.h"
#include "../database/db_runner.h"

namespace RUMINATE
{

	namespace QUERY
	{

		using namespace DB;

		class QueryResult final
		{

		private:

			wstring query;
			UID * uids = nullptr;
			int length = 0;
			bool READY = false;
			unsigned * references;
			DBRunner& db;


		public:

			friend std::ostream& operator << (std::ostream& stream, const QueryResult query) {
				stream << "; size: " << query.length;
				stream << ";";
				stream << std::endl;
				return stream;
			}

			unsigned size() {return length;};

			QueryResult(const wstring& q, DBRunner& d) : db(d) {
				references = new unsigned(1);
				READY = true;
				query = q;
			}

			QueryResult(const wstring& q, UID * result, unsigned size, DBRunner& d) : db(d) {
				references = new unsigned(1);
				uids = result;
				length = size;
				READY = true;
				query = q;
			}

			QueryResult(const QueryResult& query): db(query.db) {
				uids = query.uids;
				length = query.length;
				READY = query.READY;

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

			Note& operator[] (unsigned index) {

				if(index+1 > length || !READY)
					return NullNote;

				return * db.getNote(uids[index]);
			}
		};
	}
}
