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
	t.id = id;
	t.val = val;
	tags.push_back(t);
	count++;
}

void TagContainer::addTag(wstring id, long long val)
{
	Tag t;
	t.id = id;
	t.val = val;
	tags.push_back(t);
	count++;
}

void TagContainer::addTag(wstring id, wstring str)
{
	Tag t;
	t.id = id;
	t.val = new wstring(str); // <<<<<!!!!!!!MEMORYLEAK!!!!!!! <<<<
	tags.push_back(t);
	count++;
}

void TagContainer::removeTag(wstring)
{
}


Tag * RUMINATE::TAG::getMatchingTag(TagContainer& tags, const wstring& id)
{
	for(int i = 0; i < tags.size(); i++) {
		Tag * tag = tags[i];
		if(id.compare(tag->id) == 0) {
			std::cout<<"END------------------------------- " <<std::endl;
			return tag;
		}
	}
	return NULL;
};

void RUMINATE::TAG::TagContainer::fromBracketedStream(std::istream& stream)
{
	//Only consume characters if a particular set of characters is found. { tag_name : tag_val [, ...] }
	unsigned root = stream.tellg();

	char t = stream.get();

	if(t == '{') {
		int c = stream.get();
		while(stream.good() && c != '}') {
			//First part is text data. Ignore white space.
			wstring key;
			wstring value;

			key += c;

			c = stream.get();

			while(c == ' ' && stream.good())
				c = stream.get();

			while(c != ':' && c != ',' && c != '}') {
				key += c;
				c = stream.get();
			}

			if(c == ':') {
				c = stream.get();
				while(c != ',' && c != '}') {
					value += c;
					c = stream.get();
				}
			}

			if(c == ',')
				c = stream.get();

			while(c == ' ' && stream.good())
				c = stream.get();

			if(value.size() > 0) {
				try {
					addTag(key, stod(value));
				} catch(...) {
					addTag(key, value);
				}
			} else {
				addTag(key);
			}
		}

		if(c != '}')
			stream.seekg(root);
	}
//read tags into buffer
}
