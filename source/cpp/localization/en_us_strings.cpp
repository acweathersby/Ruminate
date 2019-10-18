#include "../definitions.h"
#include "../text_command/text_command_result_codes.h"

#ifdef LOCALE_EN_US

const std::wstring RUMINATE::COMMAND::TEXT_COMMAND_RESULT_CODES::generic_msg =
    L"General Success";

const std::wstring RUMINATE::COMMAND::RETRIEVE_SUCCESS::msg =
    L"The RETRIEVE command resolved successfuly.";

const std::wstring RUMINATE::COMMAND::ADD_FAILURE_TOO_MANY_RESULTS::msg =
    L"The ADD command returned too many results. Please use a different form of the ADD command, such one with the notes UID, to exactly specify the note to add.";

const std::wstring RUMINATE::COMMAND::ADD_SUCCESS::msg =
    L"The ADD command resolved successfuly.";

const std::wstring RUMINATE::COMMAND::ADD_FAILURE_NO_UID_MATCH::msg =
    L"The ADD command did not match the input UID. No note has been created or modified. To create a new note, use the ADD command with a container identifier.";

const std::wstring RUMINATE::COMMAND::REMOVE_SUCCESS::msg =
    L"The REMOVE command resolved successfuly.";

const std::wstring RUMINATE::COMMAND::REMOVE_FAILURE_UID_DOES_NOT_MATCH::msg =
    L"The REMOVE command failed. The provided UIDs did not match any notes.";

const std::wstring RUMINATE::COMMAND::REMOVE_FAILURE_NO_RESULTS::msg =
    L"The REMOVE command failed. The query do match any notes.";

#endif
