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

namespace RUMINATE {
    namespace COMMAND {

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
        static bool UpdateNote(Note & note, const NOTE_Note_n & note_node, DBRunner & db) {
            bool NOTE_UPDATED = false;
            //upate the note according to the settings of the note type.
            if (note_node.body) {
                NOTE_UPDATED = true;
                note.updateBody(*note_node.body);
            }

            if (note_node.ctr) {
                NOTE_UPDATED = true;

                wstring container_id = note_node.ctr->toString();

                note.id = container_id;
            }

            if (note_node.tags) {
                NOTE_UPDATED = true;
                note.updateTags(*note_node.tags);
            }

            if (NOTE_UPDATED)
                db.updateNote(note);

            wcout << note.toJSONString() << endl;

            return NOTE_UPDATED;
        }

        static void ThreadRunner(const std::wstring * s, DBRunner * d, TextCommandResult * r) {

            const std::wstring & string = *s;
            DBRunner & db               = *d;
            TextCommandResult & result  = *r;

            auto buffer = RUMINATE::COMPILER::compileWString(string);

            auto node = buffer.getRootObject<RUMINATE_COMMAND_NODES::Node>();
            cout << "Node Pointer " << (unsigned long long) node << endl;
            if (!node) {
                result.result = &text_command_failure;
                return;
            }

            switch (node->type) {

            default:
                break;

            case RUMINATE_COMMAND_NODES::NodeType::ADD: {

                result.type = TextCommandResult::ResultTypes::ADD;

                RUMINATE_COMMAND_NODES::COMMAND_Add_n & add_node = *(RUMINATE_COMMAND_NODES::COMMAND_Add_n *) node;

                if (add_node.hasUID()) {

                    //Try to find a matching note with UID signature. If none exist, DO NOT               } else if (add_node.hasContainer())  create a new note. UID MUST be a real UID value already present in
                    //the DB. If none exist, the user MUST supply an ADD command utilizing the Container Format in order to create a new note. This allows arbitrary
                    //UID values to be presented to the DB without corrupting the internal UID state of the DB.

                    UID uid(*add_node.uid);

                    Note * note = db.getNote(uid);

                    if (note) {
                        UpdateNote(*note, *add_node.data, db);
                        result.result = &add_success;
                    } else {
                        result.result = &add_failure_no_uid_match;
                    }

                } else if (add_node.hasContainer()) {
                    //Try to find node that fully matches container ID. If none exists, then create a new note with the signature.

                    //The note data node MUST container either tag data or body_string data.

                    //the optional type information will inform the system of what type of note to make.
                    unsigned results = 0;
                    unsigned count   = 500;

                    UID * out_buffer = (UID *) buffer.alloc(sizeof(UID) * count);

                    QUERY::filterContainer(*add_node.ctr, db, results, 500, out_buffer);

                    if (results == 1) {
                        Note * note = db.getNote(out_buffer[0]);

                        if (note) {
                            UpdateNote(*note, *add_node.data, db);
                            result.result = &add_success;
                        } else {
                            result.result = &add_failure_no_uid_match;
                        }
                    } else {
                        result.result = &add_failure_too_many_results;
                    }
                }

            }; break;

            case RUMINATE_COMMAND_NODES::NodeType::DELETE: {

                result.type = TextCommandResult::ResultTypes::DELETE;

                RUMINATE_COMMAND_NODES::COMMAND_Delete_n & delete_node = *(RUMINATE_COMMAND_NODES::COMMAND_Delete_n *) node;

                if (delete_node.hasQuery()) {

                    auto query_node = delete_node.query;

                    auto query = runQuery(*query_node, db);

                    result.addUIDs(query);

                    if (query.size() > 0) {
                        for (int i = 0; i < query.size(); i++)
                            db.deleteNote(query[i]);
                        result.result = &remove_success;
                    } else {
                        result.result = &remove_failure_no_results;
                    }

                } else if (delete_node.hasUIDList()) {

                    auto uid_list = delete_node.uids;

                    result.addUIDs(*uid_list);

                    if (result.size() > 0) {
                        for (int i = 0; i < result.size(); i++)
                            db.deleteNote(result[i]);

                        result.result = &remove_success;
                    } else
                        result.result = &remove_failure_uid_does_not_match;
                }

            }; break;

            case RUMINATE_COMMAND_NODES::NodeType::RETRIEVE: {

                result.type = TextCommandResult::ResultTypes::RETRIEVE;

                RUMINATE_COMMAND_NODES::COMMAND_Retrieve_n * retrieve_node = (RUMINATE_COMMAND_NODES::COMMAND_Retrieve_n *) node;

                if (retrieve_node->hasQuery()) {

                    auto query_node = retrieve_node->query;

                    auto query = runQuery(*query_node, db);

                    result.addUIDs(query);

                    result.result = &retrieve_success;

                } else if (retrieve_node->hasUIDList()) {

                    auto uid_list = retrieve_node->uids;

                    result.addUIDs(*uid_list);

                    result.result = &retrieve_success;
                }

            }; break;
            }
        }

        /*
			Runs a ruminate text command
		*/
        static TextCommandResult & runStringCommand(const std::wstring & string, DBRunner & db) {
            TextCommandResult & result = *new TextCommandResult(db);

            std::thread first(ThreadRunner, &string, &db, &result);

            first.detach();

            return result;
        }
    } // namespace COMMAND
} // namespace RUMINATE
