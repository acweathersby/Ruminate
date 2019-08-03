let fn = {}; const 
/************** Maps **************/

    /* Symbols To Inject into the Lexer */
    symbols = ["&&","||"],

    /* Goto lookup maps */
    gt0 = [0,-1,1,2,3,4,6,11,10,9,12,14,13],
gt1 = [0,-1,32,2,3,4,6,11,10,9,12,14,13],
gt2 = [0,-6,11,10,33,12,14,13],
gt3 = [0,-6,11,10,34,12,14,13],
gt4 = [0,-6,35,-2,12,14,13],
gt5 = [0,-11,36],
gt6 = [0,-2,37,3,4,6,11,10,9,12,14,13],
gt7 = [0,-2,38,3,4,6,11,10,9,12,14,13],
gt8 = [0,-2,39,3,4,6,11,10,9,12,14,13],
gt9 = [0,-2,40,3,4,6,11,10,9,12,14,13],
gt10 = [0,-3,41,4,6,11,10,9,12,14,13],
gt11 = [0,-3,42,4,6,11,10,9,12,14,13],
gt12 = [0,-3,43,4,6,11,10,9,12,14,13],
gt13 = [0,-3,44,4,6,11,10,9,12,14,13],

    // State action lookup maps
sm0=[0,-2,1,-1,2,3,4,5,6,7,-3,8,-9,9,-1,10,11,-2,12],
sm1=[0,13,-3,0,-4,0],
sm2=[0,14,-3,0,-4,0,-14,14],
sm3=[0,15,-3,0,-4,0,-5,16,17,18,19,-5,15],
sm4=[0,20,-3,0,-4,0,-5,20,20,20,20,21,22,23,24,-1,20],
sm5=[0,25,-3,0,-4,0,-5,25,25,25,25,25,25,25,25,-1,25],
sm6=[0,-2,1,-1,2,3,4,5,6,7,-3,8,-15,12],
sm7=[0,26,-3,0,-4,0,-5,26,26,26,26,26,26,26,26,-1,26],
sm8=[0,27,-1,1,-1,2,3,4,5,6,7,-3,8,-1,27,27,27,27,27,27,27,27,-1,27,27,27,-2,12],
sm9=[0,28,-1,28,-1,28,28,28,28,28,28,-3,28,-1,28,28,28,28,28,28,28,28,-1,28,28,28,-2,28],
sm10=[0,29,-1,29,-1,29,29,29,29,29,29,-3,29,-1,29,29,29,29,29,29,29,29,-1,29,29,29,-2,29],
sm11=[0,30,-1,30,-1,30,30,30,30,30,30,-3,30,-1,30,30,30,30,30,30,30,30,-1,30,30,30,-2,30],
sm12=[0,31,-1,31,-1,31,31,31,31,31,31,-3,31,-1,31,31,31,31,31,31,31,31,-1,31,31,31,-2,31],
sm13=[0,-2,1,-1,0,3,4,5,6,0,-3,8],
sm14=[0,-4,0,-4,0,-14,32],
sm15=[0,-4,0,-4,0,-15,33],
sm16=[0,-4,0,-4,0,-16,34],
sm17=[0,35,-1,35,-1,35,35,35,35,35,35,-3,35,-1,35,35,35,35,35,35,35,35,-1,35,35,35,-2,35],
sm18=[0,36,-1,36,-1,36,36,36,36,36,36,-3,36,-1,36,36,36,36,36,36,36,36,-1,36,36,36,-2,36],
sm19=[0,37,-3,0,-4,0,-14,37],
sm20=[0,38,-3,0,-4,0,-5,38,38,38,38,-5,38],
sm21=[0,39,-3,0,-4,0,-5,39,39,39,39,39,39,39,39,-1,39],
sm22=[0,40,-3,0,-4,0,-5,40,40,40,40,40,40,40,40,-1,40],

    // Symbol Lookup map
    lu = new Map([[1,1],[2,2],[4,3],[8,4],[16,5],[32,6],[64,7],[128,8],[256,9],[512,10],[3,11],[264,11],[200,13],[201,14],["&&",15],["AND",16],["And",17],["and",18],["||",19],["OR",20],["Or",21],["or",22],["(",23],[")",24],["\"",25],["'",26],[null,5],["\\",29]]),

    //Reverse Symbol Lookup map
    rlu = new Map([[1,1],[2,2],[3,4],[4,8],[5,16],[6,32],[7,64],[8,128],[9,256],[10,512],[11,3],[11,264],[13,200],[14,201],[15,"&&"],[16,"AND"],[17,"And"],[18,"and"],[19,"||"],[20,"OR"],[21,"Or"],[22,"or"],[23,"("],[24,")"],[25,"\""],[26,"'"],[5,null],[29,"\\"]]),

    // States 
    state = [sm0,
sm1,
sm2,
sm3,
sm4,
sm0,
sm5,
sm6,
sm6,
sm7,
sm8,
sm9,
sm10,
sm11,
sm11,
sm11,
sm11,
sm12,
sm12,
sm12,
sm12,
sm12,
sm12,
sm13,
sm0,
sm0,
sm0,
sm0,
sm0,
sm0,
sm0,
sm0,
sm14,
sm15,
sm16,
sm17,
sm18,
sm19,
sm19,
sm19,
sm19,
sm20,
sm20,
sm20,
sm20,
sm21,
sm22,
sm22],

