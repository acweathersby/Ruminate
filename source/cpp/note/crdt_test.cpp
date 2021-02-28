#pragma once

#include <cstring>
#include <iostream>
#include <sstream>
#include <vector>

#include "string/crdt.h"

using namespace RUMINATE;
using namespace RUMINATE::STRING;
using std::vector;
using std::wstring;

typedef OPString<OPBuffer<ASCII>> JSCRDTString;

int main(int arg_c, char ** arg_v){
    
    JSCRDTString* obj = new JSCRDTString();

    std::cout << *obj << "Hello World"  << std::endl;
    std::cout << *obj << "Hello World"  << std::endl;
    std::cout << *obj << "Hello World"  << std::endl;
    
    return 0;
}