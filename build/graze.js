var graze_objects = (function (exports, worker_threads, fs, path) {
    'use strict';

    fs = fs && fs.hasOwnProperty('default') ? fs['default'] : fs;
    path = path && path.hasOwnProperty('default') ? path['default'] : path;

    /* TODO - Make sure UID algorithm generates effectivly unique IDs */
    class UID extends ArrayBuffer {
        constructor(string_val) {

            super(16);

            const dv = new DataView(this);

            if (string_val && typeof string_val == "string") {
                string_val
                    .split("-")
                    .slice(0, 4)
                    .map((v, i) => dv.setUint32(i << 2, parseInt(v, 16)));

            } else {
                dv.setUint32(0, Math.random() * 0xFFFFFFFF);
                dv.setUint32(4, Math.random() * 0xFFFFFFFF);
                dv.setUint32(8, Math.random() * 0xFFFFFFFF);
                dv.setUint32(12, Math.random() * 0xFFFFFFFF);
            }
        }

        /** Returns a string representation of the UID */
        get string() {
            const dv = new DataView(this);
            return (
                "" +  ("00000000"+dv.getUint32(0).toString(16)).slice(-8) +
                "-" + ("00000000"+dv.getUint32(4).toString(16)).slice(-8) +
                "-" + ("00000000"+dv.getUint32(8).toString(16)).slice(-8) +
                "-" + ("00000000"+dv.getUint32(12).toString(16)).slice(-8)
            )
        }

        set string(e) {
            //empty function
        }

        toString() {
            return this.string;
        }

        get length() {
            return this.byteLength;
        }

        frozenClone() {

            const
                uid = new UID,
                dv1 = new DataView(this),
                dv2 = new DataView(uid);

            for (let i = -1; ++i < 4;)
                dv2.setUint32(i << 2, dv1.getUint32(i << 2));

            Object.freeze(uid);

            return uid;
        }

        static stringIsUID(string) {
            const match = string.match(/[a-f\d]{8}\-[a-f\d]{8}\-[a-f\d]{8}\-[a-f\d]{8}/);
            return match && match[0] == string;
        }
    }

    let fn = {}; const 
    /************** Maps **************/

        /* Symbols To Inject into the Lexer */
        symbols = ["((","))"],

        /* Goto lookup maps */
        gt0 = [0,-1,2,1,4,3,5,-3,6,7,9,8],
    gt1 = [0,-3,4,20,5,-3,6,7,9,8],
    gt2 = [0,-9,21,7,9,8],
    gt3 = [0,-12,22],
    gt4 = [0,-6,25,24,23,-1,26,9,8],
    gt5 = [0,-10,28,9,8],

        // State action lookup maps
        sm0=[0,1,-1,2,-1,3,4,5,6,7,8,-3,9,-1,10,-3,11],
    sm1=[0,12,-3,0,-4,0],
    sm2=[0,13,-1,2,-1,3,4,5,6,7,8,-3,9,-1,10,-3,11],
    sm3=[0,14,-1,14,-1,14,14,14,14,14,14,-3,14,-1,14,-3,14],
    sm4=[0,15,-1,2,-1,3,4,5,6,7,8,-3,9,-1,15,-3,11],
    sm5=[0,15,-1,15,-1,15,15,15,15,15,15,-3,15,-1,15,-3,15],
    sm6=[0,16,-1,16,-1,16,16,16,16,16,16,-3,16,-1,16,-3,16],
    sm7=[0,17,-1,17,-1,17,17,17,17,17,17,-3,17,-1,17,-3,17],
    sm8=[0,18,-1,18,-1,18,18,18,18,18,18,-3,18,-1,18,18,-2,18],
    sm9=[0,19,-1,19,-1,19,19,19,19,19,19,-3,19,-1,19,19,-2,19],
    sm10=[0,-2,2,-1,0,4,5,6,7,0,-3,9],
    sm11=[0,20,-1,2,-1,3,4,5,6,7,8,-3,9,-1,20,20,-2,11],
    sm12=[0,21,-1,21,-1,21,21,21,21,21,21,-3,21,-1,21,-3,21],
    sm13=[0,22,-1,22,-1,22,22,22,22,22,22,-3,22,-1,22,-3,22],
    sm14=[0,23,-1,23,-1,23,23,23,23,23,23,-3,23,-1,23,23,-2,23],
    sm15=[0,24,-1,24,-1,24,24,24,24,24,24,-3,24,-1,24,25,-2,24],
    sm16=[0,26,-1,26,-1,26,26,26,26,26,26,-3,26,-1,26,26,-2,26],
    sm17=[0,27,-1,2,-1,3,4,5,6,7,8,-3,9,-1,27,27,-2,11],
    sm18=[0,28,-1,28,-1,28,28,28,28,28,28,-3,28,-1,28,28,-2,28],
    sm19=[0,29,-1,29,-1,29,29,29,29,29,29,-3,29,-1,29,-3,29],
    sm20=[0,30,-1,30,-1,30,30,30,30,30,30,-3,30,-1,30,30,-2,30],

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
    sm8,
    sm8,
    sm8,
    sm8,
    sm9,
    sm9,
    sm9,
    sm9,
    sm9,
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
    sm20],

    /************ Functions *************/

        max = Math.max, min = Math.min,

        //Error Functions
        e = (tk,r,o,l,p)=>{if(l.END)l.throw("Unexpected end of input");else if(l.ty & (264)) l.throw(`Unexpected space character within input "${p.slice(l)}" `) ; else l.throw(`Unexpected token ${l.tx}" `);}, 
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
    R30_string_data_list=sym=>sym[0] + sym[1],
    R31_string_data_list=sym=>sym[0] + "",
    C50_data_insert_point=function (sym){this.type = "REDUCE";this.value = sym[1];},
    R110_escaped_value=sym=>sym[1],

        //Sparse Map Lookup
        lsm = (index, map) => {    if (map[0] == 0xFFFFFFFF) return map[index + 1];    for (let i = 1, ind = 0, l = map.length, n = 0; i < l && ind <= index; i++) {        if (ind !== index) {            if ((n = map[i]) > -1) ind++;            else ind += -n;        } else return map[i];    }    return -1;},

        //State Action Functions
        state_funct = [(...v)=>(redn(2051,0,...v)),
    e=>50,
    e=>42,
    e=>70,
    e=>66,
    e=>62,
    e=>58,
    e=>46,
    e=>54,
    e=>78,
    e=>74,
    (...v)=>redn(5,1,...v),
    (...v)=>redn(2055,1,...v),
    (...v)=>redv(1031,R11_item_list,1,0,...v),
    (...v)=>redn(4103,1,...v),
    (...v)=>redv(3079,R31_string_data_list,1,0,...v),
    (...v)=>redn(9223,1,...v),
    (...v)=>redn(10247,1,...v),
    (...v)=>redn(12295,1,...v),
    (...v)=>(redn(7171,0,...v)),
    (...v)=>redv(1035,R10_item_list,2,0,...v),
    (...v)=>redv(3083,R30_string_data_list,2,0,...v),
    (...v)=>redv(11275,R110_escaped_value,2,0,...v),
    (...v)=>redv(5131,R30_string_data_list,2,0,...v),
    e=>110,
    (...v)=>redn(8199,1,...v),
    (...v)=>redn(7175,1,...v),
    (...v)=>redv(6151,R31_string_data_list,1,0,...v),
    (...v)=>rednv(5135,C50_data_insert_point,3,0,...v),
    (...v)=>redv(6155,R30_string_data_list,2,0,...v)],

        //Goto Lookup Functions
        goto = [v=>lsm(v,gt0),
    nf,
    v=>lsm(v,gt1),
    nf,
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
    nf,
    nf,
    nf,
    nf,
    nf,
    v=>lsm(v,gt5),
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
            symbols.forEach(s => { l.addSymbol(s); });
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
    };

    const A = 65;
    const a = 97;
    const ACKNOWLEDGE = 6;
    const AMPERSAND = 38;
    const ASTERISK = 42;
    const AT = 64;
    const B = 66;
    const b = 98;
    const BACKSLASH = 92;
    const BACKSPACE = 8;
    const BELL = 7;
    const C = 67;
    const c = 99;
    const CANCEL = 24;
    const CARET = 94;
    const CARRIAGE_RETURN = 13;
    const CLOSE_CURLY = 125;
    const CLOSE_PARENTH = 41;
    const CLOSE_SQUARE = 93;
    const COLON = 58;
    const COMMA = 44;
    const d = 100;
    const D = 68;
    const DATA_LINK_ESCAPE = 16;
    const DELETE = 127;
    const DEVICE_CTRL_1 = 17;
    const DEVICE_CTRL_2 = 18;
    const DEVICE_CTRL_3 = 19;
    const DEVICE_CTRL_4 = 20;
    const DOLLAR = 36;
    const DOUBLE_QUOTE = 34;
    const e$1 = 101;
    const E = 69;
    const EIGHT = 56;
    const END_OF_MEDIUM = 25;
    const END_OF_TRANSMISSION = 4;
    const END_OF_TRANSMISSION_BLOCK = 23;
    const END_OF_TXT = 3;
    const ENQUIRY = 5;
    const EQUAL = 61;
    const ESCAPE = 27;
    const EXCLAMATION = 33;
    const f = 102;
    const F = 70;
    const FILE_SEPERATOR = 28;
    const FIVE = 53;
    const FORM_FEED = 12;
    const FORWARD_SLASH = 47;
    const FOUR = 52;
    const g = 103;
    const G = 71;
    const GRAVE = 96;
    const GREATER_THAN = 62;
    const GROUP_SEPERATOR = 29;
    const h = 104;
    const H = 72;
    const HASH = 35;
    const HORIZONTAL_TAB = 9;
    const HYPHEN = 45;
    const i = 105;
    const I = 73;
    const j = 106;
    const J = 74;
    const k = 107;
    const K = 75;
    const l = 108;
    const L = 76;
    const LESS_THAN = 60;
    const LINE_FEED = 10;
    const m = 109;
    const M = 77;
    const n = 110;
    const N = 78;
    const NEGATIVE_ACKNOWLEDGE = 21;
    const NINE = 57;
    const NULL = 0;
    const o = 111;
    const O = 79;
    const ONE = 49;
    const OPEN_CURLY = 123;
    const OPEN_PARENTH = 40;
    const OPEN_SQUARE = 91;
    const p = 112;
    const P = 80;
    const PERCENT = 37;
    const PERIOD = 46;
    const PLUS = 43;
    const q = 113;
    const Q = 81;
    const QMARK = 63;
    const QUOTE = 39;
    const r = 114;
    const R = 82;
    const RECORD_SEPERATOR = 30;
    const s = 115;
    const S = 83;
    const SEMICOLON = 59;
    const SEVEN = 55;
    const SHIFT_IN = 15;
    const SHIFT_OUT = 14;
    const SIX = 54;
    const SPACE = 32;
    const START_OF_HEADER = 1;
    const START_OF_TEXT = 2;
    const SUBSTITUTE = 26;
    const SYNCH_IDLE = 22;
    const t = 116;
    const T = 84;
    const THREE = 51;
    const TILDE = 126;
    const TWO = 50;
    const u = 117;
    const U = 85;
    const UNDER_SCORE = 95;
    const UNIT_SEPERATOR = 31;
    const v = 118;
    const V = 86;
    const VERTICAL_BAR = 124;
    const VERTICAL_TAB = 11;
    const w = 119;
    const W = 87;
    const x = 120;
    const X = 88;
    const y = 121;
    const Y = 89;
    const z = 122;
    const Z = 90;
    const ZERO = 48;

    /**
     * Lexer Jump table reference 
     * 0. NUMBER
     * 1. IDENTIFIER
     * 2. QUOTE STRING
     * 3. SPACE SET
     * 4. TAB SET
     * 5. CARIAGE RETURN
     * 6. LINEFEED
     * 7. SYMBOL
     * 8. OPERATOR
     * 9. OPEN BRACKET
     * 10. CLOSE BRACKET 
     * 11. DATA_LINK
     */ 
    const jump_table = [
    7, 	 	/* NULL */
    7, 	 	/* START_OF_HEADER */
    7, 	 	/* START_OF_TEXT */
    7, 	 	/* END_OF_TXT */
    7, 	 	/* END_OF_TRANSMISSION */
    7, 	 	/* ENQUIRY */
    7, 	 	/* ACKNOWLEDGE */
    7, 	 	/* BELL */
    7, 	 	/* BACKSPACE */
    4, 	 	/* HORIZONTAL_TAB */
    6, 	 	/* LINEFEED */
    7, 	 	/* VERTICAL_TAB */
    7, 	 	/* FORM_FEED */
    5, 	 	/* CARRIAGE_RETURN */
    7, 	 	/* SHIFT_OUT */
    7, 		/* SHIFT_IN */
    11,	 	/* DATA_LINK_ESCAPE */
    7, 	 	/* DEVICE_CTRL_1 */
    7, 	 	/* DEVICE_CTRL_2 */
    7, 	 	/* DEVICE_CTRL_3 */
    7, 	 	/* DEVICE_CTRL_4 */
    7, 	 	/* NEGATIVE_ACKNOWLEDGE */
    7, 	 	/* SYNCH_IDLE */
    7, 	 	/* END_OF_TRANSMISSION_BLOCK */
    7, 	 	/* CANCEL */
    7, 	 	/* END_OF_MEDIUM */
    7, 	 	/* SUBSTITUTE */
    7, 	 	/* ESCAPE */
    7, 	 	/* FILE_SEPERATOR */
    7, 	 	/* GROUP_SEPERATOR */
    7, 	 	/* RECORD_SEPERATOR */
    7, 	 	/* UNIT_SEPERATOR */
    3, 	 	/* SPACE */
    8, 	 	/* EXCLAMATION */
    2, 	 	/* DOUBLE_QUOTE */
    7, 	 	/* HASH */
    7, 	 	/* DOLLAR */
    8, 	 	/* PERCENT */
    8, 	 	/* AMPERSAND */
    2, 	 	/* QUOTE */
    9, 	 	/* OPEN_PARENTH */
    10, 	 /* CLOSE_PARENTH */
    8, 	 	/* ASTERISK */
    8, 	 	/* PLUS */
    7, 	 	/* COMMA */
    7, 	 	/* HYPHEN */
    7, 	 	/* PERIOD */
    7, 	 	/* FORWARD_SLASH */
    0, 	 	/* ZERO */
    0, 	 	/* ONE */
    0, 	 	/* TWO */
    0, 	 	/* THREE */
    0, 	 	/* FOUR */
    0, 	 	/* FIVE */
    0, 	 	/* SIX */
    0, 	 	/* SEVEN */
    0, 	 	/* EIGHT */
    0, 	 	/* NINE */
    8, 	 	/* COLON */
    7, 	 	/* SEMICOLON */
    8, 	 	/* LESS_THAN */
    8, 	 	/* EQUAL */
    8, 	 	/* GREATER_THAN */
    7, 	 	/* QMARK */
    7, 	 	/* AT */
    1, 	 	/* A*/
    1, 	 	/* B */
    1, 	 	/* C */
    1, 	 	/* D */
    1, 	 	/* E */
    1, 	 	/* F */
    1, 	 	/* G */
    1, 	 	/* H */
    1, 	 	/* I */
    1, 	 	/* J */
    1, 	 	/* K */
    1, 	 	/* L */
    1, 	 	/* M */
    1, 	 	/* N */
    1, 	 	/* O */
    1, 	 	/* P */
    1, 	 	/* Q */
    1, 	 	/* R */
    1, 	 	/* S */
    1, 	 	/* T */
    1, 	 	/* U */
    1, 	 	/* V */
    1, 	 	/* W */
    1, 	 	/* X */
    1, 	 	/* Y */
    1, 	 	/* Z */
    9, 	 	/* OPEN_SQUARE */
    7, 	 	/* TILDE */
    10, 	/* CLOSE_SQUARE */
    7, 	 	/* CARET */
    7, 	 	/* UNDER_SCORE */
    2, 	 	/* GRAVE */
    1, 	 	/* a */
    1, 	 	/* b */
    1, 	 	/* c */
    1, 	 	/* d */
    1, 	 	/* e */
    1, 	 	/* f */
    1, 	 	/* g */
    1, 	 	/* h */
    1, 	 	/* i */
    1, 	 	/* j */
    1, 	 	/* k */
    1, 	 	/* l */
    1, 	 	/* m */
    1, 	 	/* n */
    1, 	 	/* o */
    1, 	 	/* p */
    1, 	 	/* q */
    1, 	 	/* r */
    1, 	 	/* s */
    1, 	 	/* t */
    1, 	 	/* u */
    1, 	 	/* v */
    1, 	 	/* w */
    1, 	 	/* x */
    1, 	 	/* y */
    1, 	 	/* z */
    9, 	 	/* OPEN_CURLY */
    7, 	 	/* VERTICAL_BAR */
    10,  	/* CLOSE_CURLY */
    7,  	/* TILDE */
    7 		/* DELETE */
    ];	

    /**
     * LExer Number and Identifier jump table reference
     * Number are masked by 12(4|8) and Identifiers are masked by 10(2|8)
     * entries marked as `0` are not evaluated as either being in the number set or the identifier set.
     * entries marked as `2` are in the identifier set but not the number set
     * entries marked as `4` are in the number set but not the identifier set
     * entries marked as `8` are in both number and identifier sets
     */
    const number_and_identifier_table = [
    0, 		/* NULL */
    0, 		/* START_OF_HEADER */
    0, 		/* START_OF_TEXT */
    0, 		/* END_OF_TXT */
    0, 		/* END_OF_TRANSMISSION */
    0, 		/* ENQUIRY */
    0,		/* ACKNOWLEDGE */
    0,		/* BELL */
    0,		/* BACKSPACE */
    0,		/* HORIZONTAL_TAB */
    0,		/* LINEFEED */
    0,		/* VERTICAL_TAB */
    0,		/* FORM_FEED */
    0,		/* CARRIAGE_RETURN */
    0,		/* SHIFT_OUT */
    0,		/* SHIFT_IN */
    0,		/* DATA_LINK_ESCAPE */
    0,		/* DEVICE_CTRL_1 */
    0,		/* DEVICE_CTRL_2 */
    0,		/* DEVICE_CTRL_3 */
    0,		/* DEVICE_CTRL_4 */
    0,		/* NEGATIVE_ACKNOWLEDGE */
    0,		/* SYNCH_IDLE */
    0,		/* END_OF_TRANSMISSION_BLOCK */
    0,		/* CANCEL */
    0,		/* END_OF_MEDIUM */
    0,		/* SUBSTITUTE */
    0,		/* ESCAPE */
    0,		/* FILE_SEPERATOR */
    0,		/* GROUP_SEPERATOR */
    0,		/* RECORD_SEPERATOR */
    0,		/* UNIT_SEPERATOR */
    0,		/* SPACE */
    0,		/* EXCLAMATION */
    0,		/* DOUBLE_QUOTE */
    0,		/* HASH */
    0,		/* DOLLAR */
    0,		/* PERCENT */
    0,		/* AMPERSAND */
    0,		/* QUOTE */
    0,		/* OPEN_PARENTH */
    0,		 /* CLOSE_PARENTH */
    0,		/* ASTERISK */
    0,		/* PLUS */
    0,		/* COMMA */
    0,		/* HYPHEN */
    4,		/* PERIOD */
    0,		/* FORWARD_SLASH */
    8,		/* ZERO */
    8,		/* ONE */
    8,		/* TWO */
    8,		/* THREE */
    8,		/* FOUR */
    8,		/* FIVE */
    8,		/* SIX */
    8,		/* SEVEN */
    8,		/* EIGHT */
    8,		/* NINE */
    0,		/* COLON */
    0,		/* SEMICOLON */
    0,		/* LESS_THAN */
    0,		/* EQUAL */
    0,		/* GREATER_THAN */
    0,		/* QMARK */
    0,		/* AT */
    2,		/* A*/
    8,		/* B */
    2,		/* C */
    2,		/* D */
    8,		/* E */
    2,		/* F */
    2,		/* G */
    2,		/* H */
    2,		/* I */
    2,		/* J */
    2,		/* K */
    2,		/* L */
    2,		/* M */
    2,		/* N */
    8,		/* O */
    2,		/* P */
    2,		/* Q */
    2,		/* R */
    2,		/* S */
    2,		/* T */
    2,		/* U */
    2,		/* V */
    2,		/* W */
    8,		/* X */
    2,		/* Y */
    2,		/* Z */
    0,		/* OPEN_SQUARE */
    0,		/* TILDE */
    0,		/* CLOSE_SQUARE */
    0,		/* CARET */
    0,		/* UNDER_SCORE */
    0,		/* GRAVE */
    2,		/* a */
    8,		/* b */
    2,		/* c */
    2,		/* d */
    2,		/* e */
    2,		/* f */
    2,		/* g */
    2,		/* h */
    2,		/* i */
    2,		/* j */
    2,		/* k */
    2,		/* l */
    2,		/* m */
    2,		/* n */
    8,		/* o */
    2,		/* p */
    2,		/* q */
    2,		/* r */
    2,		/* s */
    2,		/* t */
    2,		/* u */
    2,		/* v */
    2,		/* w */
    8,		/* x */
    2,		/* y */
    2,		/* z */
    0,		/* OPEN_CURLY */
    0,		/* VERTICAL_BAR */
    0,		/* CLOSE_CURLY */
    0,		/* TILDE */
    0		/* DELETE */
    ];

    const extended_number_and_identifier_table = number_and_identifier_table.slice();
    extended_number_and_identifier_table[45] = 2;
    extended_number_and_identifier_table[95] = 2;

    const
        number = 1,
        identifier = 2,
        string = 4,
        white_space = 8,
        open_bracket = 16,
        close_bracket = 32,
        operator = 64,
        symbol = 128,
        new_line = 256,
        data_link = 512,
        alpha_numeric = (identifier | number),
        white_space_new_line = (white_space | new_line),
        Types = {
            num: number,
            number,
            id: identifier,
            identifier,
            str: string,
            string,
            ws: white_space,
            white_space,
            ob: open_bracket,
            open_bracket,
            cb: close_bracket,
            close_bracket,
            op: operator,
            operator,
            sym: symbol,
            symbol,
            nl: new_line,
            new_line,
            dl: data_link,
            data_link,
            alpha_numeric,
            white_space_new_line,
        },

        /*** MASKS ***/

        TYPE_MASK = 0xF,
        PARSE_STRING_MASK = 0x10,
        IGNORE_WHITESPACE_MASK = 0x20,
        CHARACTERS_ONLY_MASK = 0x40,
        TOKEN_LENGTH_MASK = 0xFFFFFF80,

        //De Bruijn Sequence for finding index of right most bit set.
        //http://supertech.csail.mit.edu/papers/debruijn.pdf
        debruijnLUT = [
            0, 1, 28, 2, 29, 14, 24, 3, 30, 22, 20, 15, 25, 17, 4, 8,
            31, 27, 13, 23, 21, 19, 16, 7, 26, 12, 18, 6, 11, 5, 10, 9
        ];

    const getNumbrOfTrailingZeroBitsFromPowerOf2 = (value) => debruijnLUT[(value * 0x077CB531) >>> 27];

    class Lexer {

        constructor(string = "", INCLUDE_WHITE_SPACE_TOKENS = false, PEEKING = false) {

            if (typeof(string) !== "string") throw new Error(`String value must be passed to Lexer. A ${typeof(string)} was passed as the \`string\` argument.`);

            /**
             * The string that the Lexer tokenizes.
             */
            this.str = string;

            /**
             * Reference to the peeking Lexer.
             */
            this.p = null;

            /**
             * The type id of the current token.
             */
            this.type = 32768; //Default "non-value" for types is 1<<15;

            /**
             * The offset in the string of the start of the current token.
             */
            this.off = 0;

            this.masked_values = 0;

            /**
             * The character offset of the current token within a line.
             */
            this.char = 0;
            /**
             * The line position of the current token.
             */
            this.line = 0;
            /**
             * The length of the string being parsed
             */
            this.sl = string.length;
            /**
             * The length of the current token.
             */
            this.tl = 0;

            /**
             * Flag to ignore white spaced.
             */
            this.IWS = !INCLUDE_WHITE_SPACE_TOKENS;

            this.USE_EXTENDED_ID = false;

            /**
             * Flag to force the lexer to parse string contents
             */
            this.PARSE_STRING = false;

            this.id_lu = number_and_identifier_table;

            if (!PEEKING) this.next();
        }

        useExtendedId(){
            this.id_lu = extended_number_and_identifier_table;
            this.tl = 0;
            this.next();
            return this;
        }

        /**
         * Restricts max parse distance to the other Lexer's current position.
         * @param      {Lexer}  Lexer   The Lexer to limit parse distance by.
         */
        fence(marker = this) {
            if (marker.str !== this.str)
                return;
            this.sl = marker.off;
            return this;
        }

        /**
         * Copies the Lexer.
         * @return     {Lexer}  Returns a new Lexer instance with the same property values.
         */
        copy(destination = new Lexer(this.str, false, true)) {
            destination.off = this.off;
            destination.char = this.char;
            destination.line = this.line;
            destination.sl = this.sl;
            destination.masked_values = this.masked_values;
            destination.id_lu = this.id_lu;
            return destination;
        }

        /**
         * Given another Lexer with the same `str` property value, it will copy the state of that Lexer.
         * @param      {Lexer}  [marker=this.peek]  The Lexer to clone the state from. 
         * @throws     {Error} Throws an error if the Lexers reference different strings.
         * @public
         */
        sync(marker = this.p) {

            if (marker instanceof Lexer) {
                if (marker.str !== this.str) throw new Error("Cannot sync Lexers with different strings!");
                this.off = marker.off;
                this.char = marker.char;
                this.line = marker.line;
                this.masked_values = marker.masked_values;
            }

            return this;
        }

        /**
        Creates an error message with a diagram illustrating the location of the error. 
        */
        errorMessage(message = "") {
            const pk = this.copy();

            pk.IWS = false;

            while (!pk.END && pk.ty !== Types.nl) { pk.next(); }

            const end = (pk.END) ? this.str.length : pk.off,

                nls = (this.line > 0) ? 1 : 0,
                number_of_tabs = this.str
                    .slice(this.off - this.char + nls + nls, this.off + nls)
                    .split("")
                    .reduce((r, v) => (r + ((v.charCodeAt(0) == HORIZONTAL_TAB) | 0)), 0),

                arrow = String.fromCharCode(0x2b89),

                line = String.fromCharCode(0x2500),

                thick_line = String.fromCharCode(0x2501),

                line_number = `    ${this.line+1}: `,

                line_fill = line_number.length + number_of_tabs,

                line_text = this.str.slice(this.off - this.char + nls + (nls), end).replace(/\t/g, "  "),

                error_border = thick_line.repeat(line_text.length + line_number.length + 2),

                is_iws = (!this.IWS) ? "\n The Lexer produced whitespace tokens" : "",

                msg =[ `${message} at ${this.line+1}:${this.char - nls}` ,
                `${error_border}` ,
                `${line_number+line_text}` ,
                `${line.repeat(this.char-nls+line_fill-(nls))+arrow}` ,
                `${error_border}` ,
                `${is_iws}`].join("\n");

            return msg;
        }

        /**
         * Will throw a new Error, appending the parsed string line and position information to the the error message passed into the function.
         * @instance
         * @public
         * @param {String} message - The error message.
         * @param {Bool} DEFER - if true, returns an Error object instead of throwing.
         */
        throw (message, DEFER = false) {
            const error = new Error(this.errorMessage(message));
            if (DEFER)
                return error;
            throw error;
        }

        /**
         * Proxy for Lexer.prototype.reset
         * @public
         */
        r() { return this.reset() }

        /**
         * Restore the Lexer back to it's initial state.
         * @public
         */
        reset() {
            this.p = null;
            this.type = 32768;
            this.off = 0;
            this.tl = 0;
            this.char = 0;
            this.line = 0;
            this.n;
            return this;
        }

        resetHead() {
            this.off = 0;
            this.tl = 0;
            this.char = 0;
            this.line = 0;
            this.p = null;
            this.type = 32768;
        }

        /**
         * Sets the internal state to point to the next token. Sets Lexer.prototype.END to `true` if the end of the string is hit.
         * @public
         * @param {Lexer} [marker=this] - If another Lexer is passed into this method, it will advance the token state of that Lexer.
         */
        next(marker = this, USE_CUSTOM_SYMBOLS = !!this.symbol_map) {

            if (marker.sl < 1) {
                marker.off = 0;
                marker.type = 32768;
                marker.tl = 0;
                marker.line = 0;
                marker.char = 0;
                return marker;
            }

            //Token builder
            const l = marker.sl,
                str = marker.str,
                number_and_identifier_table = this.id_lu,
                IWS = marker.IWS;

            let length = marker.tl,
                off = marker.off + length,
                type = symbol,
                line = marker.line,
                base = off,
                char = marker.char,
                root = marker.off;

            if (off >= l) {
                length = 0;
                base = l;
                //char -= base - off;
                marker.char = char + (base - marker.off);
                marker.type = type;
                marker.off = base;
                marker.tl = 0;
                marker.line = line;
                return marker;
            }

            let NORMAL_PARSE = true;

            if (USE_CUSTOM_SYMBOLS) {

                let code = str.charCodeAt(off);
                let off2 = off;
                let map = this.symbol_map,
                    m;
                let i = 0;

                while (code == 32 && IWS)
                    (code = str.charCodeAt(++off2), off++);

                while ((m = map.get(code))) {
                    map = m;
                    off2 += 1;
                    code = str.charCodeAt(off2);
                }

                if (map.IS_SYM) {
                    NORMAL_PARSE = false;
                    base = off;
                    length = off2 - off;
                    //char += length;
                }
            }

            if (NORMAL_PARSE) {

                for (;;) {

                    base = off;

                    length = 1;

                    const code = str.charCodeAt(off);

                    if (code < 128) {

                        switch (jump_table[code]) {
                            case 0: //NUMBER
                                while (++off < l && (12 & number_and_identifier_table[str.charCodeAt(off)]));

                                if ((str[off] == "e" || str[off] == "E") && (12 & number_and_identifier_table[str.charCodeAt(off + 1)])) {
                                    off++;
                                    if (str[off] == "-") off++;
                                    marker.off = off;
                                    marker.tl = 0;
                                    marker.next();
                                    off = marker.off + marker.tl;
                                    //Add e to the number string
                                }

                                type = number;
                                length = off - base;

                                break;
                            case 1: //IDENTIFIER
                                while (++off < l && ((10 & number_and_identifier_table[str.charCodeAt(off)])));
                                type = identifier;
                                length = off - base;
                                break;
                            case 2: //QUOTED STRING
                                if (this.PARSE_STRING) {
                                    type = symbol;
                                } else {
                                    while (++off < l && str.charCodeAt(off) !== code);
                                    type = string;
                                    length = off - base + 1;
                                }
                                break;
                            case 3: //SPACE SET
                                while (++off < l && str.charCodeAt(off) === SPACE);
                                type = white_space;
                                length = off - base;
                                break;
                            case 4: //TAB SET
                                while (++off < l && str[off] === HORIZONTAL_TAB);
                                type = white_space;
                                length = off - base;
                                break;
                            case 5: //CARIAGE RETURN
                                length = 2;
                                //intentional
                            case 6: //LINEFEED
                                type = new_line;
                                line++;
                                base = off;
                                root = off;
                                off += length;
                                char = 0;
                                break;
                            case 7: //SYMBOL
                                type = symbol;
                                break;
                            case 8: //OPERATOR
                                type = operator;
                                break;
                            case 9: //OPEN BRACKET
                                type = open_bracket;
                                break;
                            case 10: //CLOSE BRACKET
                                type = close_bracket;
                                break;
                            case 11: //Data Link Escape
                                type = data_link;
                                length = 4; //Stores two UTF16 values and a data link sentinel
                                break;
                        }
                    } else {
                        break;
                    }

                    if (IWS && (type & white_space_new_line)) {
                        if (off < l) {
                            type = symbol;
                            //off += length;
                            continue;
                        } else {
                            //Trim white space from end of string
                            //base = l - off;
                            //marker.sl -= off;
                            //length = 0;
                        }
                    }
                    break;
                }
            }

            marker.type = type;
            marker.off = base;
            marker.tl = (this.masked_values & CHARACTERS_ONLY_MASK) ? Math.min(1, length) : length;
            marker.char = char + base - root;
            marker.line = line;

            return marker;
        }


        /**
         * Proxy for Lexer.prototype.assert
         * @public
         */
        a(text) {
            return this.assert(text);
        }

        /**
         * Compares the string value of the current token to the value passed in. Advances to next token if the two are equal.
         * @public
         * @throws {Error} - `Expecting "${text}" got "${this.text}"`
         * @param {String} text - The string to compare.
         */
        assert(text) {

            if (this.off < 0) this.throw(`Expecting ${text} got null`);

            if (this.text == text)
                this.next();
            else
                this.throw(`Expecting "${text}" got "${this.text}"`);

            return this;
        }

        /**
         * Proxy for Lexer.prototype.assertCharacter
         * @public
         */
        aC(char) { return this.assertCharacter(char) }
        /**
         * Compares the character value of the current token to the value passed in. Advances to next token if the two are equal.
         * @public
         * @throws {Error} - `Expecting "${text}" got "${this.text}"`
         * @param {String} text - The string to compare.
         */
        assertCharacter(char) {

            if (this.off < 0) this.throw(`Expecting ${char[0]} got null`);

            if (this.ch == char[0])
                this.next();
            else
                this.throw(`Expecting "${char[0]}" got "${this.tx[this.off]}"`);

            return this;
        }

        /**
         * Returns the Lexer bound to Lexer.prototype.p, or creates and binds a new Lexer to Lexer.prototype.p. Advences the other Lexer to the token ahead of the calling Lexer.
         * @public
         * @type {Lexer}
         * @param {Lexer} [marker=this] - The marker to originate the peek from. 
         * @param {Lexer} [peek_marker=this.p] - The Lexer to set to the next token state.
         * @return {Lexer} - The Lexer that contains the peeked at token.
         */
        peek(marker = this, peek_marker = this.p) {

            if (!peek_marker) {
                if (!marker) return null;
                if (!this.p) {
                    this.p = new Lexer(this.str, false, true);
                    peek_marker = this.p;
                }
            }
            peek_marker.masked_values = marker.masked_values;
            peek_marker.type = marker.type;
            peek_marker.off = marker.off;
            peek_marker.tl = marker.tl;
            peek_marker.char = marker.char;
            peek_marker.line = marker.line;
            this.next(peek_marker);
            return peek_marker;
        }


        /**
         * Proxy for Lexer.prototype.slice
         * @public
         */
        s(start) { return this.slice(start) }

        /**
         * Returns a slice of the parsed string beginning at `start` and ending at the current token.
         * @param {Number | LexerBeta} start - The offset in this.str to begin the slice. If this value is a LexerBeta, sets the start point to the value of start.off.
         * @return {String} A substring of the parsed string.
         * @public
         */
        slice(start = this.off) {

            if (start instanceof Lexer) start = start.off;

            return this.str.slice(start, (this.off <= start) ? this.sl : this.off);
        }

        /**
         * Skips to the end of a comment section.
         * @param {boolean} ASSERT - If set to true, will through an error if there is not a comment line or block to skip.
         * @param {Lexer} [marker=this] - If another Lexer is passed into this method, it will advance the token state of that Lexer.
         */
        comment(ASSERT = false, marker = this) {

            if (!(marker instanceof Lexer)) return marker;

            if (marker.ch == "/") {
                if (marker.pk.ch == "*") {
                    marker.sync();
                    while (!marker.END && (marker.next().ch != "*" || marker.pk.ch != "/")) { /* NO OP */ }
                    marker.sync().assert("/");
                } else if (marker.pk.ch == "/") {
                    const IWS = marker.IWS;
                    while (marker.next().ty != Types.new_line && !marker.END) { /* NO OP */ }
                    marker.IWS = IWS;
                    marker.next();
                } else
                if (ASSERT) marker.throw("Expecting the start of a comment");
            }

            return marker;
        }

        setString(string, RESET = true) {
            this.str = string;
            this.sl = string.length;
            if (RESET) this.resetHead();
        }

        toString() {
            return this.slice();
        }

        /**
         * Returns new Whind Lexer that has leading and trailing whitespace characters removed from input. 
         * leave_leading_amount - Maximum amount of leading space caracters to leave behind. Default is zero
         * leave_trailing_amount - Maximum amount of trailing space caracters to leave behind. Default is zero
         */
        trim(leave_leading_amount = 0, leave_trailing_amount = leave_leading_amount) {
            const lex = this.copy();

            let space_count = 0,
                off = lex.off;

            for (; lex.off < lex.sl; lex.off++) {
                const c = jump_table[lex.string.charCodeAt(lex.off)];

                if (c > 2 && c < 7) {

                    if (space_count >= leave_leading_amount) {
                        off++;
                    } else {
                        space_count++;
                    }
                    continue;
                }

                break;
            }

            lex.off = off;
            space_count = 0;
            off = lex.sl;

            for (; lex.sl > lex.off; lex.sl--) {
                const c = jump_table[lex.string.charCodeAt(lex.sl - 1)];

                if (c > 2 && c < 7) {
                    if (space_count >= leave_trailing_amount) {
                        off--;
                    } else {
                        space_count++;
                    }
                    continue;
                }

                break;
            }

            lex.sl = off;

            if (leave_leading_amount > 0)
                lex.IWS = false;

            lex.token_length = 0;

            lex.next();

            return lex;
        }

        /** Adds symbol to symbol_map. This allows custom symbols to be defined and tokenized by parser. **/
        addSymbol(sym) {
            if (!this.symbol_map)
                this.symbol_map = new Map;


            let map = this.symbol_map;

            for (let i = 0; i < sym.length; i++) {
                let code = sym.charCodeAt(i);
                let m = map.get(code);
                if (!m) {
                    m = map.set(code, new Map).get(code);
                }
                map = m;
            }
            map.IS_SYM = true;
        }

        /*** Getters and Setters ***/
        get string() {
            return this.str;
        }

        get string_length() {
            return this.sl - this.off;
        }

        set string_length(s) {}

        /**
         * The current token in the form of a new Lexer with the current state.
         * Proxy property for Lexer.prototype.copy
         * @type {Lexer}
         * @public
         * @readonly
         */
        get token() {
            return this.copy();
        }


        get ch() {
            return this.str[this.off];
        }

        /**
         * Proxy for Lexer.prototype.text
         * @public
         * @type {String}
         * @readonly
         */
        get tx() { return this.text }

        /**
         * The string value of the current token.
         * @type {String}
         * @public
         * @readonly
         */
        get text() {
            return (this.off < 0) ? "" : this.str.slice(this.off, this.off + this.tl);
        }

        /**
         * The type id of the current token.
         * @type {Number}
         * @public
         * @readonly
         */
        get ty() { return this.type }

        /**
         * The current token's offset position from the start of the string.
         * @type {Number}
         * @public
         * @readonly
         */
        get pos() {
            return this.off;
        }

        /**
         * Proxy for Lexer.prototype.peek
         * @public
         * @readonly
         * @type {Lexer}
         */
        get pk() { return this.peek() }

        /**
         * Proxy for Lexer.prototype.next
         * @public
         */
        get n() { return this.next() }

        get END() { return this.off >= this.sl }
        set END(v) {}

        get type() {
            return 1 << (this.masked_values & TYPE_MASK);
        }

        set type(value) {
            //assuming power of 2 value.
            this.masked_values = (this.masked_values & ~TYPE_MASK) | ((getNumbrOfTrailingZeroBitsFromPowerOf2(value)) & TYPE_MASK);
        }

        get tl() {
            return this.token_length;
        }

        set tl(value) {
            this.token_length = value;
        }

        get token_length() {
            return ((this.masked_values & TOKEN_LENGTH_MASK) >> 7);
        }

        set token_length(value) {
            this.masked_values = (this.masked_values & ~TOKEN_LENGTH_MASK) | (((value << 7) | 0) & TOKEN_LENGTH_MASK);
        }

        get IGNORE_WHITE_SPACE() {
            return this.IWS;
        }

        set IGNORE_WHITE_SPACE(bool) {
            this.iws = !!bool;
        }

        get CHARACTERS_ONLY() {
            return !!(this.masked_values & CHARACTERS_ONLY_MASK);
        }

        set CHARACTERS_ONLY(boolean) {
            this.masked_values = (this.masked_values & ~CHARACTERS_ONLY_MASK) | ((boolean | 0) << 6);
        }

        get IWS() {
            return !!(this.masked_values & IGNORE_WHITESPACE_MASK);
        }

        set IWS(boolean) {
            this.masked_values = (this.masked_values & ~IGNORE_WHITESPACE_MASK) | ((boolean | 0) << 5);
        }

        get PARSE_STRING() {
            return !!(this.masked_values & PARSE_STRING_MASK);
        }

        set PARSE_STRING(boolean) {
            this.masked_values = (this.masked_values & ~PARSE_STRING_MASK) | ((boolean | 0) << 4);
        }

        /**
         * Reference to token id types.
         */
        get types() {
            return Types;
        }
    }

    Lexer.prototype.addCharacter = Lexer.prototype.addSymbol;

    function whind(string, INCLUDE_WHITE_SPACE_TOKENS = false) { return new Lexer(string, INCLUDE_WHITE_SPACE_TOKENS) }

    whind.constructor = Lexer;

    Lexer.types = Types;
    whind.types = Types;

    function Note(graze, uid, id, tags, body, refs, created, modified) {

        let note = {
            uid,
            id,
            tags,
            body,
            refs,
            created,
            modified
        };

        const store = async () => (await graze.store(note)) > 0;

        return {
            get created() { return note.created },
            get modified() { return note.modified },
            get __graze_retrieve_note__() { return note },
            get uid() { return uid },
            get id() { return note.id },
            get body() { return note.body },
            set body(str) { note.body = str; },
            get tags() { return note.tags },
            //set tags(str) { note.tags = str },
            get meta() { return note.tags },
            //set meta(str) { note.tags = str },
            // saves the note's data to the backing server. returns true if the save was successfull, or returns false.
            save: store,
            store,
            // render the note's message data into a string output
            render: async function(handler, set = new Set) {

                if (!set.has(this.uid.string))
                    set.add(this.uid.string);

                var strings = [];

                for (const value of parser(whind(note.body))) {
                    if (typeof value == "string")
                        strings.push(value);
                    else {
                        for (const note of await graze.retrieve(value.value)) {
                            
                            if (set.has(note.uid.string))
                                continue;

                            if (note)
                                strings.push(await note.render(handler, new Set(set)));
                        }
                    }
                }

                return strings.join("");
            }
        }
    }

    class NoteContainer extends Array {
        push() {}
        shift() {}
        unshift() {}
        pop() {}
        sort(sorter) {
            
            if (typeof sorter == "function") 
                return new NoteContainer(...([...this]).sort(sorter));
            
            throw new TypeError("The comparison function must be either a function or a sort_index")
        }
    }

    NoteContainer.sort_indexes = Object.freeze({
        create_time: (m1,m2)=>{ m1.created < m2.created ? -1 : 1; },
        modify_time: (m1,m2)=>{ m1.modified < m2.modified ? -1 : 1; },
        id: (m1,m2)=>{ m1.id < m2.id ? -1 : 1; },
        tags: (m1,m2)=>{ m1.tags < m2.tags ? -1 : 1; },
        body: (m1,m2)=>{ m1.body < m2.body ? -1 : 1; }
    });

    class Graze {

        constructor() {
            //Private
            this.server = null;
            this.save = this.store;
        }

        get sort_indexes() { return NoteContainer.sort_indexes; }

        createUID() { return new UID }

        async store(...vals) {
            var RESULT = 0,
                note;

            for (const candidate of vals) {

                if (!(note = candidate.__graze_retrieve_note__))
                    note = candidate;

                RESULT += (await this.server.storeNote(note)) | 0;
            }

            return RESULT;
        }

        async retrieve(
            query // Query string
        ) {
            const results = await this.server.query(query);

            return (results) ?
                new NoteContainer(...results
                    .map(
                        note_data =>
                        Note(
                            this,
                            new UID(note_data.uid),
                            note_data.id,
                            note_data.tags,
                            note_data.body,
                            note_data.refs || [],
                            note_data.created,
                            note_data.modified
                        )
                    )
                ) : null;
        }

        createNote(
            note_id, // string : String identifier of note. Refere to notes on using container addressing. Required
            note_tags = "", // string | array : Array of string ids or Comma seperated list of ids in a string.
            body = "", // string : String identifier of note. Refere to notes on using container addressing
            uid = this.createUID() // string : String identifier of note. Refere to notes on using container addressing
        ) {
            //Verify arguments.

            if (typeof note_id !== "string")
                throw new Error("note_id argument must be a string value");

            if (typeof note_tags == "string") {
                if (note_tags)
                    note_tags = note_tags.split(",");
                else
                    note_tags = [];
            } else if (!Array.isArray(note_tags) || note_tags.reduce((r, v) => (typeof v !== "string" && typeof v !== "number") || r, false)) {
                throw new Error(`graze.createNote: [note_tags] argument must be a string of comma separated values or an array of [strings | numbers]. Got ${note_tags.map(e=>typeof e)}`);
            }

            if (typeof body !== "string")
                throw new Error("body argument must be a string value");

            if (!(uid instanceof UID))
                throw new Error("uid argument must be a UID instance");

            const creation_date = Date.now() | 0;

            return Note(
                this,
                uid,
                note_id,
                note_tags,
                body,
                [],
                creation_date,
                creation_date
            )
        }

        /* Connects the Graze instance to a server */
        connect(server) {

            //Check for appropiate server methods

            const ACCEPTABLE =
                typeof server.storeNote == "function" &&
                typeof server.removeNote == "function" &&
                typeof server.implode == "function" &&
                typeof server.query == "function";

            if (!ACCEPTABLE)
                throw new Error("Server object is not suitable.")

            this.server = server;
        }

        /* Disconnects from the connected server */
        disconnect() {

            if (!this.server)
                return false;

            this.server = null;

            return true;
        }
    }

    let fn$1 = {}; const 
    /************** Maps **************/

        /* Symbols To Inject into the Lexer */
        symbols$1 = ["&&","||"],

        /* Goto lookup maps */
        gt0$1 = [0,-1,1,2,7,3,9,20,4,-5,26,-1,5,-24,10,8,11,-2,13,12,-2,15],
    gt1$1 = [0,-6,20,32,-5,26,-1,33],
    gt2$1 = [0,-13,26,-1,34],
    gt3$1 = [0,-3,35,-1,9,-34,10,36,11,-2,13,12,-2,15],
    gt4$1 = [0,-5,38,-34,10,37,11,-2,13,12,-2,15],
    gt5$1 = [0,-42,40,-2,13,12,-2,15],
    gt6 = [0,-44,41,-2,42,44,43],
    gt7 = [0,-9,47,48,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt8 = [0,-14,79,-1,80,65,61,68,62,71,63,64],
    gt9 = [0,-13,26,-1,85],
    gt10 = [0,-5,38,-34,10,86,11,-2,13,12,-2,15],
    gt11 = [0,-47,87,44,43],
    gt12 = [0,-49,88],
    gt13 = [0,-12,97,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt14 = [0,-12,98,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt15 = [0,-12,99,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt16 = [0,-12,100,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt17 = [0,-8,101,102,48,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt18 = [0,-45,103,-3,15],
    gt19 = [0,-45,104,-3,15],
    gt20 = [0,-24,107,108,109,105,120,-2,111,122,-3,112,125,126,106],
    gt21 = [0,-24,107,108,109,137,120,-2,111,122,-3,112,125,126,138],
    gt22 = [0,-24,107,108,109,139,120,-2,111,122,-3,112],
    gt23 = [0,-40,10,142,11,-2,13,12,-2,15],
    gt24 = [0,-9,144,48,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt25 = [0,-9,145,48,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt26 = [0,-9,146,48,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt27 = [0,-9,147,48,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt28 = [0,-10,148,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt29 = [0,-10,149,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt30 = [0,-10,150,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt31 = [0,-10,151,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt32 = [0,-37,125,126,155],
    gt33 = [0,-40,10,159,11,-2,13,12,-2,15],
    gt34 = [0,-28,120,-2,162,122,-3,163],
    gt35 = [0,-33,168,-11,169,-3,15],
    gt36 = [0,-37,125,126,171],
    gt37 = [0,-37,125,126,172],
    gt38 = [0,-24,107,108,109,173,120,-2,111,122,-3,112,125,126,174],
    gt39 = [0,-16,175,65,61,68,62,71,63,64],
    gt40 = [0,-29,179,178],
    gt41 = [0,-34,186,185],
    gt42 = [0,-37,125,126,191],
    gt43 = [0,-33,193,-11,169,-3,15],

        // State action lookup maps
        sm0$1=[0,1,-1,2,-1,0,-2,3,4,0,-3,5,-1,6,7,-1,8,9,10,11,-14,12,13,14,15,16,-39,17],
    sm1$1=[0,18,-3,0,-4,0],
    sm2$1=[0,19,-3,0,-4,0],
    sm3$1=[0,20,-3,0,-4,0,-6,7,-1,8,9,10,11,-14,12,13,14,15,16],
    sm4$1=[0,21,-3,0,-4,0,-26,12,13,14,15,16],
    sm5$1=[0,22,-3,0,-4,0],
    sm6$1=[0,23,-1,2,-1,0,-2,3,4,0,-3,5,-2,23,-1,23,23,23,23,-14,23,23,23,23,23,-39,17],
    sm7$1=[0,24,-1,2,-1,0,-2,3,4,0,-3,5,-2,24,-1,24,24,24,24,-14,24,24,24,24,24,-39,17],
    sm8$1=[0,25,-3,0,-4,0,-5,26,25,-1,25,25,25,25,-14,25,25,25,25,25],
    sm9$1=[0,27,-1,27,-1,0,-2,27,27,0,-3,27,-2,27,-1,27,27,27,27,-14,27,27,27,27,27,-39,27],
    sm10$1=[0,28,-1,2,-1,0,-2,3,4,0,-3,5,-1,28,28,-1,28,28,28,28,28,28,28,28,28,28,28,28,-5,28,28,28,28,28,28,28,-7,28,28,28,28,28,-1,28,-1,28,28,-1,28,-5,28,28,28,28,28,28,28,28,28,28,28,28,-2,17],
    sm11$1=[0,29,-1,29,-1,0,-2,29,29,0,-3,29,-1,29,29,-1,29,29,29,29,29,29,29,29,29,29,29,29,-5,29,29,29,29,29,29,29,-7,29,29,29,29,29,-1,29,-1,29,29,-1,29,-5,29,29,29,29,29,29,29,29,29,29,29,29,-2,29],
    sm12$1=[0,30,-1,30,-1,0,-2,30,30,0,-3,30,-1,30,30,-1,30,30,30,30,30,30,30,30,30,30,30,30,-5,30,30,30,30,30,30,30,-7,30,30,30,30,30,-1,30,-1,30,30,-1,30,-5,30,30,30,30,30,30,30,30,30,30,30,30,-2,30],
    sm13$1=[0,31,-1,31,-1,0,-2,31,31,0,-3,31,-1,31,31,-1,31,31,31,31,31,31,31,31,31,31,31,31,-5,31,31,31,31,31,31,31,-7,31,31,31,31,31,-1,31,-1,31,31,-1,31,-5,31,31,31,31,31,31,31,31,31,31,31,31,-2,31],
    sm14$1=[0,32,-1,2,-1,33,-2,3,4,0,-3,5,-1,32,32,-1,32,32,32,32,32,32,32,32,32,32,32,32,-5,32,32,32,32,32,32,32,-7,32,32,32,32,32,-1,32,-1,32,32,-1,32,32,32,32,32,-1,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,-1,34],
    sm15$1=[0,35,-1,35,-1,35,-2,35,35,0,-3,35,-1,35,35,-1,35,35,35,35,35,35,35,35,35,35,35,35,-5,35,35,35,35,35,35,35,-7,35,35,35,35,35,-1,35,-1,35,35,-1,35,35,35,35,35,-1,35,35,35,35,35,35,35,35,35,35,35,35,35,35,35,-1,35],
    sm16$1=[0,36,-1,2,-1,0,-2,3,4,0,-3,5,-16,37,38,39,40,41,-1,36,36,36,36,36,-1,42,43,44,45,46,47,48,-29,49,50,17],
    sm17$1=[0,51,-1,51,-1,0,-2,51,51,0,-3,51,-3,52,-12,51,51,51,51,51,-1,51,51,51,51,51,-1,51,51,51,51,51,51,51,-29,51,51,51],
    sm18$1=[0,51,-1,51,-1,0,-2,51,51,0,-3,51,-3,53,-12,51,51,51,51,51,-1,51,51,51,51,51,-1,51,51,51,51,51,51,51,-29,51,51,51],
    sm19$1=[0,51,-1,51,-1,0,-2,51,51,0,-3,51,-3,54,-12,51,51,51,51,51,-1,51,51,51,51,51,-1,51,51,51,51,51,51,51,-29,51,51,51],
    sm20$1=[0,51,-1,51,-1,0,-2,51,51,0,-3,51,-16,51,51,51,51,51,-1,51,51,51,51,51,-1,51,51,51,51,51,51,51,-29,51,51,51],
    sm21=[0,51,-1,51,-1,0,-2,51,51,0,-3,51,-3,55,-12,51,51,51,51,51,-1,51,51,51,51,51,-1,51,51,51,51,51,51,51,-29,51,51,51],
    sm22=[0,56,-3,0,-4,0,-32,42,43,44,45,46,47,48],
    sm23=[0,57,-3,0,-4,0,-32,57,57,57,57,57,57,57],
    sm24=[0,57,-3,0,-4,0,-7,58,-24,57,57,57,57,57,57,57],
    sm25=[0,57,-3,0,-4,0,-7,59,-24,57,57,57,57,57,57,57],
    sm26=[0,57,-3,0,-4,0,-7,60,-24,57,57,57,57,57,57,57],
    sm27=[0,57,-3,0,-4,0,-7,61,-24,57,57,57,57,57,57,57],
    sm28=[0,62,-3,0,-4,0,-26,12,13,14,15,16],
    sm29=[0,63,-3,0,-4,0],
    sm30=[0,64,-3,0,-4,0],
    sm31=[0,65,-1,2,-1,0,-2,3,4,0,-3,5,-2,65,-1,65,65,65,65,-14,65,65,65,65,65,-39,17],
    sm32=[0,66,-3,0,-4,0,-5,26,66,-1,66,66,66,66,-14,66,66,66,66,66],
    sm33=[0,67,-3,0,-4,0,-5,26,67,-1,67,67,67,67,-14,67,67,67,67,67],
    sm34=[0,68,-1,68,-1,0,-2,68,68,0,-3,68,-2,68,-1,68,68,68,68,-14,68,68,68,68,68,-39,68],
    sm35=[0,69,-1,69,-1,0,-2,69,69,0,-3,69,-2,69,-1,69,69,69,69,-14,69,69,69,69,69,-39,69],
    sm36=[0,70,-1,70,-1,0,-2,70,70,0,-3,70,-1,70,70,-1,70,70,70,70,70,70,70,70,70,70,70,70,-5,70,70,70,70,70,70,70,-7,70,70,70,70,70,-1,70,-1,70,70,-1,70,-5,70,70,70,70,70,70,70,70,70,70,70,70,-2,70],
    sm37=[0,71,-1,2,-1,33,-2,3,4,0,-3,5,-1,71,71,-1,71,71,71,71,71,71,71,71,71,71,71,71,-5,71,71,71,71,71,71,71,-7,71,71,71,71,71,-1,71,-1,71,71,-1,71,71,71,71,71,-1,71,71,71,71,71,71,71,71,71,71,71,71,71,71,71,-1,34],
    sm38=[0,72,-1,72,-1,72,-2,72,72,0,-3,72,-1,72,72,-1,72,72,72,72,72,72,72,72,72,72,72,72,-5,72,72,72,72,72,72,72,-7,72,72,72,72,72,-1,72,-1,72,72,-1,72,72,72,72,72,-1,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,-1,72],
    sm39=[0,73,-1,73,-1,73,-2,73,73,0,-3,73,-1,73,73,-1,73,73,73,73,73,73,73,73,73,73,73,73,-5,73,73,73,73,73,73,73,-7,73,73,73,73,73,-1,73,-1,73,73,-1,73,73,73,73,73,-1,73,73,73,73,73,73,73,73,73,73,73,73,73,73,73,-1,73],
    sm40=[0,-2,2,-1,0,-2,3,4,0,-3,5],
    sm41=[0,74,-3,0,-4,0,-26,74,74,74,74,74],
    sm42=[0,75,-3,0,-4,0,-12,76,77,78,79,-9,75,75,75,75,75,75],
    sm43=[0,80,-3,0,-4,0,-12,80,80,80,80,81,82,83,84,-5,80,80,80,80,80,80],
    sm44=[0,85,-3,0,-4,0,-12,85,85,85,85,85,85,85,85,-5,85,85,85,85,85,85],
    sm45=[0,-2,2,-1,0,-2,3,4,0,-3,5,-20,41,-7,42,43,44,45,46,47,48,-29,49,50,17],
    sm46=[0,-2,2,-1,0,-2,3,4,0,-3,5,-16,37,38,39,40,41,-7,42,43,44,45,46,47,48,-29,49,50,17],
    sm47=[0,86,-3,0,-4,0,-12,86,86,86,86,86,86,86,86,-5,86,86,86,86,86,86],
    sm48=[0,87,-3,0,-4,0,-12,87,87,87,87,87,87,87,87,-5,87,87,87,87,87,87],
    sm49=[0,88,-3,0,-4,0,-12,88,88,88,88,88,88,88,88,-5,88,88,88,88,88,88,88],
    sm50=[0,89,-3,0,-4,0,-12,89,89,89,89,89,89,89,89,-5,89,89,89,89,89,89,89,-7,90,91,92,93,94,-1,95,-1,96,97,-1,98,-5,99,100,101,102,103,104,105,106,107,108,109,110],
    sm51=[0,111,-3,0,-4,0,-12,111,111,111,111,111,111,111,111,-5,111,111,111,111,111,111,111,-7,111,111,111,111,111,-1,111,-1,111,111,-1,111,-5,111,111,111,111,111,111,111,111,111,111,111,111],
    sm52=[0,112,-3,0,-4,0,-12,112,112,112,112,112,112,112,112,-5,112,112,112,112,112,112,112,-7,90,91,92,93,94,-1,95,-1,96,97,-1,98,-5,99,100,101,102,103,104,105,106,107,108,109,110],
    sm53=[0,113,-3,0,-4,0,-12,113,113,113,113,113,113,113,113,-5,113,113,113,113,113,113,113,-7,113,113,113,113,113,-1,113,-1,113,113,-1,113,-5,113,113,113,113,113,113,113,113,113,113,113,113],
    sm54=[0,-4,0,-4,0,-39,90,91,92,93,94,-1,114,-1,115,97,-1,98,-5,99,100],
    sm55=[0,-4,0,-4,0,-39,116,116,116,116,116,-1,116,-1,116,116,-1,116,-5,116,116],
    sm56=[0,-2,2,-1,0,-2,3,4,0,-3,5,-66,17],
    sm57=[0,117,-1,117,-1,0,-2,117,117,0,-3,117,-16,117,117,117,117,117,-1,117,117,117,117,117,-1,117,117,117,117,117,117,117,-29,117,117,117],
    sm58=[0,118,-3,0,-4,0,-31,119],
    sm59=[0,120,-3,0,-4,0,-31,120],
    sm60=[0,121,-3,0,-4,0,-32,121,121,121,121,121,121,121],
    sm61=[0,122,-3,0,-4,0],
    sm62=[0,123,-3,0,-4,0,-5,26,123,-1,123,123,123,123,-14,123,123,123,123,123],
    sm63=[0,124,-1,124,-1,124,-2,124,124,0,-3,124,-1,124,124,-1,124,124,124,124,124,124,124,124,124,124,124,124,-5,124,124,124,124,124,124,124,-7,124,124,124,124,124,-1,124,-1,124,124,-1,124,124,124,124,124,-1,124,124,124,124,124,124,124,124,124,124,124,124,124,124,124,-1,124],
    sm64=[0,125,-1,125,-1,125,-2,125,125,0,-3,125,-1,125,125,-1,125,125,125,125,125,125,125,125,125,125,125,125,-5,125,125,125,125,125,125,125,-7,125,125,125,125,125,-1,125,-1,125,125,-1,125,125,125,125,125,-1,125,125,125,125,125,125,125,125,125,125,125,125,125,125,125,-1,125],
    sm65=[0,126,-3,0,-4,0,-12,126,126,126,126,126,126,126,126,-5,126,126,126,126,126,126],
    sm66=[0,-4,0,-4,0,-25,127],
    sm67=[0,-4,0,-4,0,-25,128],
    sm68=[0,-4,0,-4,0,-68,129],
    sm69=[0,-4,0,-4,0,-69,130],
    sm70=[0,131,-3,0,-4,0,-12,131,131,131,131,131,131,131,131,-5,131,131,131,131,131,131,131,-13,132,-1,133,-10,101,102,103,104,105,106,107,108,109,110],
    sm71=[0,134,-3,0,-4,0,-12,134,134,134,134,134,134,134,134,-5,134,134,134,134,134,134,134],
    sm72=[0,-1,135,2,-1,0,-2,3,4,0,-3,5,-66,17],
    sm73=[0,-1,136,-2,0,-4,0],
    sm74=[0,-1,137,-2,0,-4,0],
    sm75=[0,-1,138,138,-1,0,-2,138,138,0,-3,138,-39,139,-2,140,-3,98,-5,99,100,-12,138],
    sm76=[0,141,-3,0,-4,0,-12,141,141,141,141,141,141,141,141,-5,141,141,141,141,141,141,141,-13,141,-1,141,-10,141,141,141,141,141,141,141,141,141,141],
    sm77=[0,-1,138,138,-1,0,-2,138,138,0,-3,138,-66,138],
    sm78=[0,-4,0,-4,0,-39,142],
    sm79=[0,143,144,-2,0,-4,0,-12,143,143,143,143,143,143,143,143,-5,143,143,143,143,143,143,143],
    sm80=[0,-1,144,-2,0,-4,0],
    sm81=[0,145,146,-2,0,-4,0,-12,145,145,145,145,145,145,145,145,-5,145,145,145,145,145,145,145],
    sm82=[0,-1,146,-2,0,-4,0],
    sm83=[0,-1,147,-2,0,-4,0],
    sm84=[0,-1,148,-2,0,-4,0],
    sm85=[0,-1,149,2,-1,0,-2,3,4,0,-3,5],
    sm86=[0,-1,150,150,-1,0,-2,150,150,0,-3,150],
    sm87=[0,151,-3,0,-4,0,-12,151,151,151,151,151,151,151,151,-5,151,151,151,151,151,151,151],
    sm88=[0,152,-3,0,-4,0,-12,152,152,152,152,152,152,152,152,-5,152,152,152,152,152,152,152],
    sm89=[0,143,-3,0,-4,0,-12,143,143,143,143,143,143,143,143,-5,143,143,143,143,143,143,143],
    sm90=[0,145,-3,0,-4,0,-12,145,145,145,145,145,145,145,145,-5,145,145,145,145,145,145,145],
    sm91=[0,153,-3,0,-4,0,-12,153,153,153,153,153,153,153,153,-5,153,153,153,153,153,153,153,-13,132,-1,133,-10,101,102,103,104,105,106,107,108,109,110],
    sm92=[0,154,-3,0,-4,0,-12,154,154,154,154,154,154,154,154,-5,154,154,154,154,154,154,154],
    sm93=[0,155,-3,0,-4,0,-12,155,155,155,155,155,155,155,155,-5,155,155,155,155,155,155,155,-13,132,-1,133,-10,101,102,103,104,105,106,107,108,109,110],
    sm94=[0,156,-3,0,-4,0,-12,156,156,156,156,156,156,156,156,-5,156,156,156,156,156,156,156,-7,90,91,92,93,94,-1,95,-1,96,97,-1,98,-5,99,100,101,102,103,104,105,106,107,108,109,110],
    sm95=[0,-4,0,-4,0,-32,42,43,44,45,46,47,48],
    sm96=[0,157,-3,0,-4,0,-25,157,157,157,157,157,157],
    sm97=[0,158,-3,0,-4,0,-12,158,158,158,158,-9,158,158,158,158,158,158],
    sm98=[0,159,-3,0,-4,0,-12,159,159,159,159,159,159,159,159,-5,159,159,159,159,159,159],
    sm99=[0,160,-3,0,-4,0,-12,160,160,160,160,160,160,160,160,-5,160,160,160,160,160,160],
    sm100=[0,161,-3,0,-4,0,-12,161,161,161,161,161,161,161,161,-5,161,161,161,161,161,161,161],
    sm101=[0,162,-3,0,-4,0,-12,162,162,162,162,162,162,162,162,-5,162,162,162,162,162,162,162,-13,162,-1,162,-10,162,162,162,162,162,162,162,162,162,162],
    sm102=[0,163,-3,0,-4,0,-12,163,163,163,163,163,163,163,163,-5,163,163,163,163,163,163,163,-13,163,-1,163,-10,163,163,163,163,163,163,163,163,163,163],
    sm103=[0,164,-3,0,-4,0,-12,164,164,164,164,164,164,164,164,-5,164,164,164,164,164,164,164,-13,164,-1,164,-10,164,164,164,164,164,164,164,164,164,164],
    sm104=[0,165,-3,0,-4,0,-12,165,165,165,165,165,165,165,165,-5,165,165,165,165,165,165,165,-13,165,-1,165,-10,165,165,165,165,165,165,165,165,165,165],
    sm105=[0,166,-3,0,-4,0,-12,166,166,166,166,166,166,166,166,-5,166,166,166,166,166,166,166,-13,166,-1,166,-10,166,166,166,166,166,166,166,166,166,166],
    sm106=[0,-1,167,-2,0,-4,0,-44,168],
    sm107=[0,-1,169,-2,0,-4,0,-44,170],
    sm108=[0,-1,171,171,-1,0,-2,171,171,0,-3,171,-66,171],
    sm109=[0,172,-3,0,-4,0,-12,172,172,172,172,172,172,172,172,-5,172,172,172,172,172,172,172,-13,172,-1,172,-3,173,174,175,176,177,-2,172,172,172,172,172,172,172,172,172,172],
    sm110=[0,178,-3,0,-4,0,-12,178,178,178,178,178,178,178,178,-5,178,178,178,178,178,178,178,-13,178,-1,178,-3,179,180,181,182,-3,178,178,178,178,178,178,178,178,178,178],
    sm111=[0,183,-3,0,-4,0,-12,183,183,183,183,183,183,183,183,-5,183,183,183,183,183,183,183,-13,183,-1,183,-3,183,183,183,183,-3,183,183,183,183,183,183,183,183,183,183],
    sm112=[0,184,-3,0,-4,0,-12,184,184,184,184,184,184,184,184,-5,184,184,184,184,184,184,184],
    sm113=[0,185,-3,0,-4,0,-12,185,185,185,185,185,185,185,185,-5,185,185,185,185,185,185,185],
    sm114=[0,186,-3,0,-4,0,-12,186,186,186,186,186,186,186,186,-5,186,186,186,186,186,186,186,-13,132,-1,133,-10,101,102,103,104,105,106,107,108,109,110],
    sm115=[0,187,-3,0,-4,0,-12,187,187,187,187,187,187,187,187,-5,187,187,187,187,187,187,187],
    sm116=[0,188,-3,0,-4,0,-31,188],
    sm117=[0,-1,189,-2,0,-4,0],
    sm118=[0,-1,190,-2,0,-4,0],
    sm119=[0,191,-3,0,-4,0,-12,191,191,191,191,191,191,191,191,-5,191,191,191,191,191,191,191,-13,191,-1,191,-10,191,191,191,191,191,191,191,191,191,191],
    sm120=[0,-1,192,-2,0,-4,0],
    sm121=[0,-1,193,-2,0,-4,0],
    sm122=[0,194,-3,0,-4,0,-12,194,194,194,194,194,194,194,194,-5,194,194,194,194,194,194,194,-13,194,-1,194,-10,194,194,194,194,194,194,194,194,194,194],
    sm123=[0,-1,195,195,-1,0,-2,195,195,0,-3,195],
    sm124=[0,196,-3,0,-4,0,-12,196,196,196,196,196,196,196,196,-5,196,196,196,196,196,196,196],
    sm125=[0,197,-3,0,-4,0,-12,197,197,197,197,197,197,197,197,-5,197,197,197,197,197,197,197,-13,197,-1,197,-10,197,197,197,197,197,197,197,197,197,197],
    sm126=[0,198,-3,0,-4,0,-12,198,198,198,198,198,198,198,198,-5,198,198,198,198,198,198,198,-13,198,-1,198,-10,198,198,198,198,198,198,198,198,198,198],

        // Symbol Lookup map
        lu$1 = new Map([[1,1],[2,2],[4,3],[8,4],[16,5],[32,6],[64,7],[128,8],[256,9],[512,10],[3,11],[264,12],[200,13],[201,14],["/",15],["?",16],[":",17],["f",18],["filter",19],["Filter",20],["FILTER",21],["&&",22],["AND",23],["And",24],["and",25],["||",26],["OR",27],["Or",28],["or",29],["NOT",30],["Not",31],["not",32],["!",33],["(",34],[")",35],["|",36],["s",37],["sort",38],["SORT",39],["Sort",40],[",",41],["created",42],["CREATED",43],["modifier",44],["MODIFIED",45],["size",46],["SIZE",47],["#",48],["is",49],["equals",50],["=",51],["that",52],["greater",53],["than",54],[">",55],["less",56],["<",57],["lesser",58],[null,2],["from",60],["to",61],["-",62],["TO",63],["To",64],["through",65],["on",66],["date",67],["DES",68],["des",69],["descending",70],["DESCENDING",71],["down",72],["ASC",73],["asc",74],["ascending",75],["ASCENDING",76],["up",77],["\"",78],["'",79],["*",80],["\\",82]]),

        //Reverse Symbol Lookup map
        rlu$1 = new Map([[1,1],[2,2],[3,4],[4,8],[5,16],[6,32],[7,64],[8,128],[9,256],[10,512],[11,3],[12,264],[13,200],[14,201],[15,"/"],[16,"?"],[17,":"],[18,"f"],[19,"filter"],[20,"Filter"],[21,"FILTER"],[22,"&&"],[23,"AND"],[24,"And"],[25,"and"],[26,"||"],[27,"OR"],[28,"Or"],[29,"or"],[30,"NOT"],[31,"Not"],[32,"not"],[33,"!"],[34,"("],[35,")"],[36,"|"],[37,"s"],[38,"sort"],[39,"SORT"],[40,"Sort"],[41,","],[42,"created"],[43,"CREATED"],[44,"modifier"],[45,"MODIFIED"],[46,"size"],[47,"SIZE"],[48,"#"],[49,"is"],[50,"equals"],[51,"="],[52,"that"],[53,"greater"],[54,"than"],[55,">"],[56,"less"],[57,"<"],[58,"lesser"],[2,null],[60,"from"],[61,"to"],[62,"-"],[63,"TO"],[64,"To"],[65,"through"],[66,"on"],[67,"date"],[68,"DES"],[69,"des"],[70,"descending"],[71,"DESCENDING"],[72,"down"],[73,"ASC"],[74,"asc"],[75,"ascending"],[76,"ASCENDING"],[77,"up"],[78,"\""],[79,"'"],[80,"*"],[82,"\\"]]),

        // States 
        state$1 = [sm0$1,
    sm1$1,
    sm2$1,
    sm3$1,
    sm4$1,
    sm5$1,
    sm6$1,
    sm7$1,
    sm8$1,
    sm9$1,
    sm10$1,
    sm11$1,
    sm12$1,
    sm12$1,
    sm13$1,
    sm14$1,
    sm15$1,
    sm15$1,
    sm15$1,
    sm15$1,
    sm16$1,
    sm17$1,
    sm18$1,
    sm19$1,
    sm20$1,
    sm21,
    sm22,
    sm23,
    sm24,
    sm25,
    sm26,
    sm27,
    sm28,
    sm29,
    sm30,
    sm31,
    sm32,
    sm33,
    sm34,
    sm35,
    sm36,
    sm37,
    sm38,
    sm39,
    sm39,
    sm39,
    sm40,
    sm41,
    sm42,
    sm43,
    sm44,
    sm45,
    sm45,
    sm45,
    sm45,
    sm46,
    sm47,
    sm47,
    sm48,
    sm40,
    sm40,
    sm49,
    sm49,
    sm49,
    sm49,
    sm50,
    sm51,
    sm51,
    sm52,
    sm53,
    sm53,
    sm54,
    sm55,
    sm55,
    sm56,
    sm57,
    sm57,
    sm57,
    sm57,
    sm58,
    sm59,
    sm60,
    sm60,
    sm60,
    sm60,
    sm61,
    sm62,
    sm63,
    sm64,
    sm46,
    sm46,
    sm46,
    sm46,
    sm46,
    sm46,
    sm46,
    sm46,
    sm65,
    sm65,
    sm65,
    sm65,
    sm66,
    sm67,
    sm68,
    sm69,
    sm70,
    sm71,
    sm72,
    sm73,
    sm74,
    sm75,
    sm76,
    sm76,
    sm77,
    sm77,
    sm78,
    sm79,
    sm80,
    sm81,
    sm82,
    sm83,
    sm84,
    sm85,
    sm86,
    sm86,
    sm87,
    sm88,
    sm89,
    sm89,
    sm89,
    sm89,
    sm89,
    sm90,
    sm90,
    sm90,
    sm90,
    sm90,
    sm91,
    sm92,
    sm93,
    sm80,
    sm82,
    sm94,
    sm95,
    sm96,
    sm96,
    sm96,
    sm96,
    sm97,
    sm97,
    sm97,
    sm97,
    sm98,
    sm99,
    sm99,
    sm100,
    sm89,
    sm90,
    sm101,
    sm102,
    sm103,
    sm104,
    sm105,
    sm105,
    sm106,
    sm107,
    sm108,
    sm109,
    sm110,
    sm111,
    sm111,
    sm112,
    sm113,
    sm114,
    sm115,
    sm116,
    sm117,
    sm118,
    sm119,
    sm120,
    sm121,
    sm121,
    sm121,
    sm121,
    sm121,
    sm122,
    sm85,
    sm123,
    sm123,
    sm123,
    sm123,
    sm124,
    sm125,
    sm126],

    /************ Functions *************/

        max$1 = Math.max, min$1 = Math.min,

        //Error Functions
        e$2 = (tk,r,o,l,p)=>{if(l.END)l.throw("Unexpected end of input");else if(l.ty & (264)) l.throw(`Unexpected space character within input "${p.slice(l)}" `) ; else l.throw(`Unexpected token [${l.tx}]`);}, 
        eh$1 = [e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2,
    e$2],

        //Empty Function
        nf$1 = ()=>-1, 

        //Environment Functions
        
    redv$1 = (ret, fn, plen, ln, t, e, o, l, s) => {        ln = max$1(o.length - plen, 0);        const slice = o.slice(-plen);        o.length = ln + 1;        o[ln] = fn(slice, e, l, s, o, plen);        return ret;    },
    rednv$1 = (ret, Fn, plen, ln, t, e, o, l, s) => {        ln = max$1(o.length - plen, 0);        const slice = o.slice(-plen);        o.length = ln + 1;        o[ln] = new Fn(slice, e, l, s, o, plen);        return ret;    },
    redn$1 = (ret, plen, t, e, o) => {        if (plen > 0) {            let ln = max$1(o.length - plen, 0);            o[ln] = o[o.length - 1];            o.length = ln + 1;        }        return ret;    },
    shftf$1 = (ret, fn, t, e, o, l, s) => (fn(o, e, l, s), ret),
    C20_query_body=function (sym){this.container = sym[0];this.filter = sym[1];this.sort = sym[2];},
    C21_query_body=function (sym){this.container = null;this.filter = sym[0];this.sort = sym[1];},
    C22_query_body=function (sym){this.container = sym[0];this.filter = null;this.sort = sym[1];},
    C23_query_body=function (sym){this.container = sym[0];this.filter = sym[1];this.sort = null;},
    C24_query_body=function (sym){this.container = null;this.filter = null;this.sort = sym[0];},
    C25_query_body=function (sym){this.container = null;this.filter = sym[0];this.sort = null;},
    C26_query_body=function (sym){this.container = sym[0];this.filter = null;this.sort = null;},
    C27_query_body=function (){this.container = null;this.filter = null;this.sort = null;},
    R30_container_identifier_list=sym=>(((sym[1] !== null) ? sym[0].push(sym[1]) : null,sym[0])),
    R31_container_identifier_list=sym=>(sym[0] !== null) ? [sym[0]] : [],
    C40_container_clause=function (sym){this.containers = [{ids : [""]},...sym[1]];this.id = sym[2];if(this.id)if(this.id.ids.length == 1 && this.id.ids[0] == "*"){if(!this.containers)this.containers = [];this.containers.push(this.id);this.id = null;}},
    C41_container_clause=function (sym){this.containers = [{ids : [""]},...sym[0]];this.id = sym[1];if(this.id)if(this.id.ids.length == 1 && this.id.ids[0] == "*"){if(!this.containers)this.containers = [];this.containers.push(this.id);this.id = null;}},
    C42_container_clause=function (sym){this.containers = [{ids : [""]}];this.id = sym[1];if(this.id)if(this.id.ids.length == 1 && this.id.ids[0] == "*"){if(!this.containers)this.containers = [];this.containers.push(this.id);this.id = null;}},
    C43_container_clause=function (sym){this.containers = [{ids : [""]},...sym[1]];this.id = null;if(this.id)if(this.id.ids.length == 1 && this.id.ids[0] == "*"){if(!this.containers)this.containers = [];this.containers.push(this.id);this.id = null;}},
    C44_container_clause=function (sym){this.containers = [{ids : [""]}];this.id = sym[0];if(this.id)if(this.id.ids.length == 1 && this.id.ids[0] == "*"){if(!this.containers)this.containers = [];this.containers.push(this.id);this.id = null;}},
    C45_container_clause=function (sym){this.containers = [{ids : [""]},...sym[0]];this.id = null;if(this.id)if(this.id.ids.length == 1 && this.id.ids[0] == "*"){if(!this.containers)this.containers = [];this.containers.push(this.id);this.id = null;}},
    C46_container_clause=function (){this.containers = [{ids : [""]}];this.id = null;if(this.id)if(this.id.ids.length == 1 && this.id.ids[0] == "*"){if(!this.containers)this.containers = [];this.containers.push(this.id);this.id = null;}},
    R50_container_identifier=sym=>sym[0],
    R70_filter_clause=sym=>sym[1],
    R71_filter_clause=()=>null,
    C90_and_expression=function (sym){this.type = "AND";this.left = sym[0];this.right = sym[2];},
    C100_or_expression=function (sym){this.type = "OR";this.left = sym[0];this.right = sym[2];},
    C110_not_expression=function (sym){this.type = "NOT";this.left = sym[1];},
    C120_wrapped_expression=function (sym){this.type = "MATCH";this.value = sym[0];},
    R140_stetement_list=sym=>(((sym[1] !== null) ? sym[0].push(sym[2]) : null,sym[0])),
    C180_created_statement=function (sym){this.type = "CREATED";this.val = sym[1];this.order = sym[2] || 1;},
    C181_created_statement=function (sym){this.type = "CREATED";this.val = null;this.order = sym[1] || 1;},
    C182_created_statement=function (sym){this.type = "CREATED";this.val = sym[1];this.order = 1;},
    C183_created_statement=function (){this.type = "CREATED";this.val = null;this.order = 1;},
    C200_modified_statement=function (sym){this.type = "MODIFIED";this.val = sym[1];this.order = sym[2] || 1;},
    C201_modified_statement=function (sym){this.type = "MODIFIED";this.val = null;this.order = sym[1] || 1;},
    C202_modified_statement=function (sym){this.type = "MODIFIED";this.val = sym[1];this.order = 1;},
    C203_modified_statement=function (){this.type = "MODIFIED";this.val = null;this.order = 1;},
    C220_size_statement=function (sym){this.type = "SIZE";this.val = sym[1];this.order = sym[2] || 1;},
    C221_size_statement=function (sym){this.type = "SIZE";this.val = sym[1];this.order = 1;},
    C230_tag_statement=function (sym){this.type = "TAG";this.id = sym[1];this.val = sym[2];this.order = sym[3] || 1;},
    C231_tag_statement=function (sym){this.type = "TAG";this.id = sym[1];this.val = null;this.order = sym[2] || 1;},
    C232_tag_statement=function (sym){this.type = "TAG";this.id = sym[1];this.val = sym[2];this.order = 1;},
    C233_tag_statement=function (sym){this.type = "TAG";this.id = sym[1];this.val = null;this.order = 1;},
    R270_comparison_expression=sym=>({type : "EQUALS_QUANTITATIVE",val : parseFloat(sym[1])}),
    R271_comparison_expression=sym=>({type : "EQUALS_QUALITATIVE",val : sym[1]}),
    R272_comparison_expression=sym=>({type : "GREATERTHAN",val : parseFloat(sym[1])}),
    R273_comparison_expression=sym=>({type : "LESSTHAN",val : parseFloat(sym[1])}),
    R310_range_expression=sym=>({type : "RANGE",val : [sym[1],sym[2]].map(parseFloat).sort((a,b)=>a < b ? -1 : 1)}),
    R311_range_expression=sym=>({type : "RANGE",val : [sym[1]].map(parseFloat).sort((a,b)=>a < b ? -1 : 1)}),
    R360_date_expression=sym=>({type : "DATE",val : [sym[1],sym[2]].map(d=>new Date(d).valueOf()).sort((a,b)=>a < b ? -1 : 1)}),
    R361_date_expression=sym=>({type : "DATE",val : [sym[1]].map(d=>new Date(d).valueOf()).sort((a,b)=>a < b ? -1 : 1)}),
    R390_order=()=>-1,
    R391_order=()=>1,
    C410_identifier=function (sym){this.ids = sym[0];},
    R440_string_data_val_list=sym=>sym[0] + sym[1],
    R441_string_data_val_list=sym=>sym[0] + "",
    R450_string_data=sym=>[sym[0],...sym[1]].join("").trim(),
    R451_string_data=sym=>[sym[0]].join("").trim(),

        //Sparse Map Lookup
        lsm$1 = (index, map) => {    if (map[0] == 0xFFFFFFFF) return map[index + 1];    for (let i = 1, ind = 0, l = map.length, n = 0; i < l && ind <= index; i++) {        if (ind !== index) {            if ((n = map[i]) > -1) ind++;            else ind += -n;        } else return map[i];    }    return -1;},

        //State Action Functions
        state_funct$1 = [(...v)=>(redn$1(2051,0,...v)),
    e=>78,
    e=>74,
    e=>70,
    e=>66,
    e=>26,
    e=>86,
    e=>90,
    e=>94,
    e=>98,
    e=>102,
    e=>110,
    e=>114,
    e=>118,
    e=>122,
    e=>126,
    e=>58,
    (...v)=>redn$1(5,1,...v),
    (...v)=>redn$1(1031,1,...v),
    (...v)=>rednv$1(2055,C26_query_body,1,0,...v),
    (...v)=>rednv$1(2055,C25_query_body,1,0,...v),
    (...v)=>rednv$1(2055,C24_query_body,1,0,...v),
    (...v)=>rednv$1(4103,C46_container_clause,1,0,...v),
    (...v)=>rednv$1(4103,C45_container_clause,1,0,...v),
    (...v)=>rednv$1(4103,C44_container_clause,1,0,...v),
    e=>158,
    (...v)=>redv$1(3079,R31_container_identifier_list,1,0,...v),
    (...v)=>rednv$1(41991,C410_identifier,1,0,...v),
    (...v)=>redv$1(40967,R31_container_identifier_list,1,0,...v),
    (...v)=>redn$1(43015,1,...v),
    (...v)=>redn$1(47111,1,...v),
    (...v)=>redv$1(46087,R451_string_data,1,0,...v),
    e=>182,
    e=>186,
    (...v)=>redn$1(50183,1,...v),
    (...v)=>redv$1(7175,R71_filter_clause,1,0,...v),
    e=>206,
    e=>210,
    e=>214,
    e=>218,
    e=>222,
    e=>266,
    e=>270,
    e=>278,
    e=>282,
    e=>290,
    e=>294,
    e=>298,
    e=>238,
    e=>242,
    (...v)=>redn$1(6151,1,...v),
    e=>302,
    e=>306,
    e=>310,
    e=>314,
    (...v)=>redv$1(15367,R71_filter_clause,1,0,...v),
    (...v)=>redn$1(13319,1,...v),
    e=>326,
    e=>330,
    e=>334,
    e=>338,
    (...v)=>rednv$1(2059,C23_query_body,2,0,...v),
    (...v)=>rednv$1(2059,C22_query_body,2,0,...v),
    (...v)=>rednv$1(2059,C21_query_body,2,0,...v),
    (...v)=>rednv$1(4107,C43_container_clause,2,0,...v),
    (...v)=>rednv$1(4107,C42_container_clause,2,0,...v),
    (...v)=>rednv$1(4107,C41_container_clause,2,0,...v),
    (...v)=>redv$1(3083,R30_container_identifier_list,2,0,...v),
    (...v)=>redv$1(5131,R50_container_identifier,2,0,...v),
    (...v)=>redv$1(40971,R30_container_identifier_list,2,0,...v),
    (...v)=>redv$1(46091,R450_string_data,2,0,...v),
    (...v)=>redv$1(45063,R441_string_data_val_list,1,0,...v),
    (...v)=>redn$1(48135,1,...v),
    (...v)=>redv$1(7179,R70_filter_clause,2,0,...v),
    (...v)=>redn$1(9223,1,...v),
    e=>358,
    e=>362,
    e=>366,
    e=>370,
    (...v)=>redn$1(10247,1,...v),
    e=>374,
    e=>378,
    e=>382,
    e=>386,
    (...v)=>redn$1(11271,1,...v),
    (...v)=>rednv$1(12295,C120_wrapped_expression,1,0,...v),
    (...v)=>redn$1(12295,1,...v),
    (...v)=>redn$1(16391,1,...v),
    (...v)=>rednv$1(18439,C183_created_statement,1,0,...v),
    e=>442,
    e=>454,
    e=>458,
    e=>462,
    e=>470,
    e=>466,
    e=>474,
    e=>478,
    e=>486,
    e=>494,
    e=>498,
    e=>510,
    e=>514,
    e=>518,
    e=>522,
    e=>526,
    e=>530,
    e=>534,
    e=>538,
    e=>542,
    e=>546,
    (...v)=>redn$1(17415,1,...v),
    (...v)=>rednv$1(20487,C203_modified_statement,1,0,...v),
    (...v)=>redn$1(19463,1,...v),
    e=>562,
    e=>566,
    (...v)=>redn$1(21511,1,...v),
    (...v)=>redn$1(6155,2,...v),
    (...v)=>redv$1(15371,R70_filter_clause,2,0,...v),
    e=>574,
    (...v)=>redv$1(14343,R31_container_identifier_list,1,0,...v),
    (...v)=>redn$1(13323,2,...v),
    (...v)=>rednv$1(2063,C20_query_body,3,0,...v),
    (...v)=>rednv$1(4111,C40_container_clause,3,0,...v),
    (...v)=>redv$1(45067,R440_string_data_val_list,2,0,...v),
    (...v)=>redv$1(49163,R70_filter_clause,2,0,...v),
    (...v)=>rednv$1(11275,C110_not_expression,2,0,...v),
    e=>610,
    (...v)=>redn$1(8199,1,...v),
    e=>614,
    e=>618,
    (...v)=>rednv$1(18443,C182_created_statement,2,0,...v),
    e=>626,
    e=>630,
    (...v)=>rednv$1(18443,C181_created_statement,2,0,...v),
    e=>634,
    e=>642,
    e=>646,
    (...v)=>redn$1(24583,1,...v),
    e=>658,
    e=>662,
    (...v)=>redv$1(27655,R50_container_identifier,1,0,...v),
    e=>666,
    (...v)=>redn$1(37895,1,...v),
    (...v)=>redn$1(25607,1,...v),
    (...v)=>redn$1(38919,1,...v),
    (...v)=>redn$1(26631,1,...v),
    e=>670,
    (...v)=>redn$1(28679,1,...v),
    e=>682,
    (...v)=>redn$1(32775,1,...v),
    (...v)=>redv$1(39943,R390_order,1,0,...v),
    (...v)=>redv$1(39943,R391_order,1,0,...v),
    (...v)=>rednv$1(20491,C202_modified_statement,2,0,...v),
    (...v)=>rednv$1(20491,C201_modified_statement,2,0,...v),
    (...v)=>rednv$1(22539,C221_size_statement,2,0,...v),
    (...v)=>rednv$1(23563,C233_tag_statement,2,0,...v),
    (...v)=>rednv$1(9231,C90_and_expression,3,0,...v),
    (...v)=>rednv$1(10255,C100_or_expression,3,0,...v),
    (...v)=>redv$1(12303,R70_filter_clause,3,0,...v),
    (...v)=>redv$1(44047,R70_filter_clause,3,0,...v),
    (...v)=>rednv$1(18447,C180_created_statement,3,0,...v),
    (...v)=>redv$1(27659,R270_comparison_expression,2,0,...v),
    (...v)=>redv$1(27659,R271_comparison_expression,2,0,...v),
    (...v)=>redv$1(27659,R272_comparison_expression,2,0,...v),
    (...v)=>redv$1(27659,R273_comparison_expression,2,0,...v),
    (...v)=>redv$1(27659,R70_filter_clause,2,0,...v),
    (...v)=>redn$1(25611,2,...v),
    e=>706,
    (...v)=>redn$1(26635,2,...v),
    e=>710,
    (...v)=>redn$1(24587,2,...v),
    (...v)=>redv$1(31755,R311_range_expression,2,0,...v),
    e=>722,
    e=>726,
    e=>730,
    e=>734,
    e=>738,
    (...v)=>redv$1(36875,R361_date_expression,2,0,...v),
    e=>750,
    e=>754,
    e=>758,
    e=>762,
    (...v)=>redn$1(33799,1,...v),
    (...v)=>rednv$1(20495,C200_modified_statement,3,0,...v),
    (...v)=>rednv$1(22543,C220_size_statement,3,0,...v),
    (...v)=>rednv$1(23567,C232_tag_statement,3,0,...v),
    (...v)=>rednv$1(23567,C231_tag_statement,3,0,...v),
    (...v)=>redv$1(14351,R140_stetement_list,3,0,...v),
    (...v)=>redn$1(25615,3,...v),
    (...v)=>redn$1(26639,3,...v),
    (...v)=>redv$1(31759,R310_range_expression,3,0,...v),
    e=>770,
    (...v)=>redn$1(29703,1,...v),
    (...v)=>redv$1(36879,R360_date_expression,3,0,...v),
    (...v)=>redn$1(34823,1,...v),
    (...v)=>rednv$1(23571,C230_tag_statement,4,0,...v),
    (...v)=>redv$1(30731,R70_filter_clause,2,0,...v),
    (...v)=>redv$1(35851,R70_filter_clause,2,0,...v)],

        //Goto Lookup Functions
        goto$1 = [v=>lsm$1(v,gt0$1),
    nf$1,
    nf$1,
    v=>lsm$1(v,gt1$1),
    v=>lsm$1(v,gt2$1),
    nf$1,
    v=>lsm$1(v,gt3$1),
    v=>lsm$1(v,gt4$1),
    nf$1,
    nf$1,
    v=>lsm$1(v,gt5$1),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt6),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt7),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt8),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt9),
    nf$1,
    nf$1,
    v=>lsm$1(v,gt10),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt11),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt12),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt13),
    v=>lsm$1(v,gt14),
    v=>lsm$1(v,gt15),
    v=>lsm$1(v,gt16),
    v=>lsm$1(v,gt17),
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt18),
    v=>lsm$1(v,gt19),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt20),
    nf$1,
    nf$1,
    v=>lsm$1(v,gt21),
    nf$1,
    nf$1,
    v=>lsm$1(v,gt22),
    nf$1,
    nf$1,
    v=>lsm$1(v,gt23),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt24),
    v=>lsm$1(v,gt25),
    v=>lsm$1(v,gt26),
    v=>lsm$1(v,gt27),
    v=>lsm$1(v,gt28),
    v=>lsm$1(v,gt29),
    v=>lsm$1(v,gt30),
    v=>lsm$1(v,gt31),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt32),
    nf$1,
    v=>lsm$1(v,gt33),
    nf$1,
    nf$1,
    v=>lsm$1(v,gt34),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt35),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt36),
    nf$1,
    v=>lsm$1(v,gt37),
    nf$1,
    nf$1,
    v=>lsm$1(v,gt38),
    v=>lsm$1(v,gt39),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt40),
    v=>lsm$1(v,gt41),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt42),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt43),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1];

    function getToken$1(l, SYM_LU) {
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

    function parser$1(l, e = {}) {

        fn$1 = e.functions;

        l.IWS = false;
        l.PARSE_STRING = true;

        if (symbols$1.length > 0) {
            symbols$1.forEach(s => { l.addSymbol(s); });
            l.tl = 0;
            l.next();
        }

        const o = [],
            ss = [0, 0];

        let time = 1000000,
            RECOVERING = 100,
            RESTARTED = true,
            tk = getToken$1(l, lu$1),
            p = l.copy(),
            sp = 1,
            len = 0,
            reduceStack = (e.reduceStack = []),
            ROOT = 10000,
            off = 0;

        outer:

            while (time-- > 0) {

                const fn = lsm$1(tk, state$1[ss[sp]]) || 0;

                let r,
                    gt = -1;

                if (fn == 0) {
                    /*Ignore the token*/
                    tk = getToken$1(l.next(), lu$1);
                    continue;
                }

                if (fn > 0) {
                    r = state_funct$1[fn - 1](tk, e, o, l, ss[sp - 1]);
                } else {

                    if (tk == 14) {
                        tk = lu$1.get(l.tx);
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

                        if (tk !== lu$1.get(l.ty)) {
                            tk = lu$1.get(l.ty);
                            continue;
                        }

                        if (tk !== 13) {
                            tk = 13;
                            RECOVERING = 1;
                            continue;
                        }
                    }

                    tk = getToken$1(l, lu$1);

                    const recovery_token = eh$1[ss[sp]](tk, e, o, l, p, ss[sp], (lex) => getToken$1(lex, lu$1));

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
                        tk = getToken$1(l, lu$1);
                        RECOVERING++;
                        break;

                    case 3:
                        /* REDUCE */
                        RESTARTED = true;

                        len = (r & 0x3FC) >> 1;

                        ss.length -= len;
                        sp -= len;
                        gt = goto$1[ss[sp]](r >> 10);

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
    };

    function receivedMessage(data){
    	console.log(data);
    }

    if(typeof on !== "undefined")
    	on("message", receivedMessage);
    else
    	onmessage = receivedMessage;


    /* Returns a Boolean value indicating whether the note's data matches the query */
    function filterQuery(filter, note) {
        switch (filter.type) {
            case "AND":
                return filterQuery(filter.left, note) && filterQuery(filter.right, note)
            case "OR":
                return filterQuery(filter.left, note) || filterQuery(filter.right, note)
            case "MATCH":
                return matchString(filter.value.ids, note.query_data) >= 0;
            case "TAG":
                return getTagPresence(note, filter.tag.ids);
            case "TAGEQ":
                break;
        }
    }

    function sortQuery(results, sorting_parameters, index = 0) {

        const sort = sorting_parameters[index];
        const length = sorting_parameters.length;

        switch (sort.type) {
            case "TAG":

                const order = sort.order || -1;
                const id = sort.tag.ids;
                results = results.sort((n1, n2) =>
                    getTagNumericalValue(n1, id) < getTagNumericalValue(n2, id) ? -1 * order : 1 * order
                );

                if (index + 1 < length) {
                    //split up results and continue
                    let old_value = null;
                    let last_index = 0;

                    for (let i = 0; i < results.length; i++) {

                        let val = getTagNumericalValue(results[i], id);

                        if (old_value !== null && old_value != val) {
                            if (i - last_index > 1)
                                results.splice(last_index, i - last_index, ...sortQuery(results.slice(last_index, i), sorting_parameters, index + 1));
                            last_index = i;
                        }

                        old_value = val;
                    }
                }

                break;
        }

        return results;
    }

    function matchString$1(strings, to_match_string, offset = 0, index = 0, FOLLOWING_WILD_CARD = (offset == 0)) {

        if (index == strings.length)
            return FOLLOWING_WILD_CARD ? to_match_string.length : offset;

        const string = strings[index];

        if (string == "*")
            return matchString$1(strings, to_match_string, offset, index + 1, true);
        else if (!string)
            return matchString$1(strings, to_match_string, offset, index + 1, FOLLOWING_WILD_CARD);
        else {

            const i = to_match_string.indexOf(string, offset);

            if (i >= 0 && (FOLLOWING_WILD_CARD || i == offset))
                return matchString$1(strings, to_match_string, i + string.length, index + 1)
        }

        return -1;
    }

    function parseId(identifier, string) {
        if (!identifier)
            return true;

        if (!string)
            return false;

        return matchString$1(identifier.ids, string) >= 0;
    }

    function parseContainer(identifiers, ContainerEntry, output, idI = 0, pI = 0) {}

    function sortValue(value_op, value) {
        if (value_op)
            switch (value_op.type) {
                case "EQUALS_QUANTITATIVE":
                case "GREATERTHAN":
                case "LESSTHAN":
                case "RANGE":
                    return parseFloat(value);
                case "DATE":
                    return new Date(value).valueOf();
            }

        if (!isNaN(value))
            return parseFloat(value);

        return value || true;
    }

    function sortTag(note, tag_op) {

        const ids = tag_op.id.ids;

        for (let i = 0; i < note.tags.length; i++) {

            const tag = (note.tags[i] + "").split(":");

            if (matchString$1(ids, tag[0]) >= 0) {

                return sortValue(tag_op.val, tag[1]);
            }
        }

        return false;
    }

    function getValue(sort_op, note) {
        switch (sort_op.type) {
            case 'TAG':
                return sortTag(note, sort_op);
                break;
            case 'CREATED':
                return note.created;
                break;
            case 'MODIFIED':
                return note.modified;
                break;
            case 'SIZE':
                return note.body.length;
                break;
        }
    }

    function mergeSort(tuples, start, end, order, temp = tuples.slice()) {
        if (end - start < 2) return tuples;

        const middle = start + ((end - start) >> 1);

        mergeSort(tuples, start, middle, order, temp);
        mergeSort(tuples, middle, end, order, temp);

        let i = 0,
            t = start,
            left = start,
            right = middle;

        if (order > 0)
            while ((left < middle) && (right < end)) {
                if (tuples[left].v <= tuples[right].v)
                    temp[t++] = tuples[left++];
                else
                    temp[t++] = tuples[right++];
            }
        else
            while ((left < middle) && (right < end)) {
                if (tuples[left].v > tuples[right].v)
                    temp[t++] = tuples[left++];
                else
                    temp[t++] = tuples[right++];
            }

        for (i = left; i < middle; i++)
            temp[t++] = tuples[i];

        for (i = right; i < end; i++)
            temp[t++] = tuples[i];

        for(i = start; i < end;i++)
            tuples[i] = temp[i];
    }

    function quickSort(tuples, start, end, order) {
        if (end - start < 2) return tuples;

        // console.log(tuples.map(t=>t.i))

        const
            divide_item = tuples[start],
            divide_val = divide_item.v;

        let low = start;
        let high = end - 1;

        if (order > 0) {
            outer: while (1) {
                while (tuples[high].v >= divide_val) {
                    high--;
                    if (high <= low) {
                        tuples[low] = divide_item;
                        break outer;
                    }
                }
                tuples[low] = tuples[high];
                low++;
                while (tuples[low].v < divide_val) {
                    low++;
                    if (low >= high) {
                        low = high;
                        tuples[low] = divide_item;
                        break outer;
                    }
                }
                tuples[high] = tuples[low];
            }
        }
        else {
            outerb: while (1) {
                while (tuples[high].v <= divide_val) {
                    high--;
                    if (high <= low) {
                        tuples[low] = divide_item;
                        break outerb;
                    }
                }
                tuples[low] = tuples[high];
                low++;
                while (tuples[low].v > divide_val) {
                    low++;
                    if (low >= high) {
                        low = high;
                        tuples[low] = divide_item;
                        break outerb;
                    }
                }
                tuples[high] = tuples[low];
            }
        }

        quickSort(tuples, start, low, order);
        quickSort(tuples, low + 1, end, order);

        return tuples;
    }

    function insertionSort(tuples, start, end, order) {

        //console.log(order, start, end)
        if (order > 0) {
            //console.log("ADASD!!")
            for (let i = start; i < end; i++) {
                for (let j = start; j < i; j++) {
                    if (tuples[j].v > tuples[i].v) {
                        const jv = tuples[i];

                        let e = i;

                        while (e >= j)
                            tuples[e--] = tuples[e];

                        tuples[j] = jv;

                        continue
                    }
                }
            }
        } else {
            //console.log("ADASD", start, end)
            for (let i = start; i < end; i++) {
                for (let j = start; j < i; j++) {
                    if (tuples[j].v < tuples[i].v) {
                        const jv = tuples[i];

                        let e = i;

                        while (e >= j)
                            tuples[e--] = tuples[e];

                        tuples[j] = jv;

                        continue
                    }
                }
            }
        }
    }

    function jsSort(tuples, start, end, order) {
        if (order > 0) {
            tuples.sort((n1, n2) => n1.v < n2.v ? -1 : n1.v > n2.v ? 1 : 0);
        } else {
            tuples.sort((n1, n2) => n1.v < n2.v ? 1 : n1.v > n2.v ? -1 : 0);
        }
    }

    const sortAlgorithm = jsSort;

    function sortProcessor(sort, notes, tuples = [], start = 0, end = notes.length, index = 0) {
        const sort_op = sort[index];

        if (tuples.length == 0)
            //Extract note values
            for (let i = start; i < end; i++)
                tuples.push({ v: getValue(sort_op, notes[i]), i });
        else {
            //console.log(start, end)
            for (let i = start; i < end; i++) {
                tuples[i].v = getValue(sort_op, notes[tuples[i].i]);
            }
        }
        const
            order = sort_op.order || -1;

        //console.log("SSSSSSSSSSSSSSSSSS",order, {start,end})

        //console.log(tuples)
        sortAlgorithm(tuples, start, end, order);

        if (index + 1 < sort.length) {
            //*/
            sortProcessor(sort, notes, tuples, start, end, index + 1);
            /*/ //*
            let
                old_value = null,
                last_index = 0;
            for (let i = 0; i < tuples.length; i++) {

                const val = tuples[i].v;

                if (old_value !== null && old_value != val) {

                    if (i - last_index > 1)
                        sortProcessor(sort, notes, tuples, last_index, i, index + 1);

                    last_index = i;
                }

                old_value = val;
            } //*/
        }

        return tuples
    }

    function sort(query_sort, notes) {
        const start = process.hrtime();
        //*/
        const tuples = sortProcessor(query_sort.reverse(), notes);
        /*/ //*
        const tuples = sortProcessor(query_sort, notes);
        //*/
        //console.log(process.hrtime(start)[1] / 1000000 + "ms")
        //console.log(tuples)
        return tuples.map(t => (notes[t.i]));
    }

    function filterValue(value_op, value) {
    	
    	if(!value_op)
    		return true;

        if (!value)
            return false;

        const val = value_op.val;
        
        switch (value_op.type) {
            case "EQUALS_QUALITATIVE":
                var v = matchString$1(val.ids, value) >= 0;
                return v
                break;
            case "EQUALS_QUANTITATIVE":
                value = parseFloat(value);
                return !isNaN(value) && (value == val);
                break;
            case "GREATERTHAN":
                value = parseFloat(value);
                return !isNaN(value) && (value < val);
                break;
            case "LESSTHAN":
                value = parseFloat(value);
                return !isNaN(value) && (value > val);
                break;
            case "RANGE":
                value = parseFloat(value);
                return !isNaN(value) && (value >= val[0] && value <= val[1]);
                break;
            case "DATE":

                value = new Date(value).valueOf();

                return !isNaN(value) && (
                    val.length > 1 ?
                    (value >= val && value <= val[1]) :
                    (value & val == value)
                );

                break;
        }
        return false;
    }

    function filterTag(note, tag_op) {

        const ids = tag_op.id.ids;

        for (let i = 0; i < note.tags.length; i++) {

            const tag = (note.tags[i] + "").split(":");

            if (matchString$1(ids, tag[0]) >= 0) {

                if (tag_op.val)
                    return filterValue(tag_op.val, tag[1]);

                return true;
            }
        }

        return false;
    }

    /* Returns a Boolean value indicating whether the note's data matches the query */
    function filterProcessor(filter, note) {

        switch (filter.type) {
            case "NOT":
                return ! filterProcessor(filter.left, note)
            case "AND":
                return filterProcessor(filter.left, note) && filterProcessor(filter.right, note)
            case "OR":
                return filterProcessor(filter.left, note) || filterProcessor(filter.right, note)
            case "MATCH":
                return matchString$1(filter.value.ids, note.query_data) >= 0;
            case "TAG":
                return filterTag(note, filter);
                break;
           case 'CREATED':
                return filterValue(filter.val, note.created);;
                break;
            case 'MODIFIED':
                return filterValue(filter.val, note.modified);;
                break;
            case 'SIZE':
                return filterValue(filter.val, note.body.length);;
                break;
        }
    }

    function filter(filter_op, notes){
     	return notes.filter(n=>filterProcessor(filter_op, n));
    }

    function QueryEngine(
        server, // Server functions that the query engine will use 
        CAN_USE_WORKER = false
    ) {

        /** Get Containers Functions should return a list of notes that match the query.container property. **/
        if (!server.getNotesFromContainer)
            throw new Error("Server not implemented with getNotesFromContainer method. Cannot create Query Engine");

        /** Get UID function should return a note indexed by the uid **/
        if (!server.getNoteFromUID)
            throw new Error("Server not implemented with getNoteFromUID method. Cannot create Query Engine");

        const
            SERVER_getNotesFromContainer = server.getNotesFromContainer.bind(server),
            SERVER_getNoteFromUID = server.getNoteFromUID.bind(server);

        const default_container = [{ ids: [""] }];

        /** ((new_note)(js_crawler.function))

        This function handles queries using thread primitives to split query 
        results over multiple threads to ensure maximum throughput.

        Queries occur in multiple passes. 
            - The first pass generates a list of note queriables that are comprised of 
                a. UID
                b. ID - TAG - BODY information
             
             These are selected based on the container portion of the query. i.e. ( => [container.container. id ] <= : ...)
             Multiple lists of this type can be generated based on strategies such as 
                - One MOAL (Mother of all lists), later split into equal parts
                - One list per container
                - Round Robin placement of lists generate per container into buckets
             These strategies can allow container group lookup to be distributed between computing units

            - Once a set of lists are generated, they are distributed to individual computing units to handle the second query action
            Each note is matched against the second query portion (... : =>[...]<=), and winning items are placed in output lists.

            Once all inputs have been processed, items are sorted based on the query criteria, or based on modified date. Results with duplicate UIDs are removed. 

            A list of UIDs are passed back to the client. The client can decide to query the server for the actual note contents, or do something else with the UID information.
        */

        return async function runQuery(query_string, container) {

            var results = [];

            if (!query_string)
                return results;

            if (UID.stringIsUID(query_string + ""))
                return [SERVER_getNoteFromUID(query_string)];

            if (Array.isArray(query_string)) {
                for (const item of query_string)
                    results = results.concat(await runQuery(item));
                return results;
            }

            /************************************* UTILIZING QUERY SYNTAX *********************************************/
            var query;
            try {
                query = parser$1(whind(query_string + ""));
            } catch (e) {
                console.error(e);
                return [];
            }

            const uids = container.query(query.container.containers || default_container);

            for (const uid of uids)
                results.push(...await SERVER_getNotesFromContainer(uid));

            if (query.container && query.container.id) {

                const id = query.container.id;

                results = results.filter(note => parseId(id, container.getNoteID(note.id)));
            }

            if (!results || results.length == 0)
                return [];

            if (query.filter)
                results = filter(query.filter, results);

            if (query.sort)
                results = sort(query.sort, results);

            return results;
        }
    }

    /*
        This Module is responsible for creating lookup and comparison tables for 
        the container syntax of the note system. Container syntax follows a classical
        direcotory structure form, where note is in a location denoted by /dir/dir/../note id.

        The return value of container is a key which represents the bucket | dir | container
        with which the server should store the note. This value is determined by criteria
        such as the number of containers, the number of notes per container, the uniquiness of a particalar
        notes container specifier. 
    */

    function getContainerPortion(id_string, delimeter = "/") {
        const
            string = id_string.toString().trim(),
            val = (string[0] == delimeter ? string : delimeter + string).lastIndexOf(delimeter);

        return string.slice(0, val > -1 && val || 0);
    }

    function getNoteID(id_string, delimeter = "/") {
        const
            string = id_string.toString().trim();

        return string.slice(string.lastIndexOf(delimeter) + 1);
    }

    function getContainerArray(id_string, delimeter = "/") {
        return id_string.trim().split(delimeter);
    }

    function getOrCreateContainerEntry(container_entry, array, index = 1) {

        if (array.length == index)
            return container_entry;

        return getOrCreateContainerEntry(
            container_entry.getContainer(array[index]),
            array,
            index + 1
        );
    }

    class ContainerEntry {

        constructor(id = "", full_name = "") {
            this._ctr_ = null;
            this.id = id + "";
            this.full_name = `${full_name}${this.id}/`;
            this.uid = new UID;
        }

        getContainer(id) {
            if (this.containers.has(id))
                return this._ctr_.get(id);

            const val = new ContainerEntry(id, this.full_name);

            return (this._ctr_.set(id, val), val);
        }

        get containers() {
            if (!this._ctr_)
                this._ctr_ = new Map;
            return this._ctr_;
        }
    }

    function getAll(container, out = []) {
        for (const c of container.values()) {
            out.push(c.uid.string);
            getAll(c, out);
        }
        return out;
    }

    class Container {

        constructor(delimeter = "/") {
            this.root = new ContainerEntry();
        }

        /** Build Or Rebuild Container Index */
        build() {}

        change(old_id, new_id = "", delimeter = "/") {
            //No change on notes with same id
            if (old_id === new_id || !new_id)
                return this.get(old_id);

            if (!new_id)
                return { id: null, val: new_id };

            const { uid, val } = this.get(new_id, delimeter), { uid: old_uid_out, val: old_val } = this.get(old_id, delimeter);

            return { uid, val, old_val, old_uid_out };
        }

        getAll() {
            return getAll(this.root);
        }

        get(id, delimeter = "/") {
            if (id[0] !== delimeter)
                id = delimeter + id;

            const array = getContainerArray(getContainerPortion(id + "", delimeter + ""), delimeter + "");

            var { full_name: val, uid } = getOrCreateContainerEntry(this.root, array);

            return { uid, val };
        }

        query(container_query) {

            const out = [];

            parseContainer$1(container_query, this.root, out);

            return out;
        }

        getContainerID(id) {
            return getContainerPortion(id);
        }

        getNoteID(id) {
            return getNoteID(id);
        }
    }

    function parseContainer$1(identifiers, ContainerEntry, output = [], idI = 1, FOLLOWING_WILD_CARD = false) {

        if (!identifiers || idI == identifiers.length) {

            if (FOLLOWING_WILD_CARD && ContainerEntry._ctr_)
                for (const ctr of ContainerEntry._ctr_.values())
                    parseContainer$1(identifiers, ctr, output, idI, true);

            return output.push(ContainerEntry.uid);
        }

        var offset = 0;

        const
            identifier = identifiers[idI].ids,
            HAS_SUB_CONTAINERS = !!ContainerEntry._ctr_;

        if (identifier[0] == "*" && identifier.length == 1) {

            if (identifiers.length == idI + 1)
                output.push(ContainerEntry.uid);

            if (HAS_SUB_CONTAINERS)
                for (const ctr of ContainerEntry._ctr_.values())
                    parseContainer$1(identifiers, ctr, output, idI + 1, true);

        } else if (HAS_SUB_CONTAINERS) {
            for (const ctnr of ContainerEntry._ctr_.values()) {

                const string = ctnr.id;

                if ((offset = matchString$1(identifier, string)) >= 0) {

                    if (offset != string.length) continue;

                    parseContainer$1(identifiers, ctnr, output, idI + 1);

                    continue
                } else if (FOLLOWING_WILD_CARD)
                    parseContainer$1(identifiers, ctnr, output, idI, true);
            }
        }
    }

    const fsp = fs.promises;
    var log = "";

    const writeError = e => log += e;
    const warn = e => {};

    function Server(delimeter = "/") {

        let watcher = null,
            file_path = "",
            READ_BLOCK = false;

        var
            uid_store = new Map,
            container_store = new Map,
            container = new Container;

        function getContainer(uid) {

            const id = uid + "";

            if (!container_store.has(id))
                container_store.set(id, new Map);

            return container_store.get(id);
        }

        /* Writes data to the stored file */
        async function write() {

            if (file_path) {

                const out = { data: [] };

                for (const note_store of container_store.values())
                    for (const note of note_store.values())
                        out.data.push(note);

                READ_BLOCK = true;

                try {
                    await fsp.writeFile(file_path, JSON.stringify(out), "utf8");
                } catch (e) {
                    writeError(e);
                }
                READ_BLOCK = false;
            }

            return false;
        }

        /* Read data from file into store */
        async function read(fp = file_path) {

            if (
                /*Prevent reading file that has just been updated from this server.*/
                READ_BLOCK ||
                !fp
            )
                return;

            let data = "",
                STATUS = false;

            await fsp.readFile(fp, "utf8")
                .then((d) => (STATUS = true, data = d))
                .catch(writeError);
            // Create new storage systems.
            container_store = new Map;
            uid_store = new Map;
            container = new Container;

            try {
                if (STATUS) {

                    if (data) {

                        const json = JSON.parse(data);

                        if (json.data)
                            for (const note of json.data) {
                                if (note.uid) {
                                    getContainer(container.get(note.id).uid).set(note.uid, note);

                                    uid_store.set(note.uid, note.id);
                                }
                            }
                    }
                }

                if (data)
                    STATUS = updateDB(data);

            } catch (e) {
                writeError(e);
                STATUS = false;
            }

            return STATUS;
        }


        /* Updates store with data from json_String */
        function updateDB(json_data_string) {
            try {

                const json = JSON.parse(json_data_string);

                if (json.data)
                    for (const note of json.data)
                        if (note.uid)
                            container_store.set(note.uid, note);
                return true;
            } catch (e) {
                writeError(e);
            }
            return false
        }

        function noteFromID(uid) {

            const id = uid_store.get(uid + "");

            if (!id) return null;

            return getContainer(container.get(id, delimeter).uid).get(uid) || null;
        }

        const queryRunner = QueryEngine({
                getNotesFromContainer: container_uid => [...getContainer(container_uid).values()],
                getNoteFromUID: note_uid => noteFromID(note_uid)
            },
            false
        );

        return new(class Server {

            get type() {
                return "JSONDB"
            }

            /* 
                Connects the server to the given json file. If file does not exist than an attempt is made to create it.
                This will return false if the connection cannot be made
                in cases were the file cannot be accessed, or the data
                within the file cannot be parsed as JSON data. 
                return true otherwise
            */
            async connect(json_file_path) {

                let result = false;

                const temp = path.resolve(process.env.PWD, json_file_path);

                if (await read(temp)) {
                    file_path = temp;
                    result = true;
                } else {
                    try {
                        await fsp.writeFile(temp, "");
                        file_path = temp;
                        result = true;
                    } catch (e) { writeError(e); }
                }
                if (result) {
                    if (watcher)
                        watcher.close();

                    watcher = fs.watch(file_path, { encoding: "utf8" }, (event, data) => {
                        if (event == "change")
                            read();
                    });
                }
                return result;
            }

            /* Stores new note or updates existing note with new values */
            async storeNote(note) {

                var stored_note = null;

                const
                    uid = note.uid.string,
                    modifed_time = Date.now() | 0;

                if (uid_store.has(uid))
                    stored_note = noteFromID(uid_store.get(uid));
                else
                    stored_note = {
                        id: note.id,
                        created: note.created
                    };

                const old_id = stored_note.id;

                stored_note.modifed = modifed_time;
                stored_note.uid = uid;
                stored_note.body = note.body;
                stored_note.id = note.id;
                stored_note.tags = note.tags;
                stored_note.query_data = `${note.id.split(".").pop()} ${note.tags.join(";")} ${note.body}`;

                uid_store.set(uid, note.id);

                getContainer(container.change(old_id, note.id, delimeter).uid).set(uid, stored_note);

                await write();

                return true;
            }

            removeNote(uid) {}

            async query(query_string) {
                await read(); //Hack - mack sure store is up to date;
                return await queryRunner(query_string, container)
            }

            /* 
                Deletes all data in container_store. 
                Returns a function that returns a function that actually does the clearing.
                Example server.implode()()();
                This is deliberate to force dev to use this intentionally.
             */
            implode() {
                file_path && warn("Warning: Calling the return value can lead to bad things!");
                return () => (file_path && warn(`Calling this return value WILL delete ${file_path}`),
                    async () => {

                        container_store = new Map;
                        uid_store = new Map;
                        container = new Container;

                        try {
                            if (file_path)
                                await fsp.unlink(file_path).catch(e => {});
                        } catch (e) {

                        }

                        file_path = "";
                    })
            }
        })
    }

    function graze_json_server_constructor() {
        if (new.target);
        return Server();
    }

    const server = {
    	json : graze_json_server_constructor
    };

    exports.graze = Graze;
    exports.server = server;

    return exports;

}({}, require("worker_threads"), require("fs"), require("path")));
