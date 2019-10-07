#include "./ui/cli.h"
#include <string>
#include <iostream>
#include <cstring>

int main(int c, char * args[])
{
	//Read first argument into string.
	if (c > 1) {
		string str( args[1] );

		wstring wstr (str.begin(), str.end());
		cli(wstr);
	}
}
