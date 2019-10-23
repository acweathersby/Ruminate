#include "./uid.h"
#include <chrono>

using namespace RUMINATE;

UID::UID()
{
    time_t t;
    time(&t);
    srand(time(0));
    created_time = (std::chrono::high_resolution_clock::now().time_since_epoch().count());
    ;
    random = dist(mt);
}

UID::UID(unsigned n)
{
    magic        = 0;
    created_time = 0;
    random       = 0;
}

UID::UID(const RUMINATE_COMMAND_NODES::UID_UID_n & uid)
{
    created_time = uid.created;
    random       = uid.random;
}

std::wstring UID::toJSONString() const
{
    std::wstring string(L"{\"type\":\"RUMI-UID\", \"created_time\":");
    string += std::to_wstring(created_time);
    string += wstring(L", \"random\":");
    string += std::to_wstring(random);
    string += wstring(L"}");
    return string;
}

std::ostream & UID::toJSONString(std::ostream & stream) const
{
    return stream << std::hex << "RUMI-" << created_time << "-" << random << std::dec;
}