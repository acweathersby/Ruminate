let fn = {}; const 
/************** Maps **************/

    /* Symbols To Inject into the Lexer */
    symbols = ["((","))"],

    /* Goto lookup maps */
    gt0 = [0,-1,2,1,4,3,-2,6,8,7],
gt1 = [0,-3,4,18,-2,6,8,7],
gt2 = [0,-7,19,8,7],
gt3 = [0,-5,21,20,-2,22],
gt4 = [0,-9,23],
gt5 = [0,-9,25],

    // State action lookup maps
    sm0=[0,1,-1,2,-1,3,4,5,6,7,8,-3,9,-1,10,-3,11],
sm1=[0,12,-3,0,-4,0],
sm2=[0,13,-1,2,-1,3,4,5,6,7,8,-3,9,-1,10,-3,11],
sm3=[0,14,-1,14,-1,14,14,14,14,14,14,-3,14,-1,14,-3,14],
sm4=[0,15,-1,2,-1,3,4,5,6,7,8,-3,9,-1,15,-3,11],
sm5=[0,-2,2,-1,0,4,5,6,7,0,-3,9],
sm6=[0,16,-1,16,-1,16,16,16,16,16,16,-3,16,-1,16,-3,16],
sm7=[0,17,-1,17,-1,17,17,17,17,17,17,-3,17,-1,17,-3,17],
sm8=[0,18,-1,18,-1,18,18,18,18,18,18,-3,18,-1,18,18,-2,18],
sm9=[0,19,-1,19,-1,19,19,19,19,19,19,-3,19,-1,19,-3,19],
sm10=[0,20,-1,20,-1,20,20,20,20,20,20,-3,20,-1,20,-3,20],
sm11=[0,-4,0,-4,0,-6,21],
sm12=[0,-2,2,-1,0,4,5,6,7,0,-3,9,-2,22],
sm13=[0,-2,23,-1,0,23,23,23,23,0,-3,23,-2,23],
sm14=[0,24,-1,24,-1,24,24,24,24,24,24,-3,24,-1,24,-3,24],
sm15=[0,25,-1,25,-1,25,25,25,25,25,25,-3,25,-1,25,-3,25],
sm16=[0,-2,26,-1,0,26,26,26,26,0,-3,26,-2,26],

    // Symbol Lookup map
    lu = new Map([[1,1],[2,2],[4,3],[8,4],[16,5],[32,6],[64,7],[128,8],[256,9],[512,10],[3,11],[264,11],[200,13],[201,14],["((",15],["))",16],[null,5],["\\",19]]),

    //Reverse Symbol Lookup map
    rlu = new Map([[1,1],[2,2],[3,4],[4,8],[5,16],[6,32],[7,64],[8,128],[9,256],[10,512],[11,3],[11,264],[13,200],[14,201],[15,"(("],[16,"))"],[5,null],[19,"\\"]]),

    // States 
    state = [sm0,
sm1,
sm2,
sm3,
sm4,
sm5,
sm6,
sm7,
sm7,
sm7,
sm7,
sm8,
sm8,
sm8,
sm8,
sm8,
sm8,
sm5,
sm9,
sm10,
sm11,
sm12,
sm13,
sm14,
sm15,
sm16],

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
e],

    //Empty Function
    nf = ()=>-1, 

    //Environment Functions
    
redv = (ret, fn, plen, ln, t, e, o, l, s) => {        ln = max(o.length - plen, 0);        const slice = o.slice(-plen);        o.length = ln + 1;        o[ln] = fn(slice, e, l, s, o, plen);        return ret;    },
rednv = (ret, Fn, plen, ln, t, e, o, l, s) => {        ln = max(o.length - plen, 0);        const slice = o.slice(-plen);        o.length = ln + 1;        o[ln] = new Fn(slice, e, l, s, o, plen);        return ret;    },
redn = (ret, plen, t, e, o) => {        if (plen > 0) {            let ln = max(o.length - plen, 0);            o[ln] = o[o.length - 1];            o.length = ln + 1;        }        return ret;    },
shftf = (ret, fn, t, e, o, l, s) => (fn(o, e, l, s), ret),
R10_item_list=sym=>(((sym[1] !== null) ? sym[0].push(sym[1]) : null,sym[0])),
R11_item_list=sym=>(sym[0] !== null) ? [sym[0]] : [],
R30_string_data_val_list=sym=>sym[0] + sym[1],
R31_string_data_val_list=sym=>sym[0] + "",
C40_item=function (sym){this.type = "REDUCE";this.value = sym[1];},
R80_escaped_value=sym=>sym[1],

    //Sparse Map Lookup
    lsm = (index, map) => {    if (map[0] == 0xFFFFFFFF) return map[index + 1];    for (let i = 1, ind = 0, l = map.length, n = 0; i < l && ind <= index; i++) {        if (ind !== index) {            if ((n = map[i]) > -1) ind++;            else ind += -n;        } else return map[i];    }    return -1;},

    //State Action Functions
    state_funct = [(...v)=>(redn(2051,0,...v)),
e=>46,
e=>38,
e=>66,
e=>62,
e=>58,
e=>54,
e=>42,
e=>50,
e=>22,
e=>70,
(...v)=>redn(5,1,...v),
(...v)=>redn(2055,1,...v),
(...v)=>redv(1031,R11_item_list,1,0,...v),
(...v)=>redn(4103,1,...v),
(...v)=>redv(3079,R31_string_data_val_list,1,0,...v),
(...v)=>redn(7175,1,...v),
(...v)=>redn(9223,1,...v),
(...v)=>redv(1035,R10_item_list,2,0,...v),
(...v)=>redv(3083,R30_string_data_val_list,2,0,...v),
e=>98,
(...v)=>redn(6151,1,...v),
(...v)=>redv(5127,R31_string_data_val_list,1,0,...v),
(...v)=>redv(8203,R80_escaped_value,2,0,...v),
(...v)=>rednv(4111,C40_item,3,0,...v),
(...v)=>redv(5131,R30_string_data_val_list,2,0,...v)],

    //Goto Lookup Functions
    goto = [v=>lsm(v,gt0),
nf,
v=>lsm(v,gt1),
nf,
v=>lsm(v,gt2),
v=>lsm(v,gt3),
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
v=>lsm(v,gt4),
nf,
nf,
nf,
v=>lsm(v,gt5),
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
}; const reduce_tree = parser;