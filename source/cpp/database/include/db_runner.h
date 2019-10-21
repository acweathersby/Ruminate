#pragma once

#include <cstring>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <string>
#include <system_error>
#include <unordered_map>
#include <vector>

#include "./base.h"

namespace RUMINATE {

    namespace DB {

        class DBRunner final {
            std::unordered_map<UID, Note *> notes; // Local note cache.

            vector<NoteDB *> databases;

            // NoteDB * primary_db = nullptr;

            ContainerLU ctr; // Root Container entry.

            NoteLU noteLU;

            /*
   * Synchronizes note data between databases.
   */
            void updateLU() {
                for (auto iter = databases.begin(); iter != databases.end(); iter++) {
                    NoteDB & db = **iter;
                    db.MergeNoteLU(noteLU, ctr);
                }
            }

          public:
            DBRunner() {}

            ~DBRunner() {}

            /*
   * 	Intended to be called by the process runtime at regular intervals to
   * handle database upkeep tasks such syncronization and cache purging.
   */
            void update() {}

            int addDatabase(NoteDB * db) {
                for (auto iter = databases.begin(); iter != databases.end(); iter++)
                    if (*iter == db)
                        return -1;

                databases.push_back(db);

                updateLU();

                return 0;
            }

            bool addNote(Note & note) {
                std::wcout << note.uid.toJSONString() << "  " << note.id << std::endl;
                notes.insert({note.uid, &note});
                // add note to containers
                ctr.addNote(note);
                // Update databases.
                return true;
            }

            bool deleteNote(Note & note) {
                ctr.removeUID(note.uid);
                noteLU.erase(note.uid);
                // Remove from databases.
                return true;
            }

            bool updateNote(Note & note) {
                UID uid = note.uid;

                wstring & id = note.id;

                wstring old_id = getNoteID(uid);

                if (old_id != id)
                    relocateNote(note, old_id);

                return true;
            }

            void relocateNote(const Note & note, const wstring & old_id) {
                ctr.removeNote(old_id, note.uid);
                ctr.addNote(note.id, note.uid);
                noteLU.insert({note.uid, {note.modified_time, note.id}});
            }

            wstring getNoteID(const UID & uid) {
                auto result = noteLU.find(uid);

                if (result != noteLU.end())
                    return result->second.second;

                auto note = getNote(uid);

                if (note)
                    return note->id;

                return wstring(L"");
            }

            Note * getNote(const UID & uid) {

                Note * note = nullptr;

                // Check local cache for the existence of the note.
                auto iter = notes.find(uid);

                if (iter != notes.end()) {
                    return (iter->second);
                }

                // Check databases for the note. If the note exists, add to all other
                // databases. unsigned active_index = 0;

                for (auto iter = databases.begin(); iter != databases.end(); iter++) {
                    note = (*iter)->getNote(uid, noteLU);

                    if (note) {
                        for (auto iter2 = databases.begin(); iter2 != databases.end();
                             iter2++) {
                            if (iter == iter2)
                                continue;

                            (*iter)->addNote(*note);
                        }

                        notes.insert({note->uid, note});

                        return note;
                    }
                }

                std::cout << "MADNESS!" << std::endl;

                return nullptr;
            }

            const ContainerLU & getContainerTree() const { return ctr; };

          private:
            void syncDB() {}
        };
    } // namespace DB
} // namespace RUMINATE
