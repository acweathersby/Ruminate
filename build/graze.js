var graze_objects = (function (exports, fs, path) {
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
                                strings.push("\n " + await note.render(handler, new Set(set)));
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

            if (results) {

                return new NoteContainer(
                    ...results.map(
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
                )
            }

            return null;
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
            } else if (!Array.isArray(note_tags) || note_tags.reduce((r, v) => typeof v !== "string" || r, false))
                throw ("note_tags  argument must be string of comma seperated values or a an array of strings.");

            if (typeof body !== "string")
                throw new Error("body argument must be a string value");

            if (!(uid instanceof UID))
                throw new Error("uid argument must be a UID instance");

            const creation_date = (Date.now() / 1000) | 0;

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
                typeof server.retrieveNote == "function" &&
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
        symbols$1 = ["&&","||",":"],

        /* Goto lookup maps */
        gt0$1 = [0,-1,1,2,-1,3,-5,5,-1,6,8,7],
    gt1$1 = [0,-5,18,19,20,21,23,27,26,6,8,7],
    gt2$1 = [0,-12,28,8,7],
    gt3$1 = [0,-14,29],
    gt4$1 = [0,-5,30,19,20,21,23,27,26,6,8,7],
    gt5$1 = [0,-5,39,19,20,21,23,27,26,6,8,7],
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
        sm0$1=[0,1,-1,2,-1,3,4,5,6,7,0,-3,8,-1,9,-13,10],
    sm1$1=[0,11,-3,0,-4,0],
    sm2$1=[0,12,-3,0,-4,0],
    sm3$1=[0,13,-3,0,-4,0,-5,14],
    sm4$1=[0,15,-1,2,-1,3,4,5,6,7,0,-3,8,-10,16,-1,17,18,-1,10],
    sm5$1=[0,19,-1,2,-1,3,4,5,6,7,0,-3,8,-1,19,-13,10],
    sm6$1=[0,20,-1,20,-1,20,20,20,20,20,0,-3,20,-1,20,20,20,20,20,20,20,20,20,-1,20,20,20,-1,20],
    sm7$1=[0,21,-1,21,-1,21,21,21,21,21,0,-3,21,-1,21,21,21,21,21,21,21,21,21,-1,21,21,21,-1,21],
    sm8$1=[0,22,-1,22,-1,22,22,22,22,22,0,-3,22,-1,22,22,22,22,22,22,22,22,22,-1,22,22,22,-1,22],
    sm9$1=[0,-2,2,-1,0,4,5,6,7,0,-3,8],
    sm10$1=[0,23,-1,2,-1,3,4,5,6,7,0,-3,8,-10,16,-1,17,18,-1,10],
    sm11$1=[0,24,-3,0,-4,0],
    sm12$1=[0,25,-3,0,-4,0,-15,25],
    sm13$1=[0,26,-3,0,-4,0,-6,27,28,29,30,-5,26],
    sm14$1=[0,31,-3,0,-4,0,-6,31,31,31,31,32,33,34,35,-1,31],
    sm15$1=[0,-2,2,-1,3,4,5,6,7,0,-3,8,-10,16,-1,17,18,-1,10],
    sm16$1=[0,36,-3,0,-4,0,-6,36,36,36,36,36,36,36,36,-1,36],
    sm17$1=[0,-2,2,-1,3,4,5,6,7,0,-3,8,-15,10],
    sm18$1=[0,37,-3,0,-4,0,-6,37,37,37,37,37,37,37,37,-1,37],
    sm19$1=[0,38,-1,2,-1,3,4,5,6,7,0,-3,8,-2,38,38,38,38,38,38,38,38,-1,38,38,38,-1,10],
    sm20$1=[0,39,-1,39,-1,39,39,39,39,39,0,-3,39,-1,39,39,39,39,39,39,39,39,39,-1,39,39,39,-1,39],
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
        lu$1 = new Map([[1,1],[2,2],[4,3],[8,4],[16,5],[32,6],[64,7],[128,8],[256,9],[512,10],[3,11],[264,11],[200,13],[201,14],[":",15],["&&",16],["AND",17],["And",18],["and",19],["||",20],["OR",21],["Or",22],["or",23],["(",24],[")",25],["\"",26],["'",27],[null,5],["\\",29]]),

        //Reverse Symbol Lookup map
        rlu$1 = new Map([[1,1],[2,2],[3,4],[4,8],[5,16],[6,32],[7,64],[8,128],[9,256],[10,512],[11,3],[11,264],[13,200],[14,201],[15,":"],[16,"&&"],[17,"AND"],[18,"And"],[19,"and"],[20,"||"],[21,"OR"],[22,"Or"],[23,"or"],[24,"("],[25,")"],[26,"\""],[27,"'"],[5,null],[29,"\\"]]),

        // States 
        state$1 = [sm0$1,
    sm1$1,
    sm2$1,
    sm3$1,
    sm4$1,
    sm5$1,
    sm6$1,
    sm7$1,
    sm7$1,
    sm7$1,
    sm8$1,
    sm8$1,
    sm8$1,
    sm8$1,
    sm8$1,
    sm8$1,
    sm9$1,
    sm10$1,
    sm11$1,
    sm12$1,
    sm13$1,
    sm14$1,
    sm15$1,
    sm16$1,
    sm17$1,
    sm17$1,
    sm18$1,
    sm19$1,
    sm20$1,
    sm21,
    sm22,
    sm15$1,
    sm15$1,
    sm15$1,
    sm15$1,
    sm15$1,
    sm15$1,
    sm15$1,
    sm15$1,
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

        max$1 = Math.max, min$1 = Math.min,

        //Error Functions
        e$2 = (tk,r,o,l,p)=>{if(l.END)l.throw("Unexpected end of input");else if(l.ty & (264)) l.throw(`Unexpected space character within input "${p.slice(l)}" `) ; else l.throw(`Unexpected token ${l.tx}" `);}, 
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
    e$2],

        //Empty Function
        nf$1 = ()=>-1, 

        //Environment Functions
        
    redv$1 = (ret, fn, plen, ln, t, e, o, l, s) => {        ln = max$1(o.length - plen, 0);        const slice = o.slice(-plen);        o.length = ln + 1;        o[ln] = fn(slice, e, l, s, o, plen);        return ret;    },
    rednv$1 = (ret, Fn, plen, ln, t, e, o, l, s) => {        ln = max$1(o.length - plen, 0);        const slice = o.slice(-plen);        o.length = ln + 1;        o[ln] = new Fn(slice, e, l, s, o, plen);        return ret;    },
    redn$1 = (ret, plen, t, e, o) => {        if (plen > 0) {            let ln = max$1(o.length - plen, 0);            o[ln] = o[o.length - 1];            o.length = ln + 1;        }        return ret;    },
    shftf$1 = (ret, fn, t, e, o, l, s) => (fn(o, e, l, s), ret),
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
        lsm$1 = (index, map) => {    if (map[0] == 0xFFFFFFFF) return map[index + 1];    for (let i = 1, ind = 0, l = map.length, n = 0; i < l && ind <= index; i++) {        if (ind !== index) {            if ((n = map[i]) > -1) ind++;            else ind += -n;        } else return map[i];    }    return -1;},

        //State Action Functions
        state_funct$1 = [(...v)=>(redn$1(1027,0,...v)),
    e=>42,
    e=>38,
    e=>62,
    e=>58,
    e=>54,
    e=>50,
    e=>46,
    e=>18,
    e=>66,
    (...v)=>redn$1(5,1,...v),
    (...v)=>redn$1(1031,1,...v),
    (...v)=>rednv$1(2055,C20_query_body,1,0,...v),
    e=>70,
    (...v)=>rednv$1(2055,C23_query_body,1,0,...v),
    e=>90,
    e=>98,
    e=>102,
    (...v)=>rednv$1(4103,C40_container_object,1,0,...v),
    (...v)=>redv$1(10247,R31_string_data_val_list,1,0,...v),
    (...v)=>redn$1(12295,1,...v),
    (...v)=>redn$1(14343,1,...v),
    (...v)=>rednv$1(2059,C20_query_body,2,0,...v),
    (...v)=>rednv$1(2059,C22_query_body,2,0,...v),
    (...v)=>redn$1(5127,1,...v),
    (...v)=>redn$1(6151,1,...v),
    e=>126,
    e=>130,
    e=>134,
    e=>138,
    (...v)=>redn$1(7175,1,...v),
    e=>142,
    e=>146,
    e=>150,
    e=>154,
    (...v)=>rednv$1(8199,C81_wrapped_expression,1,0,...v),
    (...v)=>redn$1(9223,1,...v),
    (...v)=>redn$1(11271,1,...v),
    (...v)=>redv$1(10251,R30_string_data_val_list,2,0,...v),
    (...v)=>redv$1(13323,R80_wrapped_expression,2,0,...v),
    (...v)=>rednv$1(2063,C21_query_body,3,0,...v),
    e=>202,
    e=>206,
    e=>210,
    (...v)=>rednv$1(6159,C60_and_expression,3,0,...v),
    (...v)=>rednv$1(7183,C70_or_expression,3,0,...v),
    (...v)=>redv$1(8207,R80_wrapped_expression,3,0,...v),
    (...v)=>redv$1(9231,R80_wrapped_expression,3,0,...v)],

        //Goto Lookup Functions
        goto$1 = [v=>lsm$1(v,gt0$1),
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt1$1),
    v=>lsm$1(v,gt2$1),
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
    v=>lsm$1(v,gt3$1),
    v=>lsm$1(v,gt4$1),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt5$1),
    nf$1,
    v=>lsm$1(v,gt6),
    v=>lsm$1(v,gt7),
    nf$1,
    v=>lsm$1(v,gt2$1),
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt8),
    v=>lsm$1(v,gt9),
    v=>lsm$1(v,gt10),
    v=>lsm$1(v,gt11),
    v=>lsm$1(v,gt12),
    v=>lsm$1(v,gt13),
    v=>lsm$1(v,gt14),
    v=>lsm$1(v,gt15),
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

        const recovery_chain = [];

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

    const fsp = fs.promises;
    var log = "";
    const writeError = e => log += e;

    const warn = e => {};
    //const warn = e=>console.trace(e);

    /* Returns a Boolean value indicating whether the note's data matches the query */
    function matchQuery(query_object, note) {
        switch (query_object.type) {
            case "AND":
                return matchQuery(query_object.left, note) && matchQuery(query_object.right, note)
            case "OR":
                return matchQuery(query_object.left, note) || matchQuery(query_object.right, note)
            case "MATCH":
                return note.query_data.includes(query_object.value);
        }
    }

    function Server(store, file_path = "") {
        let watcher = null,
            READ_BLOCK = false;
        /* Writes data to the stored file */
        async function write() {
            if (file_path) {

                const out = { data: [] };

                for (const note of store.values())
                    out.data.push(note);
                //console.log("ASASDAD - write", file_path, JSON.stringify(out));

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

            store = new Map();

            try {
                if (STATUS) {


                    if (data) {
                        const json = JSON.parse(data);

                        if (json.data) {
                            for (const note of json.data)
                                if (note.uid)
                                    store.set(note.uid, note);
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
                //  console.log("ASDAD", json_data_string)

                const json = JSON.parse(json_data_string);

                if (json.data)
                    for (const note of json.data)
                        if (note.uid)
                            store.set(note.uid, note);
                return true;
            } catch (e) {
                writeError(e);
            }
            return false
        }

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
                    modifed_time = (Date.now() / 1000) | 0;

                if (store.has(uid))
                    stored_note = store.get(uid);
                else
                    stored_note = {
                        created: note.created
                    };
                stored_note.modifed = modifed_time;
                stored_note.uid = uid;
                stored_note.body = note.body;
                stored_note.id = note.id;
                stored_note.tags = note.tags;
                stored_note.query_data = `${note.id.split(".").pop()} ${note.tags.join(";")} ${note.body}}`;


                store.set(uid, stored_note);

                await write();

                return true;
            }

            removeNote(uid) {}

            retrieveNote() {}

            async query(query) {

                await read(); //Hack - mack sure store is up to date;

                try {
                    if (typeof query == "string" && query.length > 0)
                        query = parser$1(whind(query));
                } catch (e) {
                    return [];
                }

                var container = "",
                    id = "",
                    query_object = query.query;

                if (query.container) 
                    id = query.container.data.trim();

                const out = [];

                if (UID.stringIsUID(id))
                    return [store.get(id)];

                if (Array.isArray(id)) {
                    for (let item of id)
                        if (item = this.query(item))
                            out.push(...item);

                    return out;
                }

                //Generate query engine and run against the data set.
                const temps = [];
                //Brute force search of ids
                if (id) {
                    const parts = id.split(".");

                    for (const note of store.values()) {

                        const note_parts = note.id.split(".");

                        for (let i = 0; i < parts.length; i++) {
                            if (
                                i == parts.length - 1
                            ) {
                                if (
                                    parts[i] == "*" || (
                                        i == note_parts.length - 1 &&
                                        (!parts[i] || parts[i] == note_parts[i])
                                    )
                                ) {
                                    temps.push(note);
                                    break;
                                }
                            } else if (note_parts[i] != parts[i]) {
                                break
                            }
                        }
                    }
                }

                return query_object ?
                    temps.filter(note => matchQuery(query_object, note)) :
                    temps;
            }

            /* 
            	Deletes all data in store. 
            	Returns a function that returns a function that actually does the clearing.
            	Example server.implode()()();
            	This is deliberate to force dev to use this intentionally.
             */
            implode() {
                file_path && warn("Warning: Calling the return value can lead to bad things!");
                return () => (file_path && warn(`Calling this return value WILL delete ${file_path}`),
                    async () => {
                        store = new Map();

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
        if (new.target)
            return Server(new Map());
        return Server(new Map());
    }

    const server = {
    	json : graze_json_server_constructor
    };

    exports.graze = Graze;
    exports.server = server;

    return exports;

}({}, require("fs"), require("path")));
