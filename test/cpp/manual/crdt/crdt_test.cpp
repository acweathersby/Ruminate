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

const static int GOOD_SHOW = 0;

int main(int arg_c, char ** arg_v){
    
    JSCRDTString* obj = new JSCRDTString();

    obj->insert(2, (unsigned)'A');
    obj->insert(3, (unsigned)'B');
    obj->insert(4, (unsigned)'C');
    obj->insert(5, (unsigned)'R');
    obj->insert(6, (unsigned)'E');
    obj->insert(7, (unsigned)'F');

    std::cout << *obj << "Hello World"  << std::endl;
    std::cout << *obj << "Hello World"  << std::endl;
    std::cout << *obj << "Hello World"  << std::endl;
    
    return GOOD_SHOW;
}