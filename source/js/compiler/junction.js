let fn = {}; const 
/************** Maps **************/

    /* Symbols To Inject into the Lexer */
    symbols = ["((","))"],

    /* Goto lookup maps */
    gt0 = [0,-2,2,1,-2,3,-3,4,5,7,6],
gt1 = [0,-2,18,-3,19,-3,4,5,7,6],
gt2 = [0,-10,20,5,7,6],
gt3 = [0,-13,21],
gt4 = [0,-7,24,23,22,-1,25,7,6],
gt5 = [0,-11,27,7,6],
gt6 = [0,-5,28],
gt7 = [0,-4,30,-2,24,23,32,-1,25,7,6],
gt8 = [0,-7,24,23,35,-1,25,7,6],

    // State action lookup maps
    sm0=[0,-1,-1,1,-1,2,3,4,5,6,7,-1,-1,-1,8,-1,-1,-1,-1,9,-1,-1,-1,10],
sm1=[0,11,-1,1,-1,2,3,4,5,6,7,-1,-1,-1,8,-1,-1,-1,-1,9,-1,-1,-1,10],
sm2=[0,12,-1,1,-1,2,3,4,5,6,7,-1,-1,-1,8,-1,-1,-1,-1,12,-1,-1,-1,10],
sm3=[0,13,-1,13,-1,13,13,13,13,13,13,-1,-1,-1,13,-1,-1,-1,-1,13,-1,-1,-1,13],
sm4=[0,14,-1,14,-1,14,14,14,14,14,14,-1,-1,-1,14,-1,-1,-1,-1,14,-1,-1,-1,14],
sm5=[0,15,-1,15,-1,15,15,15,15,15,15,-1,-1,-1,15,-1,-1,-1,-1,15,-1,-1,-1,15],
sm6=[0,16,-1,16,-1,16,16,16,16,16,16,-1,-1,-1,16,-1,16,-1,16,16,16,-1,-1,16],
sm7=[0,17,-1,17,-1,17,17,17,17,17,17,-1,-1,-1,17,-1,17,-1,17,17,17,-1,-1,17],
sm8=[0,-1,-1,1,-1,0,3,4,5,6,0,-1,-1,-1,8],
sm9=[0,-1,-1,1,-1,2,3,4,5,6,7,-1,-1,-1,8,-1,-1,-1,-1,-1,18,-1,-1,10],
sm10=[0,19,-1,1,-1,2,3,4,5,6,7,-1,-1,-1,8,-1,-1,-1,-1,19,-1,-1,-1,10],
sm11=[0,20,-1,20,-1,20,20,20,20,20,20,-1,-1,-1,20,-1,-1,-1,-1,20,-1,-1,-1,20],
sm12=[0,21,-1,21,-1,21,21,21,21,21,21,-1,-1,-1,21,-1,-1,-1,-1,21,-1,-1,-1,21],
sm13=[0,22,-1,22,-1,22,22,22,22,22,22,-1,-1,-1,22,-1,22,-1,22,22,22,-1,-1,22],
sm14=[0,-1,-1,-1,-1,0,-1,-1,-1,-1,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,23],
sm15=[0,-1,-1,-1,-1,0,-1,-1,-1,-1,0,-1,-1,-1,-1,-1,24,-1,24,-1,24],
sm16=[0,-1,-1,1,-1,2,3,4,5,6,7,-1,-1,-1,8,-1,25,-1,25,-1,25,-1,-1,10],
sm17=[0,-1,-1,26,-1,26,26,26,26,26,26,-1,-1,-1,26,-1,26,-1,26,-1,26,-1,-1,26],
sm18=[0,27,-1,27,-1,27,27,27,27,27,27,-1,-1,-1,27,-1,-1,28,-1,27,-1,-1,-1,27],
sm19=[0,-1,-1,29,-1,29,29,29,29,29,29,-1,-1,-1,29,-1,29,-1,29,-1,29,-1,-1,29],
sm20=[0,30,-1,30,-1,30,30,30,30,30,30,-1,-1,-1,30,-1,-1,-1,-1,30,-1,-1,-1,30],
sm21=[0,-1,-1,1,-1,2,3,4,5,6,7,-1,-1,-1,8,-1,18,-1,31,-1,-1,-1,-1,10],
sm22=[0,-1,-1,-1,-1,0,-1,-1,-1,-1,0,-1,-1,-1,-1,-1,32,-1,33],
sm23=[0,34,-1,34,-1,34,34,34,34,34,34,-1,-1,-1,34,-1,-1,-1,-1,34,-1,-1,-1,34],
sm24=[0,-1,-1,-1,-1,0,-1,-1,-1,-1,0,-1,-1,-1,-1,-1,35,-1,35],
sm25=[0,36,-1,36,-1,36,36,36,36,36,36,-1,-1,-1,36,-1,-1,-1,-1,36,-1,-1,-1,36],
sm26=[0,-1,-1,1,-1,2,3,4,5,6,7,-1,-1,-1,8,-1,18,-1,18,-1,-1,-1,-1,10],
sm27=[0,-1,-1,-1,-1,0,-1,-1,-1,-1,0,-1,-1,-1,-1,-1,37,-1,37],

    // Symbol Lookup map
    lu = new Map([[1,1],[2,2],[4,3],[8,4],[16,5],[32,6],[64,7],[128,8],[256,9],[512,10],[3,11],[264,12],[200,13],[201,14],[",",15],["[",16],["]",17],["((",18],["))",19],[null,5],["\\",22]]),

    //Reverse Symbol Lookup map
    rlu = new Map([[1,1],[2,2],[3,4],[4,8],[5,16],[6,32],[7,64],[8,128],[9,256],[10,512],[11,3],[12,264],[13,200],[14,201],[15,","],[16,"["],[17,"]"],[18,"(("],[19,"))"],[5,null],[22,"\\"]]),

    // States 
    state = [sm0,
sm1,
sm2,
sm3,
sm4,
sm5,
sm6,
sm6,
sm6,
sm6,
sm7,
sm7,
sm7,
sm7,
sm7,
sm7,
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
sm18,
sm19,
sm20,
sm21,
sm22,
sm23,
sm24,
sm25,
sm26,
sm27],

