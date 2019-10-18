#pragma once

#include <iostream>
#include <string>
#include <cstring>
#include "../container/container.h"
#include "../note/note.h"
#include "../uid/uid.h"
#include "../query/query.h"
#include "../database/file/file_db.h"
#include "../string/crdt.h"
#include "../compiler/compiler.h"
#include "../text_command/text_command.h"

using namespace RUMINATE;
using namespace RUMINATE::STRING;
using namespace RUMINATE::NOTE;
using namespace RUMINATE::CONTAINER;
using namespace RUMINATE::DB;
using namespace RUMINATE::TAG;
using namespace RUMINATE::QUERY;
using namespace RUMINATE::DB;
using namespace std;

bool cli(wstring& filepath);