/************ Functions *************/

    max = Math.max, min = Math.min,

    //Error Functions
    e = (tk,r,o,l,p)=>{if(l.END)l.throw("Unexpected end of input");else if(l.ty & (264)) l.throw(`Unexpected space character within input "${p.slice(l)}" `) ; else l.throw(`Unexpected token ${l.tx}" `)}, 
    eh = [e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e,
e],

    //Empty Function
    nf = ()=>-1, 

    //Environment Functions
    
redv = (ret, fn, plen, ln, t, e, o, l, s) => {        ln = max(o.length - plen, 0);        const slice = o.slice(-plen);        o.length = ln + 1;        o[ln] = fn(slice, e, l, s, o, plen);        return ret;    },
rednv = (ret, Fn, plen, ln, t, e, o, l, s) => {        ln = max(o.length - plen, 0);        const slice = o.slice(-plen);        o.length = ln + 1;        o[ln] = new Fn(slice, e, l, s, o, plen);        return ret;    },
redn = (ret, plen, t, e, o) => {        if (plen > 0) {            let ln = max(o.length - plen, 0);            o[ln] = o[o.length - 1];            o.length = ln + 1;        }        return ret;    },
shftf = (ret, fn, t, e, o, l, s) => (fn(o, e, l, s), ret),
C20_and_expression=function (sym){this.type = "AND";this.left = sym[0];this.right = sym[2];},
C30_or_expression=function (sym){this.type = "OR";this.left = sym[0];this.right = sym[2];},
R40_wrapped_expression=sym=>sym[1],
C41_wrapped_expression=function (sym){this.type = "MATCH";this.value = sym[0];},
R70_undefined1801_group_list=sym=>sym[0] + sym[1],
R71_undefined1801_group_list=sym=>sym[0] + "",

    //Sparse Map Lookup
    lsm = (index, map) => {    if (map[0] == 0xFFFFFFFF) return map[index + 1];    for (let i = 1, ind = 0, l = map.length, n = 0; i < l && ind <= index; i++) {        if (ind !== index) {            if ((n = map[i]) > -1) ind++;            else ind += -n;        } else return map[i];    }    return -1;},

    //State Action Functions
    state_funct = [e=>70,
e=>62,
e=>90,
e=>86,
e=>82,
e=>78,
e=>66,
e=>74,
e=>22,
e=>30,
e=>34,
e=>94,
(...v)=>redn(5,1,...v),
(...v)=>redn(1031,1,...v),
(...v)=>redn(2055,1,...v),
e=>98,
e=>102,
e=>106,
e=>110,
(...v)=>redn(3079,1,...v),
e=>114,
e=>118,
e=>122,
e=>126,
(...v)=>rednv(4103,C41_wrapped_expression,1,0,...v),
(...v)=>redn(5127,1,...v),
(...v)=>redn(8199,1,...v),
(...v)=>redv(7175,R71_undefined1801_group_list,1,0,...v),
(...v)=>redn(6151,1,...v),
(...v)=>redn(9223,1,...v),
(...v)=>redn(11271,1,...v),
e=>182,
e=>186,
e=>190,
(...v)=>redv(7179,R70_undefined1801_group_list,2,0,...v),
(...v)=>redv(10251,R40_wrapped_expression,2,0,...v),
(...v)=>rednv(2063,C20_and_expression,3,0,...v),
(...v)=>rednv(3087,C30_or_expression,3,0,...v),
(...v)=>redv(4111,R40_wrapped_expression,3,0,...v),
(...v)=>redv(5135,R40_wrapped_expression,3,0,...v)],

    //Goto Lookup Functions
    goto = [v=>lsm(v,gt0),
nf,
nf,
nf,
nf,
v=>lsm(v,gt1),
nf,
v=>lsm(v,gt2),
v=>lsm(v,gt3),
nf,
v=>lsm(v,gt4),
nf,
nf,
nf,
nf,
nf,
nf,
nf,
nf,
nf,
nf,
nf,
nf,
v=>lsm(v,gt5),
v=>lsm(v,gt6),
v=>lsm(v,gt7),
v=>lsm(v,gt8),
v=>lsm(v,gt9),
v=>lsm(v,gt10),
v=>lsm(v,gt11),
v=>lsm(v,gt12),
v=>lsm(v,gt13),
nf,
nf,
nf,
nf,
nf,
nf,
nf,
nf,
nf,
nf,
nf,
nf,
nf,
nf,
nf,
nf];