/************ Functions *************/

    max = Math.max, min = Math.min,

    //Error Functions
    e = (tk,r,o,l,p)=>{if(l.END)l.throw("Unexpected end of input");else if(l.ty & (264)) l.throw(`Unexpected space character within input "${p.slice(l)}" `) ; else l.throw(`Unexpected token [${l.tx}]`)}, 
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
e],

    //Empty Function
    nf = ()=>-1, 

    //Environment Functions
    
redv = (ret, fn, plen, ln, t, e, o, l, s) => {        ln = max(o.length - plen, 0);        const slice = o.slice(-plen);        o.length = ln + 1;        o[ln] = fn(slice, e, l, s, o, plen);        return ret;    },
rednv = (ret, Fn, plen, ln, t, e, o, l, s) => {        ln = max(o.length - plen, 0);        const slice = o.slice(-plen);        o.length = ln + 1;        o[ln] = new Fn(slice, e, l, s, o, plen);        return ret;    },
redn = (ret, plen, t, e, o) => {        if (plen > 0) {            let ln = max(o.length - plen, 0);            o[ln] = o[o.length - 1];            o.length = ln + 1;        }        return ret;    },
shftf = (ret, fn, t, e, o, l, s) => (fn(o, e, l, s), ret),
R10_string_data_list=sym=>(((sym[1] !== null) ? sym[0].push(sym[1]) : null,sym[0])),
R11_string_data_list=sym=>(sym[0] !== null) ? [sym[0]] : [],
R30_items=()=>[],
R31_items=sym=>[sym[0]],
R32_items=sym=>sym[0],
R33_items=sym=>((sym[0].push(sym[1]),sym[0])),
R40_data_string_list=sym=>(((sym[1] !== null) ? sym[0].push(sym[2]) : null,sym[0])),
R50_undefined621_group=sym=>sym[1],
R51_undefined621_group=()=>$sym2,
C60_data_insert_point=function (sym,env,lex){this.start = env.start;this.end = lex.off;this.query = sym[1];this.action = sym[3];},
I61_data_insert_point=function (sym,env,lex){env.start = lex.off;},
C62_data_insert_point=function (sym,env,lex){this.start = env.start;this.end = lex.off;this.query = sym[1];this.action = null;},
R70_string_data_val_list=sym=>sym[0] + sym[1],
R71_string_data_val_list=sym=>sym[0] + "",

    //Sparse Map Lookup
    lsm = (index, map) => {    if (map[0] == 0xFFFFFFFF) return map[index + 1];    for (let i = 1, ind = 0, l = map.length, n = 0; i < l && ind <= index; i++) {        if (ind !== index) {            if ((n = map[i]) > -1) ind++;            else ind += -n;        } else return map[i];    }    return -1;},

    //State Action Functions
    state_funct = [e=>42,
e=>34,
e=>62,
e=>58,
e=>54,
e=>50,
e=>38,
e=>46,
(...v)=>shftf(70,I61_data_insert_point,...v),
e=>66,
(...v)=>redn(5,1,...v),
(...v)=>redv(3079,R30_items,1,0,...v),
(...v)=>redv(3079,R31_items,1,0,...v),
(...v)=>redv(2055,R11_string_data_list,1,0,...v),
(...v)=>redn(10247,1,...v),
(...v)=>redn(11271,1,...v),
(...v)=>redn(13319,1,...v),
(...v)=>(redn(8195,0,...v)),
(...v)=>redv(3083,R32_items,2,0,...v),
(...v)=>redv(3083,R33_items,2,0,...v),
(...v)=>redv(2059,R10_string_data_list,2,0,...v),
(...v)=>redv(12299,R50_undefined621_group,2,0,...v),
e=>106,
(...v)=>redn(9223,1,...v),
(...v)=>redn(8199,1,...v),
(...v)=>redv(7175,R71_string_data_val_list,1,0,...v),
(...v)=>rednv(6159,C62_data_insert_point,3,0,...v),
e=>118,
(...v)=>redv(7179,R70_string_data_val_list,2,0,...v),
(...v)=>rednv(6163,C60_data_insert_point,4,0,...v),
e=>126,
e=>138,
e=>134,
(...v)=>redv(5131,R51_undefined621_group,2,0,...v),
(...v)=>redv(4103,R11_string_data_list,1,0,...v),
(...v)=>redv(5135,R50_undefined621_group,3,0,...v),
(...v)=>redv(4111,R40_data_string_list,3,0,...v)],

    //Goto Lookup Functions
    goto = [v=>lsm(v,gt0),
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
nf,
nf,
nf,
v=>lsm(v,gt3),
v=>lsm(v,gt4),
v=>lsm(v,gt2),
nf,
nf,
nf,
nf,
nf,
v=>lsm(v,gt5),
nf,
v=>lsm(v,gt6),
nf,
nf,
v=>lsm(v,gt7),
nf,
nf,
nf,
nf,
v=>lsm(v,gt8),
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
                            const item = reduceStack[i--];

                            if (item.index == sp) {
                                item.action(output);
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