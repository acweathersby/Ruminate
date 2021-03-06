import html from "@candlefw/html";
import whind from "@candlefw/whind";

/* 
    The Goal of MarkDOM is to provide HTML to MD and MD to HTML
    parsers that can integrate will with the graze note system.
    This means the parers must be aware of Graze constructs
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
    br = 32768,
    note = 65536;
const space_char = " ",
    new_line = "\n",
    hashtag = "#";

// Methods needed
export default (function MarkDOM() {



    //ReduceDN reduces the previous line with current line if the type matches
    function reset(lex, off) {
        lex.off = off;
        lex.tl = 0;
        lex.next();
        return lex;
    }

    function node(type = 0, start = 0, end = 0, reduceUP = 0, reduceDN = 0, cap = 0, ignore = 0) {
        return { type, start, reduceUP, reduceDN, ignore, end, cap: 0, children: [], active: true }
    }

    function code_block_node(start) {
        return node(cb, start, 0, 0, p | cb | br, cb)
    }

    function new_line_node() {
        var intermediate = node(br, 0, 0, 0, br);
        setChild(intermediate, node(br, 0, 0, 0, br));
        return intermediate;
    }

    function paragraph_node(start) {
        return node(p, start, 0, p);
    }

    function text_node(start, end) {
        return node(tx, start, end);
    }

    function setChild(node, ...children) {
        let c = null;
        for (const child of children) {
            if (child) {
                node.children.push(child)
                c = child;
            }
        }
        return c;
    }

    function setIgnore(node) {
        node.ignore = true;
        return node;
    }

    function end(char, lex) { var i = 0; while (lex.ch == char && !lex.END) lex.next(), ++i; return i; }

    function space(lex) { return (lex.ty == lex.types.ws) ? (lex.next(), !0) : !1 }

    const md_headers = {
        "(": (lex, start, count) => {
            if (lex.next().ch == "(") {
                lex.next();
                //ruminate note data
                const nt = node(note, lex.off);

                nt.ignore = true;

                parseLine(lex, nt, ")", 2);

                if (!nt.active) {
                    reset(lex, start);
                    return paragraph_node(start)
                }

                return nt;
            }
            return paragraph_node(start)
        },
        "#": (lex, start, count) =>
            (count = end("#", lex), space(lex) && count < 7) ?
            node(2 << count, start + count) : paragraph_node(start),

        ">": (lex, start) => (lex.next(), node(bq, start, 0, bq)),

        "`": (lex, start) => (end("`", lex) >= 3) ? parseLine(lex, setIgnore(code_block_node(start)), "`", 3) : paragraph_node(start),

        [space_char]: function space(lex, start) {
            const pk = lex.pk;

            let count = lex.tx.length;

            return (count >= 4) ?
                paragraph_node(start) :
                paragraph_node(start);
        },

        [new_line]: (lex) => {return (lex.next(), setIgnore(new_line_node()))}
    }

    const joins = {
        [p]: {
            [p]: (t, b) => (setChild(t, ...b.children), t),
            [br]: (t) => {t.cap = true; return t}
        },
        [bq]: {
            [bq]: (t, b) => (setChild(t, ...b.children), t),
        },
        [li]: {
            [li]: (t, b) => (setChild(t, b), t),
        },
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

    const join = (top, bottom, up, j) => {
        console.log(top, bottom)

        if (!bottom.active) {
            top.children.push(...bottom.children)
            return top;
        }

        return (!top.cap && (j = joins[top.type]) && j[bottom.type]) ?
            j[bottom.type](top, bottom) :
            null;
    }

    const parseLineStart = (lex, ch) => (ch = lex.ch, md_headers[ch]) ?
        md_headers[ch](lex, lex.off) :
        paragraph_node(lex.off);

    function parseLine(lex, object, escape = "", escape_count = 0, start = lex.off) {

        if (escape_count > 0)
            object.active = false;

        while (!lex.END) {

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
            } else {
                if (lex.ty == lex.types.nl)
                    break;
            }


            switch (lex.ch) {
                case "*":
                case "_":
                    const ch = lex.ch;
                    count = end(ch, lex);
                    let txt = text_node(start, off),
                        obj = null;
                    if (count == 1)
                        obj = parseLine(lex, node(italic, lex.off), ch, 1)
                    else if (count == 2)
                        obj = parseLine(lex, node(bold, lex.off), ch, 2)
                    else if (count > 2) {
                        const diff = count - Math.min(2, count);
                        lex.off -= diff;
                        lex.tl = 0;
                        lex.next();
                        obj = parseLine(lex, node(bold, lex.off), ch, 2)
                    }

                    if (!obj.active) {
                        reset(lex, off + count)
                    } else {
                        setChild(object, txt, obj);
                        start = lex.off;
                    }

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
                    lex.next();
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

            const output_stack = [];

            const rule_stack = [];

            let i = 0;

            // Run through each line, pushing new rules onto stack and 
            // reducing the output stack when a rule accepts
            const lex = whind(MDString, true);
            lex.IWS = false;
            lex.PARSE_STRING = true;
            lex.addSymbol("`");
            lex.tl = 0;
            lex.next();

            while (!lex.END) {

                var intermediate = parseLineStart(lex);

                if (!intermediate.ignore) {
                    intermediate = parseLine(lex, intermediate);
                    //should be at nl or lex.END
                    if (!lex.END)
                        lex.assert("\n");
                }


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
                let ele = { nodeName: "", childNodes: null },
                    tag = "DIV";
                switch (d.type) {
                    case p:
                        tag = "P";
                        break;
                    case bq:
                        tag = "BLOCKQUOTE";
                        break;
                    case h1:
                        tag = "H1";
                        break;
                    case h2:
                        tag = "H2";
                        break;
                    case h3:
                        tag = "H3";
                        break;
                    case h4:
                        tag = "H4";
                        break;
                    case h5:
                        tag = "H5";
                        break;
                    case h6:
                        tag = "H6";
                        break;
                    case li:
                        tag = "L1";
                        break;
                    case note:
                        tag = "note";
                        break;
                    case cb:
                        ele.nodeName = "PRE";
                        ele.childNodes = [{
                            nodeName: "#text",
                            data: d.children
                                .map(r)
                                .reduce((r, tx) => (r + tx.data), "")
                            }]
                        return ele;
                    case br:
                        return { nodeName: "BR", childNodes: [] }
                    case nl:
                        return { nodeName: "#text", data: "\n" };
                    case tx:
                        return { nodeName: "#text", data: MDString.slice(d.start, d.end) };
                    case bold:
                        tag = "B";
                        break;
                    case italic:
                        tag = "EM";
                        break;
                    case inline_code:
                        tag = "CODE";
                        break;
                }
                ele.nodeName = tag;
                ele.childNodes = d.children.map(r);

                return ele;
            }

            const n = node();
            setChild(n, ...output_stack);
            const vDom = r(n);
            //HTMLtoMarkdown();

            return vDom;
        },

        //Given a DOM like object tree output a MD string representing the DOM structure. 
        MDify(HTMLElement) {
            return HTMLtoMarkdown(HTMLElement);
        },

        //Rebuilds element tree based on vDOM
        merge(element, mdVDOM, renderNote) {
            Array.prototype.forEach.call(element.childNodes, (e) => buildHash(e));
            Array.prototype.forEach.call(mdVDOM.childNodes, (e) => buildHash(e));
            diff(element, mdVDOM, renderNote);
            return element;
        }
    }
})();

function render(node, renderNote) {
    const name = node.nodeName
    if (name == "#text") {
        return new Text(node.data);
    } else if (name == "note") {
        return renderNote(node.childNodes[0].data, node.childNodes[1] && node.childNodes[1].data);
    } else {

        const ele = document.createElement(name);

        if (node.attribs)
            for (const attribute of node.attribs)
                ele.setAttribute(attribute[0], attribute[1]);

        node.childNodes.map(render).map(ele.appendChild.bind(ele));

        return ele;
    }
}

function buildHash(node, hash = 0) {

    let index = 0;

    if (node.childNodes)
        for (const child of node.childNodes)
            hash ^= buildHash(child, 0x134 << (((index++) % 4) * 8));


    if (node.nodeName == "#text")
        hash = node.data.split("").reduce((r, v, i) => (r ^ (v.charCodeAt(0) << ((i % 4) * 7))), hash);
    else
        hash = node.nodeName.split("").reduce((r, v, i) => (r ^ (v.charCodeAt(0) << ((i % 4) * 7))), hash);

    node.hash = hash;

    return hash;
}

function diff(DOMnode, vDOMnode, renderNote) {

    const
        Children = Array.prototype.slice.call(DOMnode.childNodes),
        vChildren = vDOMnode.childNodes;

    const out = [];

    outer:
        for (let i = 0; i < vChildren.length; i++) {

            const vchild = vChildren[i];

            for (let j = 0; j < Children.length; j++) {
                const child = Children[j];

                if (vchild.hash == child.hash) {
                    out.push(Children.splice(j, 1)[0]);
                    continue outer;
                    //Continue looking            
                }
            }

            out.push(render(vchild, renderNote));
        }

    for (const child of Children)
        DOMnode.removeChild(child);

    for (const child of out)
        DOMnode.appendChild(child);

    return DOMnode;
}



function HTMLtoMarkdown(html_node) {
    return processChildren(html_node);
}

function HTMLtoMarkdownParse(html_node, level = 0) {
    if (TAGS[html_node.nodeName])
        return TAGS[html_node.nodeName](html_node, level);
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
    if (node.nodeName !== "#text") {
        const tag = node.nodeName;

        let str = `<${tag}>`;

        str += processChildren(node, level);

        return str += `</${tag}>`

    } else {
        //    console.log(node)
        return node.data;
    }
}


/* 
    Returns new function that will replace a given nodes tags with an unary or binary
    [replace] tag(s). 
*/
function tagReplace(nodeName, pre, end, replace, max_level, PARSE_CHILDREN = true) {
    TAGS[nodeName] = function(node, level) {
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
const TAGS = {};
tagReplace("H1", "# ", "\n", false, 1)
tagReplace("H2", "## ", "\n", false, 1)
tagReplace("H3", "### ", "\n", false, 1)
tagReplace("H4", "#### ", "\n", false, 1)
tagReplace("H5", "##### ", "\n", false, 1)
tagReplace("H6", "###### ", "\n", false, 1)
tagReplace("PRE", "``` %langauge", "```", true, 1)
tagReplace("CODE", "```", "```", true, Infinity)
tagReplace("BLOCKQUOTE", ">", "\n", false, 1)
tagReplace("A", "[%href](", ")", true, Infinity)
tagReplace("IMG", "![%src](", ")", true, Infinity)
tagReplace("EM", "*", "*", false, Infinity)
tagReplace("B", "**", "**", false, Infinity)
tagReplace("BR", "\n", "", false, Infinity, false)
tagReplace("STRONG", "*", "*", false, Infinity)
tagReplace("P", "", "\n\n", false, 1)
tagReplace("NOTES", "((%query))\n", "", true, 1, false)
//tagReplace("NOTES", "((%query))[%meta]\n", "", true, 1, false)
