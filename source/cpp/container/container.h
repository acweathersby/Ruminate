#pragma once

#include <cstring>
#include <string>
#include <unordered_map>
#include <vector>

#include "../note/note_include.h"
#include "../uid/uid.h"

/** Classes for dealing with Notes based on there id (container location) */

#define Delimiter (L'/')

namespace RUMINATE {
    using namespace NOTE;

    namespace CONTAINER {
        using std::cout;
        using std::endl;
        using std::unordered_map;
        using std::vector;
        using std::wstring;

        typedef vector<UID> UIDList;

        struct ContainerLU {

            wstring id;

            unordered_map<wstring, ContainerLU *> containers;

            UIDList uids;

            ContainerLU() {}

            ContainerLU & operator[](const wstring & string) {
                int i = 0, start = 0;

                if (string[i] == Delimiter)
                    start++, i++;

                if (i >= string.size())
                    return *this;

                while (i < string.size() && string[i] != Delimiter)
                    i++;

                wstring str  = (string.substr(start, i - start)),
                        rest = string.substr(i);

                ContainerLU * sub = nullptr;

                auto iter = containers.find(str);

                if (iter != containers.end()) {
                    sub = iter->second;
                } else {

                    sub = new ContainerLU();

                    sub->id = str;

                    containers.insert({str, sub});
                }

                return (*sub)[rest];
            }

            unsigned containerSize() const {
                return containers.size();
            }

            unsigned uidSize() const {
                return uids.size();
            }

            void fillUIDBuffer(UID * buffer) const {
                unsigned offset = 0;
                for (auto iter = uids.begin(); iter != uids.end(); iter++)
                    buffer[offset++] = *iter;
            }

            void addContainer(ContainerLU & container) {
                wstring id = container.id;
                containers.insert({id, (&container)});
            }

            void removeContainer(const ContainerLU & container) {
                if (containers.find(container.id) != containers.end())
                    containers.erase(container.id);
            }

            void removeNote(const wstring & id, const UID & uid) {
                //Retrive only the portion of the note preceding the last delemiter;
                unsigned i = 0, last_del = 0;

                while (i < id.size()) {
                    if (id[i] == Delimiter)
                        last_del = i;
                    i++;
                }

                (*this)[id.substr(0, last_del)].removeUID(uid);
            }

            void addNote(const wstring & id, const UID & uid) {

                //Retrive only the portion of the note preceding the last delemiter;
                unsigned i = 0, last_del = 0;

                while (i < id.size()) {
                    if (id[i] == Delimiter)
                        last_del = i;
                    i++;
                }

                std::wcout << id << endl;

                (*this)[id.substr(0, last_del)].addUID(uid);
            }

            void addNote(const Note & note) {
                return addNote(note.id, note.uid);
            }

            void addUID(const UID & uid) {
                uids.push_back(uid);
            }

            void removeUID(const UID & uid) {
                for (auto iter = uids.begin(); iter != uids.end(); iter++)
                    if ((*iter) == uid) {
                        uids.erase(iter);
                        return;
                    }
            }
        };
    } // namespace CONTAINER
} // namespace RUMINATE
