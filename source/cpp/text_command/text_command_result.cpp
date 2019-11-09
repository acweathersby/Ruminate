#include "text_command/text_command_result.h"

bool RUMINATE::COMMAND::TextCommandResult::READY() { return result != nullptr; }

unsigned RUMINATE::COMMAND::TextCommandResult::size() { return uids.size(); }

void RUMINATE::COMMAND::TextCommandResult::addUID(const UID & uid) { uids.push_back(uid); }

void RUMINATE::COMMAND::TextCommandResult::addUIDs(const QueryResult & list)
{

    for (auto i = 0; i < list.size(); i++) {
        uids.push_back(list.uids[i]);
    }
}

void RUMINATE::COMMAND::TextCommandResult::addUIDs(const RUMINATE_COMMAND_NODES::UID_List_n & list)
{
    for (auto i = list.uids.begin(); i != list.uids.end(); i++) {
        uids.push_back(UID(**i));
    }
}
