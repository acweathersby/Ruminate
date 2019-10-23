#include "ui/cli.h"

#include <filesystem>
#include <iostream>
#include <thread>

bool cli(wstring & filepath)
{
    FileDB<RUMINATE::NOTE::BasicNote> filedb(filepath);

    DBRunner dbr;

    dbr.addDatabase(&filedb);

    try {
        RUMINATE::NETWORK::Server svr(dbr, 15658);
        svr.run();
    } catch (std::exception & e) {
        std::cout << e.what() << std::endl;
        exit(222);
    }

    // Create a few notes and place their uids in the container catch.
    wstring string;

    while (1) {
        std::cout << "Let's hear it now:" << std::endl;
        std::getline(std::wcin, string);

        if (L"q" == string) // Exit if q is entered at prompt.
            break;

        auto & result = RUMINATE::COMMAND::runStringCommand(string, dbr);

        while (!result.READY())
            // Sleep this thread; Wait until the result has data.
            std::this_thread::yield();
        std::cout << result.size() << endl;
        for (int i = 0; i < result.size(); i++) std::wcout << result[i].toJSONString() << endl;

        std::getline(std::wcin, string);
        std::cout << "\033[2J\033[1;1H";
    }

    filedb.close();

    return true;
}
