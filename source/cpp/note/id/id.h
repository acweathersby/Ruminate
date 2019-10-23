#pragma once

#include "string/utf.h"
#include "utils/stream.h"

#include <cstring>
#include <iostream>
#include <string>

#define Delimiter (L'/')

namespace RUMINATE
{
    namespace NOTE
    {
        /**
            Wrapper class for a note container identifier.
        */
        class ID
        {
            std::wstring name_      = L"default";
            std::wstring container_ = L"/";

          public:
            ID(){};

            ID(const std::wstring &);

            const std::wstring toJSONString() const;

            std::ostream & toJSONString(std::ostream & stream) const;

            std::wstring filepath() const;
            std::wstring name() const;
            std::wstring container() const;

            ID & operator=(const std::wstring &);

            /***** String InterOP ******/

            inline explicit operator std::wstring() const { return filepath(); }

            friend std::wstring operator+(std::wstring & str, const ID & id) { return str + std::wstring(id); }

            /***** STREAMING FUNCTIONS ******/

            friend std::ostream & operator<<(std::ostream & stream, const ID & id)
            {

                stream << toUTF8(id.filepath()) << ":";

                return stream;
            }

            friend std::istream & operator<<(ID & id, std::istream & stream)
            {
                std::wstring str;

                readString(stream, str, L':');

                id = str;

                return stream;
            }
        };
    } // namespace NOTE
} // namespace RUMINATE