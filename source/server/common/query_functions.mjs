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

export function parseContainer(identifiers, ContainerEntry, output, idI = 0, pI = 0) {

    if (!identifiers || idI == identifiers.length)
        return parts.length <= pI;

    const identifier = identifiers[idI].ids;

    const string = ContainerEntry.id

    var offset = 0;

    if (identifier[0] == "*" && identifier.length == 1) {

        if (identifiers.length == idI + 1)
            return void output.push(ContainerEntry.uid);

        for (var i = pI; i < parts.length; i++) {
            if (parseContainer(
                    identifiers,
                    parts,
                    idI + 1,
                    i
                ))
                return void output.push(ContainerEntry.uid);
        }
    } else if (parts.length == 0 || parts.length <= pI); // ; <=== intentional
    else if ((offset = matchString(identifier, parts[pI])) >= 0) {

        if (offset != parts[pI].length) return;

        parseContainer(identifiers, parts, output, idI + 1, pI + 1);
    }
}