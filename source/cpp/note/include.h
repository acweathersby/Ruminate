#pragma once

#include "./id/id.h"
#include "./note.basic.h"
#include "./note.crdt.h"
#include "./note.h"
#include "./tags/tags.h"
#include "./uid/uid.h"

namespace RUMINATE
{
    namespace NOTE
    {

        static BasicNote NullNote(NullUID);


    } // namespace NOTE
} // namespace RUMINATE