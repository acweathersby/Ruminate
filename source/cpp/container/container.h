#pragma once
#include "../uid/uid.h"
#include "../note/note.h"
#include <unordered_map>
#include <vector>
#include <cstring>

/** Classes for dealing with Notes based on there id (container location) */

namespace RUMINATE
{
	namespace CONTAINER
	{
		using std::wstring;
		using std::vector;
		using std::unordered_map;
		using std::cout;
		using std::endl;

		typedef vector<UID> UIDList;

		const wchar_t Delimiter = L'/';

		template<class Note>
		struct ContainerLU {
			wstring id;

			unordered_map<wstring, ContainerLU<Note>*> containers;

			UIDList uids;

			ContainerLU() {}

			ContainerLU<Note>& operator [] (const wstring string) {
				int i = 0, start = 0;

				if(string[i] == Delimiter)
					start++, i++;

				if(i >= string.size())
					return *this;

				while(i < string.size() && string[i] != Delimiter)
					i++;

				wstring str = (string.substr(start, i - start)),
				        rest = string.substr(i);

				ContainerLU<Note> * sub = nullptr;

				auto iter = containers.find(str);

				if(iter != containers.end()) {
					sub = iter->second;
				} else {

					sub = new ContainerLU<Note>();

					sub->id = str;

					containers.insert( {str, sub} );
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
				for(auto iter = uids.begin(); iter != uids.end(); iter++) {
					cout << offset << "sdf" <<  endl;
					cout << *iter << endl;
					buffer[offset++] = *iter;
				}
			}

			void addContainer(const ContainerLU<Note>& container) {
				const wstring id = container.id;
				containers.insert( {id, &container});
			}

			void removeContainer(const ContainerLU<Note>& container) {
				if(containers.find(container.id) != containers.end())
					containers.erase(container.id);
			}

			void addNote(const Note& note) {

				//Retrive only the portion of the note preceding the last delemiter;
				unsigned i = 0, last_del = 0;

				const wstring& id = note.id;

				while(i < id.size()) {
					if(id[i] == Delimiter)
						last_del = i;
					i++;
				}

				(*this)[id.substr(0, last_del)].addUID(note.uid);
			}

			void addUID(const UID& uid) {
				uids.push_back(uid);
			}
		};
	}
}
