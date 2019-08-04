let fn = {}; const 
/************** Maps **************/

    /* Symbols To Inject into the Lexer */
    symbols = ["&&","||",":"],

    /* Goto lookup maps */
    gt0 = [0,-1,1,2,-1,3,-5,5,-1,6,8,7],
gt1 = [0,-5,18,19,20,21,23,27,26,6,8,7],
gt2 = [0,-12,28,8,7],
gt3 = [0,-14,29],
gt4 = [0,-5,30,19,20,21,23,27,26,6,8,7],
gt5 = [0,-5,39,19,20,21,23,27,26,6,8,7],
gt6 = [0,-10,27,40,6,8,7],
gt7 = [0,-10,27,41,6,8,7],
gt8 = [0,-6,42,20,21,23,27,26,6,8,7],
gt9 = [0,-6,43,20,21,23,27,26,6,8,7],
gt10 = [0,-6,44,20,21,23,27,26,6,8,7],
gt11 = [0,-6,45,20,21,23,27,26,6,8,7],
gt12 = [0,-7,46,21,23,27,26,6,8,7],
gt13 = [0,-7,47,21,23,27,26,6,8,7],
gt14 = [0,-7,48,21,23,27,26,6,8,7],
gt15 = [0,-7,49,21,23,27,26,6,8,7],

    // State action lookup maps
    sm0=[0,1,-1,2,-1,3,4,5,6,7,0,-3,8,-1,9,-13,10],
