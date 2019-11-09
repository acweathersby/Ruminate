#include "./note.basic.h"

using namespace RUMINATE::NOTE;

using std::string;

void BasicNote::serialize(std::ostream & stream) const
{
    stream << uid;
    stream << ((char) type + 56);
    stream << std::hex << modified_time << L'\n' << std::dec;
    stream << "\n";
    stream << id;
    stream << "\n";
    stream << tags;
    stream << "\n";
    stream << body;
}

void BasicNote::deserialize(std::istream & stream)
{
    uid << stream;
    type = stream.get() - 56;
    wstring str;

    try {
        readString(stream, str, L'\n');
        modified_time = std::stoull(str, 0, 16);
    } catch (...) {
    }

    // stream.get();
    // stream.read((char *) &type, sizeof(type));
    // stream.read((char *) &modified_time, sizeof(modified_time));
    id << stream;
    stream.get();
    tags << stream;
    stream.get();
    body << stream;
}

bool BasicNote::fuzzySearchMatchFirst(const RUMINATE_COMMAND_NODES::parse_string & string)
{
    return STRING::fuzzySearchMatchFirst<wstring, wchar_t, RUMINATE_COMMAND_NODES::parse_string>(body, string);
}

const wstring BasicNote::toJSONString() const
{
    wstring string = L"";

    string += L"{\"type\":\"BASIC_NOTE\",";

    string += L"\"uid\":";

    string += uid.toJSONString();

    string += L",\"id\":\"";

    string += id.toJSONString();

    string += L"\",\"body\":\"";

    string += id.toJSONString();

    string += boost::algorithm::replace_all_copy(body, "\n", "\\n");

    string += L"\"}";

    return string;
}

std::ostream & BasicNote::toJSONString(std::ostream & stream) const
{
    std::wstring_convert<std::codecvt_utf8<wchar_t>> converter;

    stream << "{\"type\":\"BASIC_NOTE\",";

    stream << "\"uid\":\"";

    uid.toJSONString(stream);

    stream << "\",\"modified\":" << modified_time;

    stream << ",\"id\":\"";

    id.toJSONString(stream);

    stream << "\",\"tags\":";

    tags.toJSONString(stream);

    stream << ",\"body\":\"";

    stream << converter.to_bytes(boost::algorithm::replace_all_copy(body, "\n", "\\n"));

    stream << "\"}";

    return stream;
}


void BasicNote::updateBody(const RUMINATE_COMMAND_NODES::parse_string & body_string)
{
    std::wcout << "Setting new body string" << body_string << std::endl;
    body.assign(body_string);
}