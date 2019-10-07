#pragma once

#include "./base.h"
#include <string>
#include <cstring>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <unordered_map>
#include <system_error>

#define RUMINATE_FILE_EXTENSION L".rnote"

/*
 *  File DB is NOT a concurrent DB system.
 *  Data is stored in ruminate.note file objects.
 * 	Containers are literally mapped to file system folders.
 *
 *  Any file can be made into a note. The file store will automatically convert file contents into a rnote.
 *  Rnote files have a header containing UID and time stamp, note body data, and a footer comprising the tags of the note.
 *  The header is the first line in the file
 */


namespace RUMINATE
{

	namespace fs = std::filesystem;
	namespace DB
	{

		static wstring non_rnote_extensions = L".txt";

		static bool acceptedNonRnoteExtensions(const wstring ext, const wstring& extension_list)
		{
			return extension_list.find(ext) != std::wstring::npos;
		}


		class FileDB : public NoteDB
		{
		private:

			ContainerLU * ctr; //Root Container entry.

			wstring folder;

		public:

			/*
			 * Folder is the file system folder to mount the DB to.
			 */
			FileDB(std::wstring& f) : NoteDB() , folder(f) {}

			virtual ~FileDB() {};
			std::unordered_map<UID, Note *> notes; // Local note cache.

			virtual void MergeNoteLU(NoteLU& noteLU, ContainerLU& containerLU) {

				//Look through all files and create UID's for each item.

				std::error_code ec;

				try {
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
							containerLU[path];

							continue;
						}

						if(p.is_regular_file()) {

							std::ifstream file;

							unsigned long long modified = fs::last_write_time(p.path()).time_since_epoch().count();

							UID uid;

							wstring id = p.path().parent_path().wstring().substr(folder_size) +  L"/" + p.path().stem().wstring();

							file.open(p.path());

							if(file.is_open()) {
								if(acceptedNonRnoteExtensions(p.path().extension().wstring(), non_rnote_extensions)) {
									if(file.is_open()) {
										//Get Stored UID
										CRDTNote note;

										note.id = p.path().parent_path().wstring().substr(folder_size) +  L"/" + p.path().stem().wstring();

										note.tags.fromBracketedStream(file);

										note.body.fromFileStream(file);

										addNote(note);
									}

								} else {
									//Get Stored UID
									uid = uid << file;

									//Turn into real rnote;
								}
								file.close();
							}

							bool UPDATE = false;

							auto result = noteLU.find(uid);

							if(result != noteLU.end()) {
								//Update the notes location if the Modified date is newer.
								unsigned long long current_time = result->second.first;

								if(current_time < modified) {
									UPDATE = true;
									//remove entry from ContainerLU
									containerLU.removeNote(id, uid);
								}
								//Otherwise do nothing.
							} else {
								UPDATE = true;
								//Update the location and set the uid to sync.
							}

							if(UPDATE) {
								containerLU.addNote(id, uid);
								noteLU.insert( {uid, {modified, id}});
							}
						}
					}

				} catch(std::bad_alloc& e) {
					std::wcout << "Failed to allocate space " << e.what() << folder << std::endl;
				} catch(fs::filesystem_error& e) {
					std::wcout << "Failed to load folder " << e.what() << std::endl;
				} catch (...) {
					std::wcout << "General Error" << std::endl;
				}

				return;
			}

			virtual Note * getNote(UID uid, const NoteLU& lu) {

				auto result = lu.find(uid);

				if(result != lu.end()) {


					std::ifstream file;

					wstring path = folder + L"/" + result->second.second + RUMINATE_FILE_EXTENSION;

					std::wcout << path;

					cout << " ATSTSTSTSTST" << endl;

					file.open(path);

					if(file.is_open()) {

						CRDTNote * note = new CRDTNote();

						(*note) << file;

						return note;

					}
				}

				return nullptr;
			}

			virtual bool addNote(Note&note) {

				wstring path = note.id;

				path = folder + path + wstring(RUMINATE_FILE_EXTENSION);

				std::ofstream file;

				file.open(path);

				if(file.is_open()) {
					file << note;
				}

				file.close();

				return true;
			}

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