function getToken(l, SYM_LU) {
    if (l.END) return 0; /*$eof*/

    switch (l.ty) {
        case 2:
            //*
            if (SYM_LU.has(l.tx)) return 14;
            /*/
                console.log(l.tx, SYM_LU.has(l.tx), SYM_LU.get(l.tx))
                if (SYM_LU.has(l.tx)) return SYM_LU.get(l.tx);
            //*/
            return 2;
        case 1:
            return 1;
        case 4:
            return 3;
        case 256:
            return 9;
        case 8:
            return 4;
        case 512:
            return 10;
        default:
            return SYM_LU.get(l.tx) || SYM_LU.get(l.ty);
    }
}

/************ Parser *************/

function parser(l, e = {}) {

    fn = e.functions;

    l.IWS = false;
    l.PARSE_STRING = true;

    if (symbols.length > 0) {
        symbols.forEach(s => { l.addSymbol(s) });
        l.tl = 0;
        l.next();
    }

    const recovery_chain = [];

    const o = [],
        ss = [0, 0];

    let time = 1000000,
        RECOVERING = 100,
        RESTARTED = true,
        tk = getToken(l, lu),
        p = l.copy(),
        sp = 1,
        len = 0,
        reduceStack = (e.reduceStack = []),
        ROOT = 10000,
        off = 0;

    outer:

        while (time-- > 0) {

            const fn = lsm(tk, state[ss[sp]]) || 0;

            let r,
                gt = -1;

            if (fn == 0) {
                /*Ignore the token*/
                tk = getToken(l.next(), lu);
                continue;
            }

            if (fn > 0) {
                r = state_funct[fn - 1](tk, e, o, l, ss[sp - 1]);
            } else {

                if (tk == 14) {
                    tk = lu.get(l.tx);
                    continue;
                }

                if (l.ty == 8 && l.tl > 1) {
                    // Make sure that special tokens are not getting in the way
                    l.tl = 0;
                    // This will skip the generation of a custom symbol
                    l.next(l, false);

                    if (l.tl == 1)
                        continue;
                }

                if (RECOVERING > 1 && !l.END) {

                    if (tk !== lu.get(l.ty)) {
                        tk = lu.get(l.ty);
                        continue;
                    }

                    if (tk !== 13) {
                        tk = 13;
                        RECOVERING = 1;
                        continue;
                    }
                }

                tk = getToken(l, lu);

                const recovery_token = eh[ss[sp]](tk, e, o, l, p, ss[sp], (lex) => getToken(lex, lu));

                if (RECOVERING > 0 && recovery_token >= 0) {
                    RECOVERING = -1; /* To prevent infinite recursion */
                    tk = recovery_token;
                    l.tl = 0; /*reset current token */
                    continue;
                }
            }

            switch (r & 3) {
                case 0:
                    /* ERROR */

                    if (tk == "$eof")
                        l.throw("Unexpected end of input");

                    l.throw(`Unexpected token [${RECOVERING ? l.next().tx : l.tx}]`);
                    return [null];

                case 1:
                    /* ACCEPT */
                    break outer;

                case 2:

                    /*SHIFT */
                    o.push(l.tx);
                    ss.push(off, r >> 2);
                    sp += 2;
                    l.next();
                    off = l.off;
                    tk = getToken(l, lu);
                    RECOVERING++;
                    break;

                case 3:
                    /* REDUCE */
                    RESTARTED = true;

                    len = (r & 0x3FC) >> 1;

                    ss.length -= len;
                    sp -= len;
                    gt = goto[ss[sp]](r >> 10);

                    if (gt < 0)
                        l.throw("Invalid state reached!");

                    if (reduceStack.length > 0) {
                        let i = reduceStack.length - 1;
                        while (i > -1) {
                            let item = reduceStack[i--];

                            if (item.index == sp) {
                                item.action(output)
                            } else if (item.index > sp) {
                                reduceStack.length--;
                            } else {
                                break;
                            }
                        }
                    }

                    ss.push(off, gt);
                    sp += 2;
                    break;
            }
        }
    return o[0];
}; export default parser;
