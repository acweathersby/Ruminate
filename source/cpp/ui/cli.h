#pragma once

#include "../compiler/compiler.h"
#include "../container/container.h"
#include "../database/file/file_db.h"
#include "../note/note.h"
#include "../query/query.h"
#include "../server/server.h"
#include "../string/crdt.h"
#include "../text_command/text_command.h"
#include "../uid/uid.h"
#include <cstring>
#include <iostream>
#include <string>

using namespace RUMINATE;
using namespace RUMINATE::STRING;
using namespace RUMINATE::NOTE;
using namespace RUMINATE::CONTAINER;
using namespace RUMINATE::DB;
using namespace RUMINATE::TAG;
using namespace RUMINATE::QUERY;
using namespace RUMINATE::DB;
using namespace std;

bool cli(wstring & filepath);
