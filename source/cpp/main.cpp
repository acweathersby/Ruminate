#include "./ui/cli.h"
#include <string>
#include <iostream>
#include <cstring>
#include <csignal>

#define LOCALE_EN_US



void signalHandler( int signum )
{
	cout << "Interrupt signal (" << signum << ") received.\n";

	// cleanup and close up stuff here
	// terminate program

	exit(signum);
}

int main(int c, char * args[])
{
	signal(SIGINT, signalHandler);
	wstring str = wstring(L"/home/anthony/test");
	cli(str);
}
