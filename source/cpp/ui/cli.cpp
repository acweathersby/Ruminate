#include "./cli.h"
#include <iostream>
#include <thread>

bool cli(wstring filepath)
{


	FileDB filedb(filepath);

	DBRunner db;

	db.addDatabase(&filedb);

	//Create a few notes and place their uids in the container catch.
	wstring string;

	while(1) {

		std::cout << "Let's hear it now:" << std::endl;
		std::getline(std::wcin, string);

		QueryResult query = runQuery(string, db);

		while (!query.READY()) {
			//Sleep this thread;
			std::this_thread::yield();
		}

		cout << query << endl;

		for(int i = 0; i < query.size(); i++) {
			std::wcout << query[i].toJSONString() << endl;
		}

		std::getline(std::wcin, string);
		std::cout << "\033[2J\033[1;1H";
	}

	filedb.close();
}
