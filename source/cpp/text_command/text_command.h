#pragma once

#include <cstring>
#include <string>
#include <thread>
#include <vector>

#include "../compiler/compiler.h"
#include "../database/include/db_runner.h"
#include "../note/note.h"
#include "../query/query.h"
#include "../uid/uid.h"
#include "./text_command_result.h"
#include "./text_command_result_codes.h"

namespace RUMINATE
{
    namespace COMMAND
    {

        using namespace QUERY;
        using namespace DB;
        using namespace NOTE;

        /*
         * Text result static objects.
         */

        static ADD_FAILURE_TOO_MANY_RESULTS add_failure_too_many_results;
        static ADD_FAILURE_NO_UID_MATCH add_failure_no_uid_match;
        static ADD_SUCCESS add_success;
        static REMOVE_SUCCESS remove_success;
        static REMOVE_FAILURE_UID_DOES_NOT_MATCH remove_failure_uid_does_not_match;
        static REMOVE_FAILURE_NO_RESULTS remove_failure_no_results;
        static RETRIEVE_SUCCESS retrieve_success;
        static TEXT_COMMAND_FAILURE text_command_failure;

        /*
         * Update note data from a NOTE_Note_n object
         */
        bool UpdateNote(Note & note, const NOTE_Note_n & note_node, DBRunner & db);

        void ThreadRunner(const wchar_t *, DBRunner *, TextCommandResult *);

        /*
            Runs a ruminate text command
        */
        static inline TextCommandResult & runStringCommand(const std::wstring & string, DBRunner & db,
                                                           TextCommandResult ** ptr = nullptr)
        {
            wchar_t * buffer = new wchar_t[string.size() + 1];

            std::memcpy(buffer, string.c_str(), sizeof(wchar_t) * (string.size() + 1));

            TextCommandResult & result = *new TextCommandResult(db);

            if (ptr) (*ptr) = &result;

            std::thread first(ThreadRunner, buffer, &db, &result);

            first.detach();

            return result;
        }
    } // namespace COMMAND
} // namespace RUMINATE
