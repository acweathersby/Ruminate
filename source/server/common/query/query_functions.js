export function matchCRDTString(strings, to_match_string, char = to_match_string.getNextChar(), offset = 0, index = 0, FOLLOWING_WILD_CARD = (offset == 0)) {

    if (index == strings.length)
        return FOLLOWING_WILD_CARD ? to_match_string.length : offset;

    const string = strings[index];

    if (string == "*")
        return matchCRDTString(strings, to_match_string, char, offset, index + 1, true);
    else if (!string)
        return matchCRDTString(strings, to_match_string, char, offset, index + 1, FOLLOWING_WILD_CARD);
    else {
        let i = 0,
            o = offset;

        while (char) {

            i = 0;

            while (i < string.length && string[i] == char) {
                char = to_match_string.getNextChar();
                i++;
            }

            if (i == string.length) {
                break;
            } else if (!char) {
                o = -1
            }

            o += i;

            char = to_match_string.getNextChar();
        }

        if (i == string.length) {
        } else if (!char) {
            o = -1
        }


        if (o >= 0 && (FOLLOWING_WILD_CARD || o == offset))
            return matchCRDTString(strings, to_match_string, char, o + string.length, index + 1)
    }

    return -1;
}

export function matchString(strings, to_match_string, offset = 0, index = 0, FOLLOWING_WILD_CARD = (offset == 0)) {


    if (index == strings.length)
        return FOLLOWING_WILD_CARD ? to_match_string.length : offset;

    const string = strings[index];

    if (string == "*")
        return matchString(strings, to_match_string, offset, index + 1, true);
    else if (!string)
        return matchString(strings, to_match_string, offset, index + 1, FOLLOWING_WILD_CARD);
    else {

        const i = to_match_string.indexOf(string, offset);

        if (i >= 0 && (FOLLOWING_WILD_CARD || i == offset))
            return matchString(strings, to_match_string, i + string.length, index + 1)
    }

    return -1;
}

export function parseId(identifier, string) {
    if (!identifier)
        return true;

    if (!string)
        return false;

    return matchString(identifier.ids, string) >= 0;
}

export function parseContainer(identifiers, ContainerEntry, output, idI = 0, pI = 0) {}
