#pragma once
#include "./base.h"
#include <cstring>
#include <filesystem>
#include <fstream>
#include <iostream>

#define RUMINATE_FILE_EXTENSION ".rnote"

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
		template<class Note>
		class file_db : public NoteDB<Note>
		{
		private:
			ContainerLU<Note> ctr; //Root Container entry.

		public:

			/*
			 * Folder is the file system folder to mount the DB to.
			 */
			file_db(std::string folder) : NoteDB<Note>() {
				fs::recursive_directory_iterator iter(folder);

				//Iterate through all obects in folder and -
				// push file information to cache.
				// Cache
				// read any ruminate files and push UID data to ContainerLU cache.
				// convert any text file into a ruminate note and push UID to ContainerLU cache.

				for(auto& p: iter) {
					if(p.is_directory()) {
						//Load directory information into store.

						//Strip path of the any leading . characters
						auto path = p.path().wstring().substr(folder.size());

						//Use string indexing to precache the container.
						ctr[path];

						continue;
					}

					if(p.is_regular_file()) {
						if(p.path().extension() == RUMINATE_FILE_EXTENSION) {

						} else {
							//Read file into new note.

							std::ifstream file;

							file.open(p.path());

							if(file.is_open()) {
								Note * note = new Note();

								note->id = p.path().stem().wstring();

								note->body << file;

								file.close();

								addNote(*note);

//								std::wcout << (*note).body.getValue() << endl;

							}
						}
					}
				}
			}

			virtual ~file_db() {};

			virtual bool addNote(Note&) {
				return false;
			}

			virtual Note& getNote(const UID& uid) {
				return * (Note *)(void *) nullptr;
			}

			virtual ContainerLU<Note>& getContainerTree() {
				return * (ContainerLU<Note> *)(void *) nullptr;
			};

		};

	}

}
