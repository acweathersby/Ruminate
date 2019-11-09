#pragma once

#include <iostream>
#include <string>

namespace RUMINATE
{
    template <class StringType>
    static void writeString(std::ostream & stream, const std::basic_string<StringType> & string)
    {
        unsigned size = string.size();
        stream.write((char *) &size, sizeof(size));
        stream.write((char *) string.c_str(), size * sizeof(StringType));
    }

    template <class StringType> static void readString(std::istream & stream, std::basic_string<StringType> & string)
    {
        unsigned size = string.size() + 1;

        stream.read((char *) &size, sizeof(size));

        StringType * buffer = new StringType[size];

        stream.read((char *) buffer, size * sizeof(StringType));

        string.assign(buffer, size);

        delete[] buffer;
    }


    template <class StringType>
    static void readString(std::istream & stream, std::basic_string<StringType> & string, StringType sentinel)
    {
        char c;

        string.clear();

        while (stream.get(c)) {
            if (c == sentinel) break;
            string += c;
        }
    }
} // namespace RUMINATE
