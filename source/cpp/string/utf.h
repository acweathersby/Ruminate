#pragma once

#include <codecvt>
#include <cstring>
#include <iostream>
#include <sstream>
#include <string>

static std::wstring_convert<std::codecvt_utf8<wchar_t>> converter;

static std::string toUTF8(const std::wstring & string) { return converter.to_bytes(string); }

// static std::string toUTF8(const std::wstring string) { return converter.to_bytes(string); }

static std::wstring fromUTF8(const std::string & string) { return converter.from_bytes(string); }

// static std::wstring fromUTF8(const std::string string) { return converter.from_bytes(string); }

static std::wstring & operator+=(std::wstring & str, char & c)
{
    str += (wchar_t) c;
    return str;
}

static std::wstring & operator<<(std::wstring & str, std::istream & stream)
{
    std::stringbuf input;

    stream >> &input;

    str = fromUTF8(input.str());

    return str;
}

static std::ostream & operator<<(std::ostream & stream, const std::wstring & str)
{

    stream << toUTF8(str);

    return stream;
}


// END HACKS //