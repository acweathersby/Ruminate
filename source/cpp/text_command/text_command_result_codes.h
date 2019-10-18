#pragma once

#include <string>
#include <cstring>
#include <vector>


namespace RUMINATE
{
	namespace COMMAND
	{
		using std::wstring;

		struct TEXT_COMMAND_RESULT_CODES {
			static const wstring generic_msg;
			virtual const wstring& message() {
				return generic_msg;
			}
		};

		struct RETRIEVE_SUCCESS : public TEXT_COMMAND_RESULT_CODES {
			static const wstring msg;
			virtual const wstring& message() { return RETRIEVE_SUCCESS::msg; }
		};

		struct ADD_FAILURE_TOO_MANY_RESULTS : public TEXT_COMMAND_RESULT_CODES {
			static const wstring msg;
			virtual const wstring& message() { return ADD_FAILURE_TOO_MANY_RESULTS::msg; }
		};

		struct ADD_SUCCESS : public TEXT_COMMAND_RESULT_CODES {
			static const wstring msg;
			virtual const wstring& message() { return ADD_SUCCESS::msg; }
		};

		struct ADD_FAILURE_NO_UID_MATCH : public TEXT_COMMAND_RESULT_CODES {
			static const wstring msg;
			virtual const wstring& message() { return ADD_FAILURE_NO_UID_MATCH::msg; }
		};

		struct REMOVE_SUCCESS : public TEXT_COMMAND_RESULT_CODES {
			static const wstring msg;
			virtual const wstring& message() { return REMOVE_SUCCESS::msg; }
		};


struct REMOVE_FAILURE_UID_DOES_NOT_MATCH : public TEXT_COMMAND_RESULT_CODES {
			static const wstring msg;
			virtual const wstring& message() { return REMOVE_FAILURE_UID_DOES_NOT_MATCH::msg; }
		};

struct REMOVE_FAILURE_NO_RESULTS : public TEXT_COMMAND_RESULT_CODES {
			static const wstring msg;
			virtual const wstring& message() { return REMOVE_FAILURE_NO_RESULTS::msg; }
		};
	}
}
