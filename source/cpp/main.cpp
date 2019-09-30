#include <iostream>
#include <string>
#include <cstring>
#include "./container/container.h"
#include "./note/note.h"
#include "./uid/uid.h"
#include "./query/query.h"
#include "./database/file_db.h"
#include "./string/crdt.h"

using namespace RUMINATE;
using namespace RUMINATE::STRING;
using namespace RUMINATE::NOTE;
using namespace RUMINATE::CONTAINER;
using namespace RUMINATE::DB;
using namespace RUMINATE::TAG;
using namespace RUMINATE::QUERY;
using namespace RUMINATE::DB;
using namespace std;

typedef CharOp <OP_ID, OPChar<ASCII>> ASCII_OP;
typedef OPString<ASCII_OP, OPBuffer<ASCII_OP>> JSCRDTString;
typedef Note<JSCRDTString> CRDTNote;

int main(int c, char ** args)
{
	file_db<CRDTNote> db(L"/home/anthony/test");
	//Create a few notes and place their uids in the container catch.
	wstring string;

	while(1) {

		std::cout << "Let's hear it now:" << std::endl;
		std::getline(std::wcin, string);

		unsigned total = 0;

		CRDTNote ** notes = runQuery<CRDTNote, JSCRDTString>(string, db, total);

		std::cout  << "test " << total << endl;

		for(int i = 0; i < total; i++) {
			CRDTNote& note = *notes[i];
			std::wcout << note.toJSONString() << endl;
		}

		std::getline(std::wcin, string);
		std::cout << "\033[2J\033[1;1H";
	}



	db.close();
}
