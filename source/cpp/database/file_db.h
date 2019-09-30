#pragma once
#include "./base.h"
#include <string>
#include <cstring>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <unordered_map>

#define RUMINATE_FILE_EXTENSION L".rnote"

/*
 *  File DB is NOT a concurrent DB system.
 *  Data is stored in ruminate.note file objects.
 * 	Containers are literally mapped to file system folders.
 *
 *  Any file can be made into a note. The file store will automatically convert file contents into an file rnote.
 *  Rnote files have a header containing UID and time stamp, note body data, and a footer comprising the tags of the note.
 *  The header is the first line in the file
 * 	The footer is the last line in the file.
 *
 */


namespace RUMINATE
{
	namespace fs = std::filesystem;
	namespace DB
	{

		wstring non_rnote_extensions = L".txt";

		bool acceptedNonRnoteExtensions(const wstring ext, const wstring& extension_list)
		{
			return extension_list.find(ext) != std::wstring::npos;
		}


		template<class Note>
		class file_db : public NoteDB<Note>
		{
		private:
			std::unordered_map<UID, Note *> notes;
			ContainerLU<Note> ctr; //Root Container entry.
			wstring folder;

		public:

			/*
			 * Folder is the file system folder to mount the DB to.
			 */
			file_db(std::wstring f) : NoteDB<Note>() , folder(f) {
				fs::recursive_directory_iterator iter(folder);

				unsigned folder_size = folder.size();

				//Iterate through all obects in folder and -
				// push file information to cache.
				// Cache
				// read any ruminate files and push UID data to ContainerLU cache.
				// convert any text file into a ruminate note and push UID to ContainerLU cache.

				for(auto& p: iter) {
					if(p.is_directory()) {
						//Load directory information into store.

						//Strip path of the any leading . characters
						auto path = p.path().wstring().substr(folder_size);

						//Use string indexing to precache the container.
						ctr[path];

						continue;
					}

					if(p.is_regular_file()) {

						std::ifstream file;
						file.open(p.path());

						if(file.is_open()) {

							if(p.path().extension() == RUMINATE_FILE_EXTENSION) {

								Note * note = new Note();

								(*note) << file;

								addNote(*note);

							} else if(acceptedNonRnoteExtensions(p.path().extension().wstring(), non_rnote_extensions)) {

								Note * note = new Note();

								note->id = p.path().parent_path().wstring().substr(folder_size) +  L"/" + p.path().stem().wstring();

								note->tags.fromBracketedStream(file);

								note->body.fromFileStream(file);

								addNote(*note);
							}
						}
						file.close();
					}
				}
			}

			virtual ~file_db() {};

			void saveNotes() {
				for(auto& n : notes) {
					Note& note = *(n.second);
					wstring path = note.id;
					path = folder + path + wstring(RUMINATE_FILE_EXTENSION);

					std::ofstream file;
					file.open(path);

					if(file.is_open()) {
						file << note;
					}
					file.close();
				}
			}

			virtual bool addNote(Note& note) {
				std::wcout << note.uid.toJSONString() << "  " << note.id << std::endl;
				notes.insert( {note.uid, &note});
				//add note to containers
				ctr.addNote(note);
				return true;
			}

			virtual Note * getNote(const UID& uid) const {
				auto iter = notes.find(uid);

				if(iter != notes.end()) {
					std::wcout << uid.toJSONString() << "  " << iter->second->id << std::endl;
					return (iter->second);
				}

				return (new Note()); // <<<< MEMORY LEAK <<<<<<<
			}

			virtual const ContainerLU<Note>& getContainerTree() const {
				return ctr;
			};

			virtual void close() {
				for(auto& n : notes) {
					Note& note = *(n.second);
					wstring path = note.id;
					path = folder + path + wstring(RUMINATE_FILE_EXTENSION);

					std::ofstream file;
					file.open(path);

					if(file.is_open())
						file << note;

					file.close();
				}
			};
		};
	}
}
