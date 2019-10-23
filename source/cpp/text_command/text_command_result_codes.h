#pragma once

#include "../string/utf.h"
#include <cstring>
#include <iostream>
#include <string>
#include <vector>


namespace RUMINATE
{
    namespace COMMAND
    {
        using std::wstring;

        struct TEXT_COMMAND_RESULT_CODES {
            static const wstring generic_msg;
            virtual const wstring & message() const { return generic_msg; }

            friend std::wostream & operator<<(std::wostream & stream, const TEXT_COMMAND_RESULT_CODES & result)
            {
                return stream << result.message();
            }

            friend std::ostream & operator<<(std::ostream & stream, const TEXT_COMMAND_RESULT_CODES & result)
            {
                return stream << result.message();
            }
        };

        struct RETRIEVE_SUCCESS : public TEXT_COMMAND_RESULT_CODES {
            static const wstring msg;
            virtual const wstring & message() const { return RETRIEVE_SUCCESS::msg; }
        };

        struct ADD_FAILURE_TOO_MANY_RESULTS : public TEXT_COMMAND_RESULT_CODES {
            static const wstring msg;
            virtual const wstring & message() const { return ADD_FAILURE_TOO_MANY_RESULTS::msg; }
        };

        struct ADD_SUCCESS : public TEXT_COMMAND_RESULT_CODES {
            static const wstring msg;
            virtual const wstring & message() const { return ADD_SUCCESS::msg; }
        };

        struct ADD_FAILURE_NO_UID_MATCH : public TEXT_COMMAND_RESULT_CODES {
            static const wstring msg;
            virtual const wstring & message() const { return ADD_FAILURE_NO_UID_MATCH::msg; }
        };

        struct REMOVE_SUCCESS : public TEXT_COMMAND_RESULT_CODES {
            static const wstring msg;
            virtual const wstring & message() const { return REMOVE_SUCCESS::msg; }
        };

        struct REMOVE_FAILURE_UID_DOES_NOT_MATCH : public TEXT_COMMAND_RESULT_CODES {
            static const wstring msg;
            virtual const wstring & message() const { return REMOVE_FAILURE_UID_DOES_NOT_MATCH::msg; }
        };

        struct REMOVE_FAILURE_NO_RESULTS : public TEXT_COMMAND_RESULT_CODES {
            static const wstring msg;
            virtual const wstring & message() const { return REMOVE_FAILURE_NO_RESULTS::msg; }
        };

        struct TEXT_COMMAND_FAILURE : public TEXT_COMMAND_RESULT_CODES {
            static const wstring msg;
            virtual const wstring & message() const { return TEXT_COMMAND_FAILURE::msg; }
        };
    } // namespace COMMAND
} // namespace RUMINATE
