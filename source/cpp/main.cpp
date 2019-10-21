#include <csignal>
#include <cstring>
#include <iostream>
#include <string>

#include "./ui/cli.h"

#define LOCALE_EN_US

//IMPORTANT - INITIALIZE CRDT SITE. This may need to assigned using some preagreed site index based
//on client preferences.
unsigned RUMINATE::NOTE::CRDTNote::CRDT_SITE = 0;

void signalHandler(int signum) {
    cout << "Interrupt signal (" << signum << ") received.\n";

    // cleanup and close up stuff here
    // terminate program

    exit(signum);
}

int main(int c, char * args[]) {

    signal(SIGINT, signalHandler);
    wstring str = wstring(L"/home/anthony/test");
    cli(str);
}
