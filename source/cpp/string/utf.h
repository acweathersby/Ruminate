#pragma once

#include <cstring>
#include <iostream>
#include <string>

/** !!!!!!!!!!!!HACKS!!!!!!!!!!!! ONLY FOR ASCII. NEED PROPER UT8 to UTF16/UTF32 conversion **/

static std::wstring & operator+=(std::wstring & str, char & c) {
    str += (wchar_t) c;
    return str;
}

static std::wstring & operator<<(std::wstring & str, std::istream & stream) {
    char input;

    while (stream.get(input)) {
        str += (wchar_t) input;
    }

    return str;
}

static std::ostream & operator<<(std::ostream & stream, const std::wstring & str) {
    for (auto t = str.begin(); t != str.end(); t++)
        stream << (char) *t;

    return stream;
}


// END HACKS //