#include "note/id/id.h"
#include <boost/algorithm/string/trim.hpp>

using namespace RUMINATE::NOTE;

using boost::algorithm::trim_copy;

void getContainerParts(const std::wstring & str, std::wstring & name, std::wstring & container)
{
    if (str.size() > 0) {

        std::wstring string;

        string = trim_copy(str);

        unsigned i = 0, last_del = 0;

        while (i < string.size()) {
            if (string[i] == Delimiter) last_del = i;
            i++;
        }

        name      = string.substr(last_del + 1);
        container = string.substr(0, last_del);
    }
}

ID::ID(const std::wstring & str) { getContainerParts(str, name_, container_); };

ID & ID::operator=(const std::wstring & str)
{
    getContainerParts(str, name_, container_);
    return *this;
};

const std::wstring ID::toJSONString() const
{
    std::wstring str;
    return str;
};

std::ostream & ID::toJSONString(std::ostream & stream) const { return stream << toUTF8(filepath()); };

std::wstring ID::filepath() const
{
    std::wstring str;

    str = container_ + Delimiter + name_;

    return str;
};

std::wstring ID::name() const { return name_; };

std::wstring ID::container() const { return container_; };