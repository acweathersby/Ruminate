#include <iostream>
#include "./container/container.h"
#include "./note/note.h"
#include "./uid/uid.h"
#include "./query/query.h"
#include "./database/base.h"
#include "./string/crdt.h"

using namespace crdt;
using namespace RUMINATE;
using namespace RUMINATE::NOTE;
using namespace RUMINATE::CONTAINER;
using namespace RUMINATE::DB;
using namespace RUMINATE::TAG;
using namespace RUMINATE::QUERY;
using namespace std;

typedef CharOp <OP_ID, OPChar<ASCII>> ASCII_OP;
typedef OPString<ASCII_OP, OPBuffer<ASCII_OP>> JSCRDTString;
typedef Note<JSCRDTString> CRDTNote;

int main(int c, char ** args)
{
	//Create a few notes and place their uids in the container catch.

	UID id1;
	UID id2;
	CRDTNote NoteA(id1);
	CRDTNote NoteB(id2);

	NoteA.id = L"/test/me/now/a";
	NoteB.id = L"/test/me/now/b";

	NoteA.body.insert(0,L"This is some test text.");
	NoteB.body.insert(0,L"This is also some test text.");

	ContainerLU<CRDTNote> container;
	NoteDB<CRDTNote> db;

	db.addNote(&NoteA);
	db.addNote(&NoteB);

	cout << sizeof(UID) << endl;
	cout << sizeof(CRDTNote) << endl;
	cout << sizeof(ContainerLU<CRDTNote>) << endl;
	cout << container.containers.size() << endl;

	container.addNote(NoteA);
	container.addNote(NoteB);

	unsigned count;
	auto b = runQuery(L"/test/me/now/a? tree", container, db, count);
	cout << count << endl;
	wcout << b[0]->id << endl;
}
