#include "./tags.h"

using namespace RUMINATE::TAG;

void TagContainer::addTag(wstring id)
{
    Tag t;
    t.id = id;
    tags.push_back(t);
    count++;
}

void TagContainer::addTag(wstring id, double val)
{
    Tag t;
    t.id  = id;
    t.val = val;
    tags.push_back(t);
    count++;
}

void TagContainer::addTag(wstring id, long long val)
{
    Tag t;
    t.id  = id;
    t.val = val;
    tags.push_back(t);
    count++;
}

void TagContainer::addTag(wstring id, wstring str)
{
    Tag t;
    t.id  = id;
    t.val = new wstring(str); // <<<<<!!!!!!!MEMORYLEAK!!!!!!! <<<<
    tags.push_back(t);
    count++;
}

void TagContainer::removeTag(wstring) {}

void TagContainer::fromBracketedStream(std::istream & stream)
{
    // Only consume characters if a particular set of characters is found. { tag_name : tag_val [, ...] }
    unsigned root = stream.tellg();

    char t = stream.get();

    if (t == '{') {
        int c = stream.get();
        while (stream.good() && c != '}') {
            // First part is text data. Ignore white space.
            wstring key;
            wstring value;

            key += c;

            c = stream.get();

            while (c == ' ' && stream.good()) c = stream.get();

            while (c != ':' && c != ',' && c != '}') {
                key += c;
                c = stream.get();
            }

            if (c == ':') {
                c = stream.get();
                while (c != ',' && c != '}') {
                    value += c;
                    c = stream.get();
                }
            }

            if (c == ',') c = stream.get();

            while (c == ' ' && stream.good()) c = stream.get();

            if (value.size() > 0) {
                try {
                    addTag(key, stod(value));
                } catch (...) {
                    addTag(key, value);
                }
            } else {
                addTag(key);
            }
        }

        if (c != '}') stream.seekg(root);
    }
    // read tags into buffer
}

const wstring TagContainer::toJSONString() const
{
    wstring string = L"";

    string += L"{";

    bool start = true;

    for (auto tag : tags) {
        // stream.write((char *) &sentinal_start, sizeof(sentinal_start));
        if (!start) string += L",";
        string += L"\"" + tag.id + L"\"";
        string += L":\"";
        string += (wstring) tag.val + L"\"";
        start = false;
    }

    string += L"}";

    return string;
}

std::ostream & TagContainer::toJSONString(std::ostream & stream) const
{
    stream << '{';

    bool start = true;

    for (auto tag : tags) {
        // stream.write((char *) &sentinal_start, sizeof(sentinal_start));
        if (!start) stream << ",";

        stream << "\"" << tag.id << "\""
               << ":";

        tag.val.toJSONString(stream);

        start = false;
    }

    stream << '}';

    return stream;
}

void TagContainer::update(const RUMINATE_COMMAND_NODES::NOTE_TagList_n & tag_list)
{
    for (auto iter = tag_list.begin(); iter != tag_list.end(); iter++) {

        RUMINATE_COMMAND_NODES::NOTE_Tag_n & tag = **iter;

        if (tag.shouldRemove()) {
        } else if (tag.hasStringValue()) {
            addTag(wstring(*tag.key), wstring(*tag.val));
        } else if (tag.hasNumberValue()) {
            addTag(wstring(*tag.key), tag.num_val);
        } else {
            addTag(wstring(*tag.key));
        }
    }
}