sm1=[0,11,-3,0,-4,0],
sm2=[0,12,-3,0,-4,0],
sm3=[0,13,-3,0,-4,0,-5,14],
sm4=[0,15,-1,2,-1,3,4,5,6,7,0,-3,8,-10,16,-1,17,18,-1,10],
sm5=[0,19,-1,2,-1,3,4,5,6,7,0,-3,8,-1,19,-13,10],
sm6=[0,20,-1,20,-1,20,20,20,20,20,0,-3,20,-1,20,20,20,20,20,20,20,20,20,-1,20,20,20,-1,20],
sm7=[0,21,-1,21,-1,21,21,21,21,21,0,-3,21,-1,21,21,21,21,21,21,21,21,21,-1,21,21,21,-1,21],
sm8=[0,22,-1,22,-1,22,22,22,22,22,0,-3,22,-1,22,22,22,22,22,22,22,22,22,-1,22,22,22,-1,22],
sm9=[0,-2,2,-1,0,4,5,6,7,0,-3,8],
sm10=[0,23,-1,2,-1,3,4,5,6,7,0,-3,8,-10,16,-1,17,18,-1,10],
sm11=[0,24,-3,0,-4,0],
sm12=[0,25,-3,0,-4,0,-15,25],
sm13=[0,26,-3,0,-4,0,-6,27,28,29,30,-5,26],
sm14=[0,31,-3,0,-4,0,-6,31,31,31,31,32,33,34,35,-1,31],
sm15=[0,-2,2,-1,3,4,5,6,7,0,-3,8,-10,16,-1,17,18,-1,10],
sm16=[0,36,-3,0,-4,0,-6,36,36,36,36,36,36,36,36,-1,36],
sm17=[0,-2,2,-1,3,4,5,6,7,0,-3,8,-15,10],
sm18=[0,37,-3,0,-4,0,-6,37,37,37,37,37,37,37,37,-1,37],
sm19=[0,38,-1,2,-1,3,4,5,6,7,0,-3,8,-2,38,38,38,38,38,38,38,38,-1,38,38,38,-1,10],
sm20=[0,39,-1,39,-1,39,39,39,39,39,0,-3,39,-1,39,39,39,39,39,39,39,39,39,-1,39,39,39,-1,39],
sm21=[0,40,-1,40,-1,40,40,40,40,40,0,-3,40,-1,40,40,40,40,40,40,40,40,40,-1,40,40,40,-1,40],
sm22=[0,41,-3,0,-4,0],
sm23=[0,-4,0,-4,0,-15,42],
sm24=[0,-4,0,-4,0,-16,43],
sm25=[0,-4,0,-4,0,-17,44],
sm26=[0,45,-3,0,-4,0,-15,45],
sm27=[0,46,-3,0,-4,0,-6,46,46,46,46,-5,46],
sm28=[0,47,-3,0,-4,0,-6,47,47,47,47,47,47,47,47,-1,47],
sm29=[0,48,-3,0,-4,0,-6,48,48,48,48,48,48,48,48,-1,48],

    // Symbol Lookup map
    lu = new Map([[1,1],[2,2],[4,3],[8,4],[16,5],[32,6],[64,7],[128,8],[256,9],[512,10],[3,11],[264,11],[200,13],[201,14],[":",15],["&&",16],["AND",17],["And",18],["and",19],["||",20],["OR",21],["Or",22],["or",23],["(",24],[")",25],["\"",26],["'",27],[null,5],["\\",29]]),

    //Reverse Symbol Lookup map
    rlu = new Map([[1,1],[2,2],[3,4],[4,8],[5,16],[6,32],[7,64],[8,128],[9,256],[10,512],[11,3],[11,264],[13,200],[14,201],[15,":"],[16,"&&"],[17,"AND"],[18,"And"],[19,"and"],[20,"||"],[21,"OR"],[22,"Or"],[23,"or"],[24,"("],[25,")"],[26,"\""],[27,"'"],[5,null],[29,"\\"]]),

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
sm8,
sm8,
sm8,
sm8,
sm8,
sm8,
sm9,
sm10,
sm11,
sm12,
sm13,
sm14,
sm15,
sm16,
sm17,
sm17,
sm18,
sm19,
sm20,
sm21,
sm22,
sm15,
sm15,
sm15,
sm15,
sm15,
sm15,
sm15,
sm15,
sm23,
sm24,
sm25,
sm26,
sm26,
sm26,
sm26,
sm27,
sm27,
sm27,
sm27,
sm28,
sm29,
sm29],

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
C20_query_body=function (sym){this.container = sym[0];this.query = null;},
C21_query_body=function (sym){this.container = sym[0];this.query = sym[2];},
C22_query_body=function (sym){this.query = sym[1];},
C23_query_body=function (){this.query = null;},
R30_string_data_val_list=sym=>sym[0] + sym[1],
R31_string_data_val_list=sym=>sym[0] + "",
C40_container_object=function (sym){this.data = sym[0];},
C60_and_expression=function (sym){this.type = "AND";this.left = sym[0];this.right = sym[2];},
C70_or_expression=function (sym){this.type = "OR";this.left = sym[0];this.right = sym[2];},
R80_wrapped_expression=sym=>sym[1],
C81_wrapped_expression=function (sym){this.type = "MATCH";this.value = sym[0] || "";this.value = this.value.trim();},

    //Sparse Map Lookup
    lsm = (index, map) => {    if (map[0] == 0xFFFFFFFF) return map[index + 1];    for (let i = 1, ind = 0, l = map.length, n = 0; i < l && ind <= index; i++) {        if (ind !== index) {            if ((n = map[i]) > -1) ind++;            else ind += -n;        } else return map[i];    }    return -1;},

    //State Action Functions
    state_funct = [(...v)=>(redn(1027,0,...v)),
e=>42,
e=>38,
e=>62,
e=>58,
e=>54,
e=>50,
e=>46,
e=>18,
e=>66,
(...v)=>redn(5,1,...v),
(...v)=>redn(1031,1,...v),
(...v)=>rednv(2055,C20_query_body,1,0,...v),
e=>70,
(...v)=>rednv(2055,C23_query_body,1,0,...v),
e=>90,
e=>98,
e=>102,
(...v)=>rednv(4103,C40_container_object,1,0,...v),
(...v)=>redv(10247,R31_string_data_val_list,1,0,...v),
(...v)=>redn(12295,1,...v),
(...v)=>redn(14343,1,...v),
(...v)=>rednv(2059,C20_query_body,2,0,...v),
(...v)=>rednv(2059,C22_query_body,2,0,...v),
(...v)=>redn(5127,1,...v),
(...v)=>redn(6151,1,...v),
e=>126,
e=>130,
e=>134,
e=>138,
(...v)=>redn(7175,1,...v),
e=>142,
e=>146,
e=>150,
e=>154,
(...v)=>rednv(8199,C81_wrapped_expression,1,0,...v),
(...v)=>redn(9223,1,...v),
(...v)=>redn(11271,1,...v),
(...v)=>redv(10251,R30_string_data_val_list,2,0,...v),
(...v)=>redv(13323,R80_wrapped_expression,2,0,...v),
(...v)=>rednv(2063,C21_query_body,3,0,...v),
e=>202,
e=>206,
e=>210,
(...v)=>rednv(6159,C60_and_expression,3,0,...v),
(...v)=>rednv(7183,C70_or_expression,3,0,...v),
(...v)=>redv(8207,R80_wrapped_expression,3,0,...v),
(...v)=>redv(9231,R80_wrapped_expression,3,0,...v)],

    //Goto Lookup Functions
    goto = [v=>lsm(v,gt0),
nf,
nf,
nf,
v=>lsm(v,gt1),
v=>lsm(v,gt2),
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
v=>lsm(v,gt3),
v=>lsm(v,gt4),
nf,
nf,
nf,
nf,
v=>lsm(v,gt5),
nf,
v=>lsm(v,gt6),
v=>lsm(v,gt7),
nf,
v=>lsm(v,gt2),
nf,
nf,
nf,
v=>lsm(v,gt8),
v=>lsm(v,gt9),
v=>lsm(v,gt10),
v=>lsm(v,gt11),
v=>lsm(v,gt12),
v=>lsm(v,gt13),
v=>lsm(v,gt14),
v=>lsm(v,gt15),
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
}; const gnql = parser;