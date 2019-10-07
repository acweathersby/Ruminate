import html from "@candlefw/html";
import whind from "@candlefw/whind";

/* 
    The Goal of MarkDOM is to provide HTML to MD and MD to HTML
    parsers that can integrate will with the ruminate note system.
    This means the parers must be aware of ruminate constructs
    including: 
        query_fields

    The result should be that any text that is rendered to MD should
    be able to be rendered back HTML, and then back to MD without
    any difference in the formated strings. 
        HTML -> MD == MD -> HTML == HTML -> MD ....
*/
const
    p = 1,
    bq = 2,
    h1 = 4,
    h2 = 8,
    h3 = 16,
    h4 = 32,
    h5 = 64,
    h6 = 128,
    li = 256,
    cb = 512,
    nl = 1024,
    tx = 2048,
    bold = 4096,
    italic = 8192,
    inline_code = 16384,
    br = 32768;
const space_char = " ",
    new_line = "\n",
    hashtag = "#";

export default (function MarkDOM() {



    //ReduceDN reduces the previous line with current line if the type matches
    function reset(lex, off) {
        lex.off = off;
        lex.tl = 0;
        lex.next();
    }

    function node(type = 0, start = 0, end = 0, reduceUP = 0, reduceDN = 0, cap = 0, ignore = 0) {
        return { type, start, reduceUP, reduceDN, ignore, end, cap: 0, children: [] }
    }

    function setChild(node, ...children) {
        node.children.push(...children);
        return children[children.length - 1];
    }

    function setIgnore(node) {
        node.ignore = 1;
        return node;
    }

    function paragraph_node(start) {
        return node(p, start, 0, p);
    }

    function text_node(start, end) {
        return node(tx, start, end);
    }

    function new_line_node() {
        var intermediate = node(br, 0, 0, 0, br);
        setChild(intermediate, node(br, 0, 0, 0, br));
        return intermediate;
    }

    function end(char, lex) { var i = 0; while (lex.ch == char && !lex.END) lex.next(), ++i; return i; }

    function space(lex) { return (lex.ty == lex.types.ws) ? (lex.next(), !0) : !1 }

    const md_headers = {
        
        "#": (lex, start, count) =>
            (count = end("#", lex), space(lex) && count < 7)
            ? node(2 << count, start + count)
            : paragraph_node(start),

        ">": (lex, start) => node(bq, start, 0, bq),

        "`": (lex, start) => (end("`", lex) >= 3)
            ? node(cb, start, 0, 0, p | cb | br, cb)
            : paragraph_node(start),

        [space_char]: function space(lex, start) {
            const pk = lex.pk;
            let count = 0;

            if (pk.ty == lex.types.ws) {
                pk.next(), count++;
            }

            console.log(count)

            return (count >= 4) ? codeblock(lex, start) : paragraph_node(start);
        },
        [new_line]: () => (new_line_node())
    }

    const joins = {
        [p]: {
            [p]: (t, b) => (setChild(t, new_line_node(), ...b.children), t)
        },
        [bq]: {},
        [li]: {},
        [cb]: {
            [p]: (t, b) => (setChild(t, ...b.children), t),
            [br]: (t, b) => (setChild(t, node(nl)), t),
            [cb]: (t) => (t.cap = true, t)
        },
        [nl]: {},
        [br]: {
            [br]: t => t
        }
    }

    const join = (top, bottom, up, j) =>
        (!top.cap && (j = joins[top.type]) && j[bottom.type])
        ? j[bottom.type](top, bottom)
        : null;

    const parseLineStart = (lex, ch) => (ch = lex.ch, md_headers[ch])
        ? md_headers[ch](lex, lex.off)
        : paragraph_node(lex.off);

    function parseLine(lex, object, escape = "", escape_count = 0, start = lex.off) {

        while (!lex.END && lex.ty != lex.types.nl) {

            var off = lex.off,
                count = 0;
            object.cap = escape_count;

            if (lex.ch == escape) {
                while (lex.ch == escape && count < escape_count)
                    count++, lex.next();

                if (escape_count == count) {
                    object.active = true;
                    if (off - start >= 0)
                        setChild(object, text_node(start, off));
                    return object;
                }
                reset(lex, off);
            }

            if (object.ignore) {
                lex.next();
                continue;
            }

            switch (lex.ch) {
                case "*":
                case "_":
                    const ch = lex.ch;
                    count = end(ch, lex);
                    if (count == 1)
                        var obj = setChild(
                            object,
                            text_node(start, off),
                            parseLine(lex, node(italic, lex.off), ch, 1)
                        );
                    else if (count == 2)
                        obj = setChild(
                            object,
                            text_node(start, off),
                            parseLine(lex, node(bold, lex.off), ch, 2, count)
                        );
                    else if (count > 2) {
                        const diff = count - Math.min(2, count);
                        lex.off -= diff;
                        lex.tl = 0;
                        lex.next();
                        obj = setChild(
                            object,
                            text_node(start, off),
                            parseLine(lex, node(bold, lex.off), ch, 2)
                        );
                    }
                    if (!obj.active) {
                        obj.children.length = 0;
                        reset(lex, off + count)
                    }
                    start = lex.off;
                    break;
                case "`":
                    count = end("`", lex);
                    const c = Math.min(3, count);
                    if (count > 0)
                        setChild(
                            object,
                            text_node(start, off),
                            parseLine(lex, setIgnore(node(inline_code, lex.off - (count - c))), "`", c)
                        );
                    start = lex.off;
                    break;
                case "[":
                    break;
                case "\\":
                    lex.next();
                    if (lex.ty == lex.types.nl)
                        break;
                    // intentional
                default:
                    lex.next();
            }
        }

        if (lex.off - start >= 1)
            setChild(object, text_node(start, lex.off));

        object.end = lex.off;

        return object;
    }

    const md_inline = {

    }

    return {
        //Given a markdown string output a DOM tree representing the MD structure.
        DOMify(MDString) {
            //MD is a line based rule system. split the string into lines 
            const lines = MDString.split("\n");

            const ele = new HTMLElement;

            const output_stack = [];

            const rule_stack = [];

            let i = 0;

            // Run through each line, pushing new rules onto stack and 
            // reducing the output stack when a rule accepts
            const lex = whind(MDString, true);
            lex.IWS = false;
            lex.addSymbol("`");
            lex.tl = 0;
            lex.next();

            while (!lex.END) {

                var intermediate = parseLine(lex, parseLineStart(lex));

                //should be at nl or lex.END
                lex.assert("\n");

                if (output_stack.length > 0) {
                    const
                        index = output_stack.length - 1,
                        candidate = join(output_stack[index], intermediate, true);

                    if (candidate) {
                        output_stack[index] = candidate;
                        continue;
                    }
                }

                output_stack.push(intermediate)
            }


            //REnder test
            function r(d) {
                let str = ""
                switch (d.type) {
                    case p:
                        str += `<p>${d.children.map(r).join("")}</p>`
                        break;
                    case bq:
                        str += `<blockqoute>${d.children.map(r).join("")}</blockqoute>`
                        break;
                    case h1:
                        str += `<h1>${d.children.map(r).join("")}</h1>`
                        break;
                    case h2:
                        str += `<h1>${d.children.map(r).join("")}</h2>`
                        break;
                    case h3:
                        str += `<h3>${d.children.map(r).join("")}</h3>`
                        break;
                    case h4:
                        str += `<h4>${d.children.map(r).join("")}</h4>`
                        break;
                    case h5:
                        str += `<h5>${d.children.map(r).join("")}</h5>`
                        break;
                    case h6:
                        str += `<h6>${d.children.map(r).join("")}</h6>`
                        break;
                    case li:
                        str += `<ul>${d.children.map(r).map(r=>`<li>${r}</li>`).join("")}</ul>`
                        break;
                    case cb:
                        str += `<code>\n${d.children.map(r).join("\n")}\n</code>`
                        break;
                    case br:
                        str += `<br>`
                        break;
                    case tx:
                        str += MDString.slice(d.start, d.end)
                        break;
                    case bold:
                        str += d.active ? `<b>${d.children.map(r).join("")}</b>` : "**" + d.children.map(r).join("");
                        break;
                    case italic:
                        str += d.active ? `<i>${d.children.map(r).join("")}</i>` : "*" + d.children.map(r).join("");
                        break;
                    case inline_code:
                        str += d.active ? `<pre>${d.children.map(r).join("")}</pre>` : ("`").repeat(d.cap) + d.children.map(r).join("");
                        break;
                }

                return str;
            }

            for (let i = 0; i < output_stack.length; i++)
                console.log(r(output_stack[i]))

            return ele;
        },
        //Given a DOM tree output a MD string representing the DOM structure. 
        MDify(HTMLElement) {
            return "";
        }
    }
})()

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
