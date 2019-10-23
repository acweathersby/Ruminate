#pragma once

#include "../compiler/nodes.h"
#include "../container/container.h"
#include "../database/include/db_runner.h"
#include "../note/note.h"
#include "../uid/uid.h"
#include <cstring>
//#include "./container.h"

namespace RUMINATE
{
    using namespace CONTAINER;
    using namespace DB;
    using namespace NOTE;

    namespace QUERY
    {

        using namespace RUMINATE_COMMAND_NODES;

        /**
            Parses query string and selects notes from input array that meet the query criteria.

            Selected notes are placed in the output buffer.
        **/
        static bool compareQueryIdentifier(const QUERY_Identifier_n & id, const wstring & string,
                                           bool WHOLE_MATCH = true, bool FOLLOWING_WILD_CARD = false)
        {

            int offset = 0;

            for (int i = 0; i < id.list.size(); i++) {

                const parse_string & str = *id.list[i];

                if (str == L"*") {

                    if (i == (id.list.size() - 1)) return true;

                    FOLLOWING_WILD_CARD = true;
                    continue;
                }

                size_t start = string.find(str, offset);

                if (FOLLOWING_WILD_CARD || (int) start == 0 || (!WHOLE_MATCH && (int) start > 0)) {

                    offset = start + str.size();

                    if (offset == string.size())
                        return true;

                    else
                        continue;
                }

                return false;
            }

            return false;
        }

        static int recurseContainerMatcher(const QUERY_Container_n & container_query, const ContainerLU & container,
                                           unsigned & total, unsigned max_uids, UID * uids,
                                           unsigned container_offset = 0, unsigned FOLLOWING_WILD_CARD = 0)
        {
            if (!container_query.list) {

                container.fillUIDBuffer(&uids[total]);
                total += container.uidSize();
                return 1;
            }

            auto ctr = (*(container_query.list))[container_offset];

            if (container.id == L"" || ctr->IS_WILD_CARD() || compareQueryIdentifier(*ctr, container.id, true)) {


                auto ctrs = container.containers;

                unsigned offset =
                    (FOLLOWING_WILD_CARD || container.id == L"") ? container_offset : container_offset + 1;

                if (offset >= container_query.list->size()) {


                    if (container.uidSize() + total < max_uids) {


                        container.fillUIDBuffer(&uids[total]);

                        total += container.uidSize();
                    }
                } else if (container.containerSize() > 0) {
                    for (auto iter = ctrs.begin(); iter != ctrs.end(); iter++)
                        recurseContainerMatcher(container_query, *(iter->second), total, max_uids, uids, offset,
                                                FOLLOWING_WILD_CARD);
                }
            }

            return -1;
        }

        // Filters out nodes based on container query.
        static int filterContainer(QUERY_Container_n & container, DBRunner & db, unsigned & total_results,
                                   unsigned max_results, UID * buffer)
        {
            const ContainerLU & ctr_lu = db.getContainerTree();
            unsigned uid_buffer_size   = max_results;

            recurseContainerMatcher(container, ctr_lu, total_results, uid_buffer_size, buffer);

            if (container.id) {

                unsigned j = 0;

                for (int i = 0; i < total_results; i++) {
                    if (compareQueryIdentifier(*container.id, db.getNoteID(buffer[i]), false)) buffer[j++] = buffer[i];
                }

                total_results = j;
            }

            return 0;
        }
    } // namespace QUERY
} // namespace RUMINATE
