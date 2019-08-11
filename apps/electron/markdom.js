class MarkDownNode {
    constructor(lex, start = 0, end = 0, children = []) {
        this.start = 0;
        this.end = 0;
        this.type = "root";
        this.children = children;
    }

    /* 
    	Compares the innervalue of a given node with it's own value
    	returns true if the two values are the same.
    */
    compare() {

    }

    /*
    	Builds an element list from the internal value and child nodes.
    */
    build() {
        const ele = document.createElement(this.type);

        for (const child of this.children) {
            const c_ele = child.build()
            ele.appendChild(c_ele);
        }

        ele.innerHTML = this.lex.str.slice(this.start, this.end);

        return ele;
    }

    /*
    	Merges new elements into the element tree, leaving alone portions that are
    	unchanged.
    */
    merge(element, length, childElements, index) {

        for (const child of this.children) {
            const ele = child.build();
            element.appendChild(ele);
            index++;
        }

        return index;
    }
}

/* Parses a markdown encoded string and returns a list of markdown nodes */
function ParseMarkdown(lex) {
    const nodes = [];
    lex.IWS = false;
    lex.tl = 0;
    lex.next();

    while (!lex.END) {
        const node = new MarkDownNode(lex);

        switch (lex.tx) {
            case "#": //Header
                if (ParseHeader(lex, node))
                    break;
            case ">": //Block Quote
                if (ParseBlockQuote(lex, node))
                    break;
                //default is a paragraph node
            default:
                ParseParagraph(lex, node)
        }

        if (lex.ty = lex.types.nl) {
            nodes.push(node);
        }

        lex.next()
    }

    return new MarkDownNode(lex, lex.off, lex.str, nodes);
}

function ParseHeader(lex, node) {
    const cp = lex.copy();

    let size = 0;

    while (cp.tx == "#") {
        size++;
        cp.next();
    }

    if (cp.ty !== cp.types.ws || size > 6)
        return false

    //Children would be processed at this level.
    while (!cp.END && cp.ty !== cp.types.nl)
        cp.next();

    node.start = lex.off + size;
    node.end = cp.off;
    node.lex = lex;

    lex.sync(cp)

    node.type = "h" + size;

    return true;
}


function ParseBlockQuote(lex, node) {
    const cp = lex.copy();

    let size = 0;

    while (cp.tx == ">") {
        size++;
        cp.next();
    }

    if (cp.ty !== cp.types.ws || size > 6)
        return false

    //Children would be processed at this level.
    while (!cp.END && cp.ty !== cp.types.nl)
        cp.next();

    node.start = lex.off + size;
    node.end = cp.off;
    node.lex = lex;

    lex.sync(cp)

    node.type = "blockqoute";

    return true;
}

function ParseParagraph(lex, node) {
    const cp = lex.copy();

    while (!cp.END && cp.ty !== cp.types.nl)
        cp.next();

    node.start = lex.off;
    node.end = cp.off;
    node.lex = lex;

    lex.sync(cp)

    node.type = "p";

    return true;
}

function HTMLtoMarkdown(html_node) {
    return processChildren(html_node);
}

function HTMLtoMarkdownParse(html_node, level = 0) {
    if (TAGS[html_node.tagName])
        return TAGS[html_node.tagName](html_node, level);
    else
        return defaultNodeRender(html_node, level);
}

function processChildren(node, level = 0) {
    let str = "";

    const children = node.childNodes;
    const length = children.length;

    for (let i = 0; i < length; i++)
        str += HTMLtoMarkdownParse(children[i], level + 1);

    return str;
}

function defaultNodeRender(node, level) {
    if (node instanceof HTMLElement) {
        const tag = node.tagName;

        let str = `<${tag}>`;

        str += processChildren(node, level);

        return str += `</${tag}>`

    } else {
        return node.data;
    }
}

const TAGS = {};
/* 
	Returns new function that will replace a given nodes tags with an unary or binary
	[replace] tag(s). 
*/
function tagReplace(tagname, pre, end, replace, max_level, PARSE_CHILDREN = true) {
    TAGS[tagname] = function(node, level) {
        if (level > max_level)
            return defaultNodeRender(node, level);
        let str = pre;
        if (replace) {
            str = pre.replace(/\%(\w+)/g, function(m, p) {
                return node.getAttribute(p) || "";
            });
        }
        return str += (PARSE_CHILDREN ? processChildren(node, level) : "") + end
    }
}

tagReplace("H1", "# ", "\n", false, 1)
tagReplace("H2", "## ", "\n", false, 1)
tagReplace("H3", "### ", "\n", false, 1)
tagReplace("H4", "#### ", "\n", false, 1)
tagReplace("H5", "##### ", "\n", false, 1)
tagReplace("H6", "###### ", "\n", false, 1)
tagReplace("BLOCKQOUTE", ">", "\n", true, 1)
tagReplace("A", "[%href](", ")", false, Infinity)
tagReplace("IMG", "![%src](", ")", false, Infinity)
tagReplace("B", "*", "*", true, Infinity)
tagReplace("BR", "<br/>", "", true, Infinity, false)
tagReplace("STRONG", "*", "*", true, Infinity)
tagReplace("P", "", "\n", false, 1)
tagReplace("NOTES", "((%query))[%meta]\n", "", true, 1, false)
