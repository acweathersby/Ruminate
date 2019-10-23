#pragma once

#include <cstring>
#include <string>
#include <vector>

#include "../compiler/compiler.h"
#include "../database/include/db_runner.h"
#include "../note/note.h"
#include "../query/query.h"
#include "../uid/uid.h"
#include "./text_command_result_codes.h"

namespace RUMINATE
{
    namespace COMMAND
    {
        using namespace QUERY;
        using namespace DB;
        using namespace NOTE;

        class TextCommandResult
        {

          private: // MEMBERS
            bool ready = false;

          public: // MEMBERS
            enum class ResultTypes { UNDEFINED, ADD, DELETE, RETRIEVE };

            ResultTypes type = ResultTypes::UNDEFINED;

            const TEXT_COMMAND_RESULT_CODES * result = nullptr;

            DBRunner & db;

            vector<UID> uids;

          public: // METHODS
            friend std::wostream & operator<<(std::wostream & stream, const TextCommandResult & tcr)
            {
                if (tcr.result) return stream << *tcr.result;
                return stream << L"No Result Has Been Received";
            }

            friend std::ostream & operator<<(std::ostream & stream, const TextCommandResult & tcr)
            {
                if (tcr.result) return stream << *tcr.result;
                return stream << L"No Result Has Been Received";
            }

            TextCommandResult(DBRunner & d) : db(d) {}

            TextCommandResult(const TextCommandResult & tx) : db(tx.db) { uids = tx.uids; }

            // Returns true when the result data has been populated.
            bool READY();

            // Return the number of notes retrieved from the text command.
            unsigned size();

            void addUIDs(const RUMINATE_COMMAND_NODES::UID_List_n & list);

            void addUIDs(const QueryResult & list);

            Note & operator[](unsigned index)
            {

                if (index >= size() || !READY()) return NullNote;

                Note * note = db.getNote(uids[index]);

                if (!note) return NullNote;

                return *note;
            }
        };
    } // namespace COMMAND
} // namespace RUMINATE
