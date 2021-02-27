var ruminate_objects = (function (exports, fs, path) {
    'use strict';

    fs = fs && fs.hasOwnProperty('default') ? fs['default'] : fs;
    path = path && path.hasOwnProperty('default') ? path['default'] : path;

    /* TODO - Make sure UID algorithm generates effectivly unique IDs */
    class UID extends ArrayBuffer {

        static isUID(candidate, temp) {
            return (
                (candidate instanceof UID)
                || (
                    (typeof candidate == "string")
                    && (temp = (candidate.match(/[a-f\d]{12}\-[a-f\d]{4}\-[a-f\d]{8}\-[a-f\d]{8}/)))
                    && temp[0] == candidate
                )
            )
        }

        constructor(string_val) {

            super(16);

            const dv = new DataView(this);

            if (string_val instanceof UID) {
                const dv2 = new DataView(string_val);
                dv.setBigUint64(0, dv2.getBigUint64(0));
                dv.setBigUint64(8, dv2.getBigUint64(8));
            } else if (string_val && typeof string_val == "string") {
                string_val
                    .replace(/\-/g, "")
                    .split("")
                    .reduce((r, v, i) => (i % 2 ? r[i >> 1] += v : r.push(v), r), [])
                    .map((v, i) => dv.setUint8(i, parseInt(v, 16)));
            } else {
                dv.setBigUint64(0, BigInt((new Date).valueOf()));

                //Shift over by 2 bytes [16 bits] for a 48bit date string;
                for (var i = 0; i < 3; i++)
                    dv.setUint16(i << 1, dv.getUint16((i << 1) + 2));

                dv.setUint16(6, Math.random() * 0xFFFFFFFF);
                dv.setUint32(8, Math.random() * 0xFFFFFFFF);
                dv.setUint32(12, Math.random() * 0xFFFFFFFF);
            }
        }

        frozenClone() { return (new UID(this)).freeze(uid); }

        toString() { return this.string; }

        set string(e) { /*empty*/ }

        /** Returns a string representation of the UID */
        get string() {
            const dv = new DataView(this);
            return (
                "" + ("0000" + dv.getUint16(0).toString(16)).slice(-4) +
                "" + ("0000" + dv.getUint16(2).toString(16)).slice(-4) +
                "" + ("0000" + dv.getUint16(4).toString(16)).slice(-4) +
                "-" + ("0000" + dv.getUint16(6).toString(16)).slice(-4) +
                "-" + ("00000000" + dv.getUint32(8).toString(16)).slice(-8) +
                "-" + ("00000000" + dv.getUint32(12).toString(16)).slice(-8)
            )
        }

        set length(e) { /*empty*/ }

        get length() { return 16; }

        set date_created(e) { /*empty*/ }

        get date_created() {
            return new Date(
                Number(
                    BigInt.asUintN(
                        64,
                        (new DataView(this)).getBigUint64(0)
                    ) >> 16n
                )
            );
        }
    }

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
    const e = 101;
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

    const observer_mixin_symbol = Symbol("observer_mixin_symbol");

    const observer_mixin = function(calling_name, prototype) {

        const observer_identifier = Symbol("observer_array_reference");

        prototype[observer_mixin_symbol] = observer_identifier;

        //Adds an observer to the object instance. Applies a property to the observer that references the object instance.
        //Creates new observers array if one does not already exist.
        prototype.addObserver = function(...observer_list) {
            let observers = this[observer_identifier];

            if (!observers)
                observers = this[observer_identifier] = [];

            for (const observer of observer_list) {

                if (observer[observer_identifier] == this)
                    return

                if (observer[observer_identifier])
                    observer[observer_identifier].removeObserver(observer);

                observers.push(observer);

                observer[observer_identifier] = this;
            }
        };

        //Removes an observer from the object instance. 
        prototype.removeObserver = function(...observer_list) {

            const observers = this[observer_identifier];

            for (const observer of observer_list)
                for (let i = 0, l = observers.length; i < l; i++)
                    if (observers[i] == observer) return (observer[observer_identifier] = null, observers.splice(i, 1));

        };


        prototype.updateObservers = function() {
            const observers = this[observer_identifier];

            if (observers)
                observers.forEach(obj => obj[calling_name](this));
        };
    };

    //Properly destructs this observers object on the object instance.
    observer_mixin.destroy = function(observer_mixin_instance) {

        const symbol = observer_mixin_instance.constructor.prototype[observer_mixin_symbol];

        if (symbol) {
            if (observer_mixin_instance[symbol])
                observer_mixin_instance[symbol].forEach(observer=>observer[symbol] = null);

            observer_mixin_instance[symbol].length = 0;
            
            observer_mixin_instance[symbol] = null;
        }
    };

    observer_mixin.mixin_symbol = observer_mixin_symbol;

    Object.freeze(observer_mixin);

    function Diff() {}
    Diff.prototype = {
      diff: function diff(oldString, newString) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        var callback = options.callback;

        if (typeof options === 'function') {
          callback = options;
          options = {};
        }

        this.options = options;
        var self = this;

        function done(value) {
          if (callback) {
            setTimeout(function () {
              callback(undefined, value);
            }, 0);
            return true;
          } else {
            return value;
          }
        } // Allow subclasses to massage the input prior to running


        oldString = this.castInput(oldString);
        newString = this.castInput(newString);
        oldString = this.removeEmpty(this.tokenize(oldString));
        newString = this.removeEmpty(this.tokenize(newString));
        var newLen = newString.length,
            oldLen = oldString.length;
        var editLength = 1;
        var maxEditLength = newLen + oldLen;
        var bestPath = [{
          newPos: -1,
          components: []
        }]; // Seed editLength = 0, i.e. the content starts with the same values

        var oldPos = this.extractCommon(bestPath[0], newString, oldString, 0);

        if (bestPath[0].newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
          // Identity per the equality and tokenizer
          return done([{
            value: this.join(newString),
            count: newString.length
          }]);
        } // Main worker method. checks all permutations of a given edit length for acceptance.


        function execEditLength() {
          for (var diagonalPath = -1 * editLength; diagonalPath <= editLength; diagonalPath += 2) {
            var basePath = void 0;

            var addPath = bestPath[diagonalPath - 1],
                removePath = bestPath[diagonalPath + 1],
                _oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;

            if (addPath) {
              // No one else is going to attempt to use this value, clear it
              bestPath[diagonalPath - 1] = undefined;
            }

            var canAdd = addPath && addPath.newPos + 1 < newLen,
                canRemove = removePath && 0 <= _oldPos && _oldPos < oldLen;

            if (!canAdd && !canRemove) {
              // If this path is a terminal then prune
              bestPath[diagonalPath] = undefined;
              continue;
            } // Select the diagonal that we want to branch from. We select the prior
            // path whose position in the new string is the farthest from the origin
            // and does not pass the bounds of the diff graph


            if (!canAdd || canRemove && addPath.newPos < removePath.newPos) {
              basePath = clonePath(removePath);
              self.pushComponent(basePath.components, undefined, true);
            } else {
              basePath = addPath; // No need to clone, we've pulled it from the list

              basePath.newPos++;
              self.pushComponent(basePath.components, true, undefined);
            }

            _oldPos = self.extractCommon(basePath, newString, oldString, diagonalPath); // If we have hit the end of both strings, then we are done

            if (basePath.newPos + 1 >= newLen && _oldPos + 1 >= oldLen) {
              return done(buildValues(self, basePath.components, newString, oldString, self.useLongestToken));
            } else {
              // Otherwise track this path as a potential candidate and continue.
              bestPath[diagonalPath] = basePath;
            }
          }

          editLength++;
        } // Performs the length of edit iteration. Is a bit fugly as this has to support the
        // sync and async mode which is never fun. Loops over execEditLength until a value
        // is produced.


        if (callback) {
          (function exec() {
            setTimeout(function () {
              // This should not happen, but we want to be safe.

              /* istanbul ignore next */
              if (editLength > maxEditLength) {
                return callback();
              }

              if (!execEditLength()) {
                exec();
              }
            }, 0);
          })();
        } else {
          while (editLength <= maxEditLength) {
            var ret = execEditLength();

            if (ret) {
              return ret;
            }
          }
        }
      },
      pushComponent: function pushComponent(components, added, removed) {
        var last = components[components.length - 1];

        if (last && last.added === added && last.removed === removed) {
          // We need to clone here as the component clone operation is just
          // as shallow array clone
          components[components.length - 1] = {
            count: last.count + 1,
            added: added,
            removed: removed
          };
        } else {
          components.push({
            count: 1,
            added: added,
            removed: removed
          });
        }
      },
      extractCommon: function extractCommon(basePath, newString, oldString, diagonalPath) {
        var newLen = newString.length,
            oldLen = oldString.length,
            newPos = basePath.newPos,
            oldPos = newPos - diagonalPath,
            commonCount = 0;

        while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(newString[newPos + 1], oldString[oldPos + 1])) {
          newPos++;
          oldPos++;
          commonCount++;
        }

        if (commonCount) {
          basePath.components.push({
            count: commonCount
          });
        }

        basePath.newPos = newPos;
        return oldPos;
      },
      equals: function equals(left, right) {
        if (this.options.comparator) {
          return this.options.comparator(left, right);
        } else {
          return left === right || this.options.ignoreCase && left.toLowerCase() === right.toLowerCase();
        }
      },
      removeEmpty: function removeEmpty(array) {
        var ret = [];

        for (var i = 0; i < array.length; i++) {
          if (array[i]) {
            ret.push(array[i]);
          }
        }

        return ret;
      },
      castInput: function castInput(value) {
        return value;
      },
      tokenize: function tokenize(value) {
        return value.split('');
      },
      join: function join(chars) {
        return chars.join('');
      }
    };

    function buildValues(diff, components, newString, oldString, useLongestToken) {
      var componentPos = 0,
          componentLen = components.length,
          newPos = 0,
          oldPos = 0;

      for (; componentPos < componentLen; componentPos++) {
        var component = components[componentPos];

        if (!component.removed) {
          if (!component.added && useLongestToken) {
            var value = newString.slice(newPos, newPos + component.count);
            value = value.map(function (value, i) {
              var oldValue = oldString[oldPos + i];
              return oldValue.length > value.length ? oldValue : value;
            });
            component.value = diff.join(value);
          } else {
            component.value = diff.join(newString.slice(newPos, newPos + component.count));
          }

          newPos += component.count; // Common case

          if (!component.added) {
            oldPos += component.count;
          }
        } else {
          component.value = diff.join(oldString.slice(oldPos, oldPos + component.count));
          oldPos += component.count; // Reverse add and remove so removes are output first to match common convention
          // The diffing algorithm is tied to add then remove output and this is the simplest
          // route to get the desired output with minimal overhead.

          if (componentPos && components[componentPos - 1].added) {
            var tmp = components[componentPos - 1];
            components[componentPos - 1] = components[componentPos];
            components[componentPos] = tmp;
          }
        }
      } // Special case handle for when one terminal is ignored (i.e. whitespace).
      // For this case we merge the terminal into the prior string and drop the change.
      // This is only available for string mode.


      var lastComponent = components[componentLen - 1];

      if (componentLen > 1 && typeof lastComponent.value === 'string' && (lastComponent.added || lastComponent.removed) && diff.equals('', lastComponent.value)) {
        components[componentLen - 2].value += lastComponent.value;
        components.pop();
      }

      return components;
    }

    function clonePath(path) {
      return {
        newPos: path.newPos,
        components: path.components.slice(0)
      };
    }

    var characterDiff = new Diff();
    function diffChars(oldStr, newStr, options) {
      return characterDiff.diff(oldStr, newStr, options);
    }

    function generateOptions(options, defaults) {
      if (typeof options === 'function') {
        defaults.callback = options;
      } else if (options) {
        for (var name in options) {
          /* istanbul ignore else */
          if (options.hasOwnProperty(name)) {
            defaults[name] = options[name];
          }
        }
      }

      return defaults;
    }

    //
    // Ranges and exceptions:
    // Latin-1 Supplement, 0080–00FF
    //  - U+00D7  × Multiplication sign
    //  - U+00F7  ÷ Division sign
    // Latin Extended-A, 0100–017F
    // Latin Extended-B, 0180–024F
    // IPA Extensions, 0250–02AF
    // Spacing Modifier Letters, 02B0–02FF
    //  - U+02C7  ˇ &#711;  Caron
    //  - U+02D8  ˘ &#728;  Breve
    //  - U+02D9  ˙ &#729;  Dot Above
    //  - U+02DA  ˚ &#730;  Ring Above
    //  - U+02DB  ˛ &#731;  Ogonek
    //  - U+02DC  ˜ &#732;  Small Tilde
    //  - U+02DD  ˝ &#733;  Double Acute Accent
    // Latin Extended Additional, 1E00–1EFF

    var extendedWordChars = /^[A-Za-z\xC0-\u02C6\u02C8-\u02D7\u02DE-\u02FF\u1E00-\u1EFF]+$/;
    var reWhitespace = /\S/;
    var wordDiff = new Diff();

    wordDiff.equals = function (left, right) {
      if (this.options.ignoreCase) {
        left = left.toLowerCase();
        right = right.toLowerCase();
      }

      return left === right || this.options.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right);
    };

    wordDiff.tokenize = function (value) {
      var tokens = value.split(/(\s+|[()[\]{}'"]|\b)/); // Join the boundary splits that we do not consider to be boundaries. This is primarily the extended Latin character set.

      for (var i = 0; i < tokens.length - 1; i++) {
        // If we have an empty string in the next field and we have only word chars before and after, merge
        if (!tokens[i + 1] && tokens[i + 2] && extendedWordChars.test(tokens[i]) && extendedWordChars.test(tokens[i + 2])) {
          tokens[i] += tokens[i + 2];
          tokens.splice(i + 1, 2);
          i--;
        }
      }

      return tokens;
    };

    function diffWords(oldStr, newStr, options) {
      options = generateOptions(options, {
        ignoreWhitespace: true
      });
      return wordDiff.diff(oldStr, newStr, options);
    }
    function diffWordsWithSpace(oldStr, newStr, options) {
      return wordDiff.diff(oldStr, newStr, options);
    }

    var lineDiff = new Diff();

    lineDiff.tokenize = function (value) {
      var retLines = [],
          linesAndNewlines = value.split(/(\n|\r\n)/); // Ignore the final empty token that occurs if the string ends with a new line

      if (!linesAndNewlines[linesAndNewlines.length - 1]) {
        linesAndNewlines.pop();
      } // Merge the content and line separators into single tokens


      for (var i = 0; i < linesAndNewlines.length; i++) {
        var line = linesAndNewlines[i];

        if (i % 2 && !this.options.newlineIsToken) {
          retLines[retLines.length - 1] += line;
        } else {
          if (this.options.ignoreWhitespace) {
            line = line.trim();
          }

          retLines.push(line);
        }
      }

      return retLines;
    };

    function diffLines(oldStr, newStr, callback) {
      return lineDiff.diff(oldStr, newStr, callback);
    }
    function diffTrimmedLines(oldStr, newStr, callback) {
      var options = generateOptions(callback, {
        ignoreWhitespace: true
      });
      return lineDiff.diff(oldStr, newStr, options);
    }

    var sentenceDiff = new Diff();

    sentenceDiff.tokenize = function (value) {
      return value.split(/(\S.+?[.!?])(?=\s+|$)/);
    };

    function diffSentences(oldStr, newStr, callback) {
      return sentenceDiff.diff(oldStr, newStr, callback);
    }

    var cssDiff = new Diff();

    cssDiff.tokenize = function (value) {
      return value.split(/([{}:;,]|\s+)/);
    };

    function diffCss(oldStr, newStr, callback) {
      return cssDiff.diff(oldStr, newStr, callback);
    }

    function _typeof(obj) {
      if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
        _typeof = function (obj) {
          return typeof obj;
        };
      } else {
        _typeof = function (obj) {
          return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
        };
      }

      return _typeof(obj);
    }

    function _toConsumableArray(arr) {
      return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
    }

    function _arrayWithoutHoles(arr) {
      if (Array.isArray(arr)) {
        for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

        return arr2;
      }
    }

    function _iterableToArray(iter) {
      if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
    }

    function _nonIterableSpread() {
      throw new TypeError("Invalid attempt to spread non-iterable instance");
    }

    var objectPrototypeToString = Object.prototype.toString;
    var jsonDiff = new Diff(); // Discriminate between two lines of pretty-printed, serialized JSON where one of them has a
    // dangling comma and the other doesn't. Turns out including the dangling comma yields the nicest output:

    jsonDiff.useLongestToken = true;
    jsonDiff.tokenize = lineDiff.tokenize;

    jsonDiff.castInput = function (value) {
      var _this$options = this.options,
          undefinedReplacement = _this$options.undefinedReplacement,
          _this$options$stringi = _this$options.stringifyReplacer,
          stringifyReplacer = _this$options$stringi === void 0 ? function (k, v) {
        return typeof v === 'undefined' ? undefinedReplacement : v;
      } : _this$options$stringi;
      return typeof value === 'string' ? value : JSON.stringify(canonicalize(value, null, null, stringifyReplacer), stringifyReplacer, '  ');
    };

    jsonDiff.equals = function (left, right) {
      return Diff.prototype.equals.call(jsonDiff, left.replace(/,([\r\n])/g, '$1'), right.replace(/,([\r\n])/g, '$1'));
    };

    function diffJson(oldObj, newObj, options) {
      return jsonDiff.diff(oldObj, newObj, options);
    } // This function handles the presence of circular references by bailing out when encountering an
    // object that is already on the "stack" of items being processed. Accepts an optional replacer

    function canonicalize(obj, stack, replacementStack, replacer, key) {
      stack = stack || [];
      replacementStack = replacementStack || [];

      if (replacer) {
        obj = replacer(key, obj);
      }

      var i;

      for (i = 0; i < stack.length; i += 1) {
        if (stack[i] === obj) {
          return replacementStack[i];
        }
      }

      var canonicalizedObj;

      if ('[object Array]' === objectPrototypeToString.call(obj)) {
        stack.push(obj);
        canonicalizedObj = new Array(obj.length);
        replacementStack.push(canonicalizedObj);

        for (i = 0; i < obj.length; i += 1) {
          canonicalizedObj[i] = canonicalize(obj[i], stack, replacementStack, replacer, key);
        }

        stack.pop();
        replacementStack.pop();
        return canonicalizedObj;
      }

      if (obj && obj.toJSON) {
        obj = obj.toJSON();
      }

      if (_typeof(obj) === 'object' && obj !== null) {
        stack.push(obj);
        canonicalizedObj = {};
        replacementStack.push(canonicalizedObj);

        var sortedKeys = [],
            _key;

        for (_key in obj) {
          /* istanbul ignore else */
          if (obj.hasOwnProperty(_key)) {
            sortedKeys.push(_key);
          }
        }

        sortedKeys.sort();

        for (i = 0; i < sortedKeys.length; i += 1) {
          _key = sortedKeys[i];
          canonicalizedObj[_key] = canonicalize(obj[_key], stack, replacementStack, replacer, _key);
        }

        stack.pop();
        replacementStack.pop();
      } else {
        canonicalizedObj = obj;
      }

      return canonicalizedObj;
    }

    var arrayDiff = new Diff();

    arrayDiff.tokenize = function (value) {
      return value.slice();
    };

    arrayDiff.join = arrayDiff.removeEmpty = function (value) {
      return value;
    };

    function diffArrays(oldArr, newArr, callback) {
      return arrayDiff.diff(oldArr, newArr, callback);
    }

    function parsePatch(uniDiff) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var diffstr = uniDiff.split(/\r\n|[\n\v\f\r\x85]/),
          delimiters = uniDiff.match(/\r\n|[\n\v\f\r\x85]/g) || [],
          list = [],
          i = 0;

      function parseIndex() {
        var index = {};
        list.push(index); // Parse diff metadata

        while (i < diffstr.length) {
          var line = diffstr[i]; // File header found, end parsing diff metadata

          if (/^(\-\-\-|\+\+\+|@@)\s/.test(line)) {
            break;
          } // Diff index


          var header = /^(?:Index:|diff(?: -r \w+)+)\s+(.+?)\s*$/.exec(line);

          if (header) {
            index.index = header[1];
          }

          i++;
        } // Parse file headers if they are defined. Unified diff requires them, but
        // there's no technical issues to have an isolated hunk without file header


        parseFileHeader(index);
        parseFileHeader(index); // Parse hunks

        index.hunks = [];

        while (i < diffstr.length) {
          var _line = diffstr[i];

          if (/^(Index:|diff|\-\-\-|\+\+\+)\s/.test(_line)) {
            break;
          } else if (/^@@/.test(_line)) {
            index.hunks.push(parseHunk());
          } else if (_line && options.strict) {
            // Ignore unexpected content unless in strict mode
            throw new Error('Unknown line ' + (i + 1) + ' ' + JSON.stringify(_line));
          } else {
            i++;
          }
        }
      } // Parses the --- and +++ headers, if none are found, no lines
      // are consumed.


      function parseFileHeader(index) {
        var fileHeader = /^(---|\+\+\+)\s+(.*)$/.exec(diffstr[i]);

        if (fileHeader) {
          var keyPrefix = fileHeader[1] === '---' ? 'old' : 'new';
          var data = fileHeader[2].split('\t', 2);
          var fileName = data[0].replace(/\\\\/g, '\\');

          if (/^".*"$/.test(fileName)) {
            fileName = fileName.substr(1, fileName.length - 2);
          }

          index[keyPrefix + 'FileName'] = fileName;
          index[keyPrefix + 'Header'] = (data[1] || '').trim();
          i++;
        }
      } // Parses a hunk
      // This assumes that we are at the start of a hunk.


      function parseHunk() {
        var chunkHeaderIndex = i,
            chunkHeaderLine = diffstr[i++],
            chunkHeader = chunkHeaderLine.split(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
        var hunk = {
          oldStart: +chunkHeader[1],
          oldLines: +chunkHeader[2] || 1,
          newStart: +chunkHeader[3],
          newLines: +chunkHeader[4] || 1,
          lines: [],
          linedelimiters: []
        };
        var addCount = 0,
            removeCount = 0;

        for (; i < diffstr.length; i++) {
          // Lines starting with '---' could be mistaken for the "remove line" operation
          // But they could be the header for the next file. Therefore prune such cases out.
          if (diffstr[i].indexOf('--- ') === 0 && i + 2 < diffstr.length && diffstr[i + 1].indexOf('+++ ') === 0 && diffstr[i + 2].indexOf('@@') === 0) {
            break;
          }

          var operation = diffstr[i].length == 0 && i != diffstr.length - 1 ? ' ' : diffstr[i][0];

          if (operation === '+' || operation === '-' || operation === ' ' || operation === '\\') {
            hunk.lines.push(diffstr[i]);
            hunk.linedelimiters.push(delimiters[i] || '\n');

            if (operation === '+') {
              addCount++;
            } else if (operation === '-') {
              removeCount++;
            } else if (operation === ' ') {
              addCount++;
              removeCount++;
            }
          } else {
            break;
          }
        } // Handle the empty block count case


        if (!addCount && hunk.newLines === 1) {
          hunk.newLines = 0;
        }

        if (!removeCount && hunk.oldLines === 1) {
          hunk.oldLines = 0;
        } // Perform optional sanity checking


        if (options.strict) {
          if (addCount !== hunk.newLines) {
            throw new Error('Added line count did not match for hunk at line ' + (chunkHeaderIndex + 1));
          }

          if (removeCount !== hunk.oldLines) {
            throw new Error('Removed line count did not match for hunk at line ' + (chunkHeaderIndex + 1));
          }
        }

        return hunk;
      }

      while (i < diffstr.length) {
        parseIndex();
      }

      return list;
    }

    // Iterator that traverses in the range of [min, max], stepping
    // by distance from a given start position. I.e. for [0, 4], with
    // start of 2, this will iterate 2, 3, 1, 4, 0.
    function distanceIterator (start, minLine, maxLine) {
      var wantForward = true,
          backwardExhausted = false,
          forwardExhausted = false,
          localOffset = 1;
      return function iterator() {
        if (wantForward && !forwardExhausted) {
          if (backwardExhausted) {
            localOffset++;
          } else {
            wantForward = false;
          } // Check if trying to fit beyond text length, and if not, check it fits
          // after offset location (or desired location on first iteration)


          if (start + localOffset <= maxLine) {
            return localOffset;
          }

          forwardExhausted = true;
        }

        if (!backwardExhausted) {
          if (!forwardExhausted) {
            wantForward = true;
          } // Check if trying to fit before text beginning, and if not, check it fits
          // before offset location


          if (minLine <= start - localOffset) {
            return -localOffset++;
          }

          backwardExhausted = true;
          return iterator();
        } // We tried to fit hunk before text beginning and beyond text length, then
        // hunk can't fit on the text. Return undefined

      };
    }

    function applyPatch(source, uniDiff) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      if (typeof uniDiff === 'string') {
        uniDiff = parsePatch(uniDiff);
      }

      if (Array.isArray(uniDiff)) {
        if (uniDiff.length > 1) {
          throw new Error('applyPatch only works with a single input.');
        }

        uniDiff = uniDiff[0];
      } // Apply the diff to the input


      var lines = source.split(/\r\n|[\n\v\f\r\x85]/),
          delimiters = source.match(/\r\n|[\n\v\f\r\x85]/g) || [],
          hunks = uniDiff.hunks,
          compareLine = options.compareLine || function (lineNumber, line, operation, patchContent) {
        return line === patchContent;
      },
          errorCount = 0,
          fuzzFactor = options.fuzzFactor || 0,
          minLine = 0,
          offset = 0,
          removeEOFNL,
          addEOFNL;
      /**
       * Checks if the hunk exactly fits on the provided location
       */


      function hunkFits(hunk, toPos) {
        for (var j = 0; j < hunk.lines.length; j++) {
          var line = hunk.lines[j],
              operation = line.length > 0 ? line[0] : ' ',
              content = line.length > 0 ? line.substr(1) : line;

          if (operation === ' ' || operation === '-') {
            // Context sanity check
            if (!compareLine(toPos + 1, lines[toPos], operation, content)) {
              errorCount++;

              if (errorCount > fuzzFactor) {
                return false;
              }
            }

            toPos++;
          }
        }

        return true;
      } // Search best fit offsets for each hunk based on the previous ones


      for (var i = 0; i < hunks.length; i++) {
        var hunk = hunks[i],
            maxLine = lines.length - hunk.oldLines,
            localOffset = 0,
            toPos = offset + hunk.oldStart - 1;
        var iterator = distanceIterator(toPos, minLine, maxLine);

        for (; localOffset !== undefined; localOffset = iterator()) {
          if (hunkFits(hunk, toPos + localOffset)) {
            hunk.offset = offset += localOffset;
            break;
          }
        }

        if (localOffset === undefined) {
          return false;
        } // Set lower text limit to end of the current hunk, so next ones don't try
        // to fit over already patched text


        minLine = hunk.offset + hunk.oldStart + hunk.oldLines;
      } // Apply patch hunks


      var diffOffset = 0;

      for (var _i = 0; _i < hunks.length; _i++) {
        var _hunk = hunks[_i],
            _toPos = _hunk.oldStart + _hunk.offset + diffOffset - 1;

        diffOffset += _hunk.newLines - _hunk.oldLines;

        if (_toPos < 0) {
          // Creating a new file
          _toPos = 0;
        }

        for (var j = 0; j < _hunk.lines.length; j++) {
          var line = _hunk.lines[j],
              operation = line.length > 0 ? line[0] : ' ',
              content = line.length > 0 ? line.substr(1) : line,
              delimiter = _hunk.linedelimiters[j];

          if (operation === ' ') {
            _toPos++;
          } else if (operation === '-') {
            lines.splice(_toPos, 1);
            delimiters.splice(_toPos, 1);
            /* istanbul ignore else */
          } else if (operation === '+') {
            lines.splice(_toPos, 0, content);
            delimiters.splice(_toPos, 0, delimiter);
            _toPos++;
          } else if (operation === '\\') {
            var previousOperation = _hunk.lines[j - 1] ? _hunk.lines[j - 1][0] : null;

            if (previousOperation === '+') {
              removeEOFNL = true;
            } else if (previousOperation === '-') {
              addEOFNL = true;
            }
          }
        }
      } // Handle EOFNL insertion/removal


      if (removeEOFNL) {
        while (!lines[lines.length - 1]) {
          lines.pop();
          delimiters.pop();
        }
      } else if (addEOFNL) {
        lines.push('');
        delimiters.push('\n');
      }

      for (var _k = 0; _k < lines.length - 1; _k++) {
        lines[_k] = lines[_k] + delimiters[_k];
      }

      return lines.join('');
    } // Wrapper that supports multiple file patches via callbacks.

    function applyPatches(uniDiff, options) {
      if (typeof uniDiff === 'string') {
        uniDiff = parsePatch(uniDiff);
      }

      var currentIndex = 0;

      function processIndex() {
        var index = uniDiff[currentIndex++];

        if (!index) {
          return options.complete();
        }

        options.loadFile(index, function (err, data) {
          if (err) {
            return options.complete(err);
          }

          var updatedContent = applyPatch(data, index, options);
          options.patched(index, updatedContent, function (err) {
            if (err) {
              return options.complete(err);
            }

            processIndex();
          });
        });
      }

      processIndex();
    }

    function structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
      if (!options) {
        options = {};
      }

      if (typeof options.context === 'undefined') {
        options.context = 4;
      }

      var diff = diffLines(oldStr, newStr, options);
      diff.push({
        value: '',
        lines: []
      }); // Append an empty value to make cleanup easier

      function contextLines(lines) {
        return lines.map(function (entry) {
          return ' ' + entry;
        });
      }

      var hunks = [];
      var oldRangeStart = 0,
          newRangeStart = 0,
          curRange = [],
          oldLine = 1,
          newLine = 1;

      var _loop = function _loop(i) {
        var current = diff[i],
            lines = current.lines || current.value.replace(/\n$/, '').split('\n');
        current.lines = lines;

        if (current.added || current.removed) {
          var _curRange;

          // If we have previous context, start with that
          if (!oldRangeStart) {
            var prev = diff[i - 1];
            oldRangeStart = oldLine;
            newRangeStart = newLine;

            if (prev) {
              curRange = options.context > 0 ? contextLines(prev.lines.slice(-options.context)) : [];
              oldRangeStart -= curRange.length;
              newRangeStart -= curRange.length;
            }
          } // Output our changes


          (_curRange = curRange).push.apply(_curRange, _toConsumableArray(lines.map(function (entry) {
            return (current.added ? '+' : '-') + entry;
          }))); // Track the updated file position


          if (current.added) {
            newLine += lines.length;
          } else {
            oldLine += lines.length;
          }
        } else {
          // Identical context lines. Track line changes
          if (oldRangeStart) {
            // Close out any changes that have been output (or join overlapping)
            if (lines.length <= options.context * 2 && i < diff.length - 2) {
              var _curRange2;

              // Overlapping
              (_curRange2 = curRange).push.apply(_curRange2, _toConsumableArray(contextLines(lines)));
            } else {
              var _curRange3;

              // end the range and output
              var contextSize = Math.min(lines.length, options.context);

              (_curRange3 = curRange).push.apply(_curRange3, _toConsumableArray(contextLines(lines.slice(0, contextSize))));

              var hunk = {
                oldStart: oldRangeStart,
                oldLines: oldLine - oldRangeStart + contextSize,
                newStart: newRangeStart,
                newLines: newLine - newRangeStart + contextSize,
                lines: curRange
              };

              if (i >= diff.length - 2 && lines.length <= options.context) {
                // EOF is inside this hunk
                var oldEOFNewline = /\n$/.test(oldStr);
                var newEOFNewline = /\n$/.test(newStr);
                var noNlBeforeAdds = lines.length == 0 && curRange.length > hunk.oldLines;

                if (!oldEOFNewline && noNlBeforeAdds) {
                  // special case: old has no eol and no trailing context; no-nl can end up before adds
                  curRange.splice(hunk.oldLines, 0, '\\ No newline at end of file');
                }

                if (!oldEOFNewline && !noNlBeforeAdds || !newEOFNewline) {
                  curRange.push('\\ No newline at end of file');
                }
              }

              hunks.push(hunk);
              oldRangeStart = 0;
              newRangeStart = 0;
              curRange = [];
            }
          }

          oldLine += lines.length;
          newLine += lines.length;
        }
      };

      for (var i = 0; i < diff.length; i++) {
        _loop(i);
      }

      return {
        oldFileName: oldFileName,
        newFileName: newFileName,
        oldHeader: oldHeader,
        newHeader: newHeader,
        hunks: hunks
      };
    }
    function createTwoFilesPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
      var diff = structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options);
      var ret = [];

      if (oldFileName == newFileName) {
        ret.push('Index: ' + oldFileName);
      }

      ret.push('===================================================================');
      ret.push('--- ' + diff.oldFileName + (typeof diff.oldHeader === 'undefined' ? '' : '\t' + diff.oldHeader));
      ret.push('+++ ' + diff.newFileName + (typeof diff.newHeader === 'undefined' ? '' : '\t' + diff.newHeader));

      for (var i = 0; i < diff.hunks.length; i++) {
        var hunk = diff.hunks[i];
        ret.push('@@ -' + hunk.oldStart + ',' + hunk.oldLines + ' +' + hunk.newStart + ',' + hunk.newLines + ' @@');
        ret.push.apply(ret, hunk.lines);
      }

      return ret.join('\n') + '\n';
    }
    function createPatch(fileName, oldStr, newStr, oldHeader, newHeader, options) {
      return createTwoFilesPatch(fileName, fileName, oldStr, newStr, oldHeader, newHeader, options);
    }

    function arrayEqual(a, b) {
      if (a.length !== b.length) {
        return false;
      }

      return arrayStartsWith(a, b);
    }
    function arrayStartsWith(array, start) {
      if (start.length > array.length) {
        return false;
      }

      for (var i = 0; i < start.length; i++) {
        if (start[i] !== array[i]) {
          return false;
        }
      }

      return true;
    }

    function calcLineCount(hunk) {
      var _calcOldNewLineCount = calcOldNewLineCount(hunk.lines),
          oldLines = _calcOldNewLineCount.oldLines,
          newLines = _calcOldNewLineCount.newLines;

      if (oldLines !== undefined) {
        hunk.oldLines = oldLines;
      } else {
        delete hunk.oldLines;
      }

      if (newLines !== undefined) {
        hunk.newLines = newLines;
      } else {
        delete hunk.newLines;
      }
    }
    function merge(mine, theirs, base) {
      mine = loadPatch(mine, base);
      theirs = loadPatch(theirs, base);
      var ret = {}; // For index we just let it pass through as it doesn't have any necessary meaning.
      // Leaving sanity checks on this to the API consumer that may know more about the
      // meaning in their own context.

      if (mine.index || theirs.index) {
        ret.index = mine.index || theirs.index;
      }

      if (mine.newFileName || theirs.newFileName) {
        if (!fileNameChanged(mine)) {
          // No header or no change in ours, use theirs (and ours if theirs does not exist)
          ret.oldFileName = theirs.oldFileName || mine.oldFileName;
          ret.newFileName = theirs.newFileName || mine.newFileName;
          ret.oldHeader = theirs.oldHeader || mine.oldHeader;
          ret.newHeader = theirs.newHeader || mine.newHeader;
        } else if (!fileNameChanged(theirs)) {
          // No header or no change in theirs, use ours
          ret.oldFileName = mine.oldFileName;
          ret.newFileName = mine.newFileName;
          ret.oldHeader = mine.oldHeader;
          ret.newHeader = mine.newHeader;
        } else {
          // Both changed... figure it out
          ret.oldFileName = selectField(ret, mine.oldFileName, theirs.oldFileName);
          ret.newFileName = selectField(ret, mine.newFileName, theirs.newFileName);
          ret.oldHeader = selectField(ret, mine.oldHeader, theirs.oldHeader);
          ret.newHeader = selectField(ret, mine.newHeader, theirs.newHeader);
        }
      }

      ret.hunks = [];
      var mineIndex = 0,
          theirsIndex = 0,
          mineOffset = 0,
          theirsOffset = 0;

      while (mineIndex < mine.hunks.length || theirsIndex < theirs.hunks.length) {
        var mineCurrent = mine.hunks[mineIndex] || {
          oldStart: Infinity
        },
            theirsCurrent = theirs.hunks[theirsIndex] || {
          oldStart: Infinity
        };

        if (hunkBefore(mineCurrent, theirsCurrent)) {
          // This patch does not overlap with any of the others, yay.
          ret.hunks.push(cloneHunk(mineCurrent, mineOffset));
          mineIndex++;
          theirsOffset += mineCurrent.newLines - mineCurrent.oldLines;
        } else if (hunkBefore(theirsCurrent, mineCurrent)) {
          // This patch does not overlap with any of the others, yay.
          ret.hunks.push(cloneHunk(theirsCurrent, theirsOffset));
          theirsIndex++;
          mineOffset += theirsCurrent.newLines - theirsCurrent.oldLines;
        } else {
          // Overlap, merge as best we can
          var mergedHunk = {
            oldStart: Math.min(mineCurrent.oldStart, theirsCurrent.oldStart),
            oldLines: 0,
            newStart: Math.min(mineCurrent.newStart + mineOffset, theirsCurrent.oldStart + theirsOffset),
            newLines: 0,
            lines: []
          };
          mergeLines(mergedHunk, mineCurrent.oldStart, mineCurrent.lines, theirsCurrent.oldStart, theirsCurrent.lines);
          theirsIndex++;
          mineIndex++;
          ret.hunks.push(mergedHunk);
        }
      }

      return ret;
    }

    function loadPatch(param, base) {
      if (typeof param === 'string') {
        if (/^@@/m.test(param) || /^Index:/m.test(param)) {
          return parsePatch(param)[0];
        }

        if (!base) {
          throw new Error('Must provide a base reference or pass in a patch');
        }

        return structuredPatch(undefined, undefined, base, param);
      }

      return param;
    }

    function fileNameChanged(patch) {
      return patch.newFileName && patch.newFileName !== patch.oldFileName;
    }

    function selectField(index, mine, theirs) {
      if (mine === theirs) {
        return mine;
      } else {
        index.conflict = true;
        return {
          mine: mine,
          theirs: theirs
        };
      }
    }

    function hunkBefore(test, check) {
      return test.oldStart < check.oldStart && test.oldStart + test.oldLines < check.oldStart;
    }

    function cloneHunk(hunk, offset) {
      return {
        oldStart: hunk.oldStart,
        oldLines: hunk.oldLines,
        newStart: hunk.newStart + offset,
        newLines: hunk.newLines,
        lines: hunk.lines
      };
    }

    function mergeLines(hunk, mineOffset, mineLines, theirOffset, theirLines) {
      // This will generally result in a conflicted hunk, but there are cases where the context
      // is the only overlap where we can successfully merge the content here.
      var mine = {
        offset: mineOffset,
        lines: mineLines,
        index: 0
      },
          their = {
        offset: theirOffset,
        lines: theirLines,
        index: 0
      }; // Handle any leading content

      insertLeading(hunk, mine, their);
      insertLeading(hunk, their, mine); // Now in the overlap content. Scan through and select the best changes from each.

      while (mine.index < mine.lines.length && their.index < their.lines.length) {
        var mineCurrent = mine.lines[mine.index],
            theirCurrent = their.lines[their.index];

        if ((mineCurrent[0] === '-' || mineCurrent[0] === '+') && (theirCurrent[0] === '-' || theirCurrent[0] === '+')) {
          // Both modified ...
          mutualChange(hunk, mine, their);
        } else if (mineCurrent[0] === '+' && theirCurrent[0] === ' ') {
          var _hunk$lines;

          // Mine inserted
          (_hunk$lines = hunk.lines).push.apply(_hunk$lines, _toConsumableArray(collectChange(mine)));
        } else if (theirCurrent[0] === '+' && mineCurrent[0] === ' ') {
          var _hunk$lines2;

          // Theirs inserted
          (_hunk$lines2 = hunk.lines).push.apply(_hunk$lines2, _toConsumableArray(collectChange(their)));
        } else if (mineCurrent[0] === '-' && theirCurrent[0] === ' ') {
          // Mine removed or edited
          removal(hunk, mine, their);
        } else if (theirCurrent[0] === '-' && mineCurrent[0] === ' ') {
          // Their removed or edited
          removal(hunk, their, mine, true);
        } else if (mineCurrent === theirCurrent) {
          // Context identity
          hunk.lines.push(mineCurrent);
          mine.index++;
          their.index++;
        } else {
          // Context mismatch
          conflict(hunk, collectChange(mine), collectChange(their));
        }
      } // Now push anything that may be remaining


      insertTrailing(hunk, mine);
      insertTrailing(hunk, their);
      calcLineCount(hunk);
    }

    function mutualChange(hunk, mine, their) {
      var myChanges = collectChange(mine),
          theirChanges = collectChange(their);

      if (allRemoves(myChanges) && allRemoves(theirChanges)) {
        // Special case for remove changes that are supersets of one another
        if (arrayStartsWith(myChanges, theirChanges) && skipRemoveSuperset(their, myChanges, myChanges.length - theirChanges.length)) {
          var _hunk$lines3;

          (_hunk$lines3 = hunk.lines).push.apply(_hunk$lines3, _toConsumableArray(myChanges));

          return;
        } else if (arrayStartsWith(theirChanges, myChanges) && skipRemoveSuperset(mine, theirChanges, theirChanges.length - myChanges.length)) {
          var _hunk$lines4;

          (_hunk$lines4 = hunk.lines).push.apply(_hunk$lines4, _toConsumableArray(theirChanges));

          return;
        }
      } else if (arrayEqual(myChanges, theirChanges)) {
        var _hunk$lines5;

        (_hunk$lines5 = hunk.lines).push.apply(_hunk$lines5, _toConsumableArray(myChanges));

        return;
      }

      conflict(hunk, myChanges, theirChanges);
    }

    function removal(hunk, mine, their, swap) {
      var myChanges = collectChange(mine),
          theirChanges = collectContext(their, myChanges);

      if (theirChanges.merged) {
        var _hunk$lines6;

        (_hunk$lines6 = hunk.lines).push.apply(_hunk$lines6, _toConsumableArray(theirChanges.merged));
      } else {
        conflict(hunk, swap ? theirChanges : myChanges, swap ? myChanges : theirChanges);
      }
    }

    function conflict(hunk, mine, their) {
      hunk.conflict = true;
      hunk.lines.push({
        conflict: true,
        mine: mine,
        theirs: their
      });
    }

    function insertLeading(hunk, insert, their) {
      while (insert.offset < their.offset && insert.index < insert.lines.length) {
        var line = insert.lines[insert.index++];
        hunk.lines.push(line);
        insert.offset++;
      }
    }

    function insertTrailing(hunk, insert) {
      while (insert.index < insert.lines.length) {
        var line = insert.lines[insert.index++];
        hunk.lines.push(line);
      }
    }

    function collectChange(state) {
      var ret = [],
          operation = state.lines[state.index][0];

      while (state.index < state.lines.length) {
        var line = state.lines[state.index]; // Group additions that are immediately after subtractions and treat them as one "atomic" modify change.

        if (operation === '-' && line[0] === '+') {
          operation = '+';
        }

        if (operation === line[0]) {
          ret.push(line);
          state.index++;
        } else {
          break;
        }
      }

      return ret;
    }

    function collectContext(state, matchChanges) {
      var changes = [],
          merged = [],
          matchIndex = 0,
          contextChanges = false,
          conflicted = false;

      while (matchIndex < matchChanges.length && state.index < state.lines.length) {
        var change = state.lines[state.index],
            match = matchChanges[matchIndex]; // Once we've hit our add, then we are done

        if (match[0] === '+') {
          break;
        }

        contextChanges = contextChanges || change[0] !== ' ';
        merged.push(match);
        matchIndex++; // Consume any additions in the other block as a conflict to attempt
        // to pull in the remaining context after this

        if (change[0] === '+') {
          conflicted = true;

          while (change[0] === '+') {
            changes.push(change);
            change = state.lines[++state.index];
          }
        }

        if (match.substr(1) === change.substr(1)) {
          changes.push(change);
          state.index++;
        } else {
          conflicted = true;
        }
      }

      if ((matchChanges[matchIndex] || '')[0] === '+' && contextChanges) {
        conflicted = true;
      }

      if (conflicted) {
        return changes;
      }

      while (matchIndex < matchChanges.length) {
        merged.push(matchChanges[matchIndex++]);
      }

      return {
        merged: merged,
        changes: changes
      };
    }

    function allRemoves(changes) {
      return changes.reduce(function (prev, change) {
        return prev && change[0] === '-';
      }, true);
    }

    function skipRemoveSuperset(state, removeChanges, delta) {
      for (var i = 0; i < delta; i++) {
        var changeContent = removeChanges[removeChanges.length - delta + i].substr(1);

        if (state.lines[state.index + i] !== ' ' + changeContent) {
          return false;
        }
      }

      state.index += delta;
      return true;
    }

    function calcOldNewLineCount(lines) {
      var oldLines = 0;
      var newLines = 0;
      lines.forEach(function (line) {
        if (typeof line !== 'string') {
          var myCount = calcOldNewLineCount(line.mine);
          var theirCount = calcOldNewLineCount(line.theirs);

          if (oldLines !== undefined) {
            if (myCount.oldLines === theirCount.oldLines) {
              oldLines += myCount.oldLines;
            } else {
              oldLines = undefined;
            }
          }

          if (newLines !== undefined) {
            if (myCount.newLines === theirCount.newLines) {
              newLines += myCount.newLines;
            } else {
              newLines = undefined;
            }
          }
        } else {
          if (newLines !== undefined && (line[0] === '+' || line[0] === ' ')) {
            newLines++;
          }

          if (oldLines !== undefined && (line[0] === '-' || line[0] === ' ')) {
            oldLines++;
          }
        }
      });
      return {
        oldLines: oldLines,
        newLines: newLines
      };
    }

    // See: http://code.google.com/p/google-diff-match-patch/wiki/API
    function convertChangesToDMP(changes) {
      var ret = [],
          change,
          operation;

      for (var i = 0; i < changes.length; i++) {
        change = changes[i];

        if (change.added) {
          operation = 1;
        } else if (change.removed) {
          operation = -1;
        } else {
          operation = 0;
        }

        ret.push([operation, change.value]);
      }

      return ret;
    }

    function convertChangesToXML(changes) {
      var ret = [];

      for (var i = 0; i < changes.length; i++) {
        var change = changes[i];

        if (change.added) {
          ret.push('<ins>');
        } else if (change.removed) {
          ret.push('<del>');
        }

        ret.push(escapeHTML(change.value));

        if (change.added) {
          ret.push('</ins>');
        } else if (change.removed) {
          ret.push('</del>');
        }
      }

      return ret.join('');
    }

    function escapeHTML(s) {
      var n = s;
      n = n.replace(/&/g, '&amp;');
      n = n.replace(/</g, '&lt;');
      n = n.replace(/>/g, '&gt;');
      n = n.replace(/"/g, '&quot;');
      return n;
    }

    let fn = {}; const 
    /************** Maps **************/

        /* Symbols To Inject into the Lexer */
        symbols = ["((","))","&&","||"],

        /* Goto lookup maps */
        gt0 = [0,-2,2,1,-2,3,-3,4,5,7,6],
    gt1 = [0,-2,18,-3,19,-3,4,5,7,6],
    gt2 = [0,-10,20,5,7,6],
    gt3 = [0,-13,21],
    gt4 = [0,-14,22,23,24,29,25,31,42,26,-5,48,-1,27,-24,32,30,33,-2,35,34,-2,37],
    gt5 = [0,-20,42,55,-5,48,-1,56],
    gt6 = [0,-27,48,-1,57],
    gt7 = [0,-17,58,-1,31,-34,32,59,33,-2,35,34,-2,37],
    gt8 = [0,-19,61,-34,32,60,33,-2,35,34,-2,37],
    gt9 = [0,-56,63,-2,35,34,-2,37],
    gt10 = [0,-58,64,-2,65,67,66],
    gt11 = [0,-23,70,71,72,73,-3,81,88,84,91,85,94,86,87,-16,32,80,33,79,-1,35,34,-2,37],
    gt12 = [0,-28,102,-1,103,88,84,91,85,94,86,87],
    gt13 = [0,-5,108],
    gt14 = [0,-27,48,-1,110],
    gt15 = [0,-19,61,-34,32,111,33,-2,35,34,-2,37],
    gt16 = [0,-61,112,67,66],
    gt17 = [0,-63,113],
    gt18 = [0,-26,122,-3,81,88,84,91,85,94,86,87,-16,32,80,33,79,-1,35,34,-2,37],
    gt19 = [0,-26,123,-3,81,88,84,91,85,94,86,87,-16,32,80,33,79,-1,35,34,-2,37],
    gt20 = [0,-26,124,-3,81,88,84,91,85,94,86,87,-16,32,80,33,79,-1,35,34,-2,37],
    gt21 = [0,-26,125,-3,81,88,84,91,85,94,86,87,-16,32,80,33,79,-1,35,34,-2,37],
    gt22 = [0,-30,126,88,84,91,85,94,86,87],
    gt23 = [0,-59,127,-3,37],
    gt24 = [0,-59,128,-3,37],
    gt25 = [0,-38,131,132,133,129,144,-2,135,146,-3,136,149,150,130],
    gt26 = [0,-38,131,132,133,161,144,-2,135,146,-3,136,149,150,162],
    gt27 = [0,-38,131,132,133,163,144,-2,135,146,-3,136],
    gt28 = [0,-54,32,166,33,-2,35,34,-2,37],
    gt29 = [0,-4,168,-2,172,171,170,-1,173,7,6],
    gt30 = [0,-23,174,71,72,73,-3,81,88,84,91,85,94,86,87,-16,32,80,33,79,-1,35,34,-2,37],
    gt31 = [0,-23,175,71,72,73,-3,81,88,84,91,85,94,86,87,-16,32,80,33,79,-1,35,34,-2,37],
    gt32 = [0,-23,176,71,72,73,-3,81,88,84,91,85,94,86,87,-16,32,80,33,79,-1,35,34,-2,37],
    gt33 = [0,-23,177,71,72,73,-3,81,88,84,91,85,94,86,87,-16,32,80,33,79,-1,35,34,-2,37],
    gt34 = [0,-24,178,72,73,-3,81,88,84,91,85,94,86,87,-16,32,80,33,79,-1,35,34,-2,37],
    gt35 = [0,-24,179,72,73,-3,81,88,84,91,85,94,86,87,-16,32,80,33,79,-1,35,34,-2,37],
    gt36 = [0,-24,180,72,73,-3,81,88,84,91,85,94,86,87,-16,32,80,33,79,-1,35,34,-2,37],
    gt37 = [0,-24,181,72,73,-3,81,88,84,91,85,94,86,87,-16,32,80,33,79,-1,35,34,-2,37],
    gt38 = [0,-51,149,150,185],
    gt39 = [0,-54,32,189,33,-2,35,34,-2,37],
    gt40 = [0,-42,144,-2,192,146,-3,193],
    gt41 = [0,-47,198,-11,199,-3,37],
    gt42 = [0,-51,149,150,201],
    gt43 = [0,-51,149,150,202],
    gt44 = [0,-38,131,132,133,203,144,-2,135,146,-3,136,149,150,204],
    gt45 = [0,-30,205,88,84,91,85,94,86,87],
    gt46 = [0,-11,208,7,6],
    gt47 = [0,-43,212,211],
    gt48 = [0,-48,219,218],
    gt49 = [0,-51,149,150,224],
    gt50 = [0,-7,172,171,225,-1,173,7,6],
    gt51 = [0,-47,227,-11,199,-3,37],

        // State action lookup maps
        sm0=[0,-2,1,-1,2,3,4,5,6,7,-3,8,-4,9,-3,10],
    sm1=[0,11,-1,1,-1,2,3,4,5,6,7,-3,8,-4,9,-3,10],
    sm2=[0,12,-1,1,-1,2,3,4,5,6,7,-3,8,-4,12,-3,10],
    sm3=[0,13,-1,13,-1,13,13,13,13,13,13,-3,13,-4,13,-3,13],
    sm4=[0,14,-1,14,-1,14,14,14,14,14,14,-3,14,-4,14,-3,14],
    sm5=[0,15,-1,15,-1,15,15,15,15,15,15,-3,15,-4,15,-3,15],
    sm6=[0,16,-1,16,-1,16,16,16,16,16,16,-3,16,-1,16,-1,16,16,-3,16],
    sm7=[0,17,-1,17,-1,17,17,17,17,17,17,-3,17,-1,17,-1,17,17,-3,17],
    sm8=[0,-2,1,-1,0,3,4,5,6,0,-3,8],
    sm9=[0,-2,18,-1,0,-2,19,20,0,-3,21,-5,22,-9,23,24,-1,25,26,27,28,-14,29,30,31,32,33,-38,34],
    sm10=[0,35,-1,1,-1,2,3,4,5,6,7,-3,8,-4,35,-3,10],
    sm11=[0,36,-1,36,-1,36,36,36,36,36,36,-3,36,-4,36,-3,36],
    sm12=[0,37,-1,37,-1,37,37,37,37,37,37,-3,37,-4,37,-3,37],
    sm13=[0,38,-1,38,-1,38,38,38,38,38,38,-3,38,-1,38,-1,38,38,-3,38],
    sm14=[0,-4,0,-4,0,-9,39],
    sm15=[0,-4,0,-4,0,-9,40],
    sm16=[0,-4,0,-4,0,-9,41],
    sm17=[0,-4,0,-4,0,-9,42,-10,24,-1,25,26,27,28,-14,29,30,31,32,33],
    sm18=[0,-4,0,-4,0,-9,43,-30,29,30,31,32,33],
    sm19=[0,-4,0,-4,0,-9,44],
    sm20=[0,-2,18,-1,0,-2,19,20,0,-3,21,-5,45,-10,45,-1,45,45,45,45,-14,45,45,45,45,45,-38,34],
    sm21=[0,-2,18,-1,0,-2,19,20,0,-3,21,-5,46,-10,46,-1,46,46,46,46,-14,46,46,46,46,46,-38,34],
    sm22=[0,-4,0,-4,0,-9,47,-9,48,47,-1,47,47,47,47,-14,47,47,47,47,47],
    sm23=[0,-2,49,-1,0,-2,49,49,0,-3,49,-5,49,-10,49,-1,49,49,49,49,-14,49,49,49,49,49,-38,49],
    sm24=[0,-2,18,-1,0,-2,19,20,0,-3,21,-1,50,-3,50,-9,50,50,-1,50,50,50,50,50,50,50,50,50,50,50,50,-5,50,50,50,50,50,50,-7,50,50,50,50,50,-1,50,-1,50,50,-1,50,-5,50,50,50,50,50,50,50,50,50,50,50,50,-2,34],
    sm25=[0,-2,51,-1,0,-2,51,51,0,-3,51,-1,51,-3,51,-9,51,51,-1,51,51,51,51,51,51,51,51,51,51,51,51,-5,51,51,51,51,51,51,-7,51,51,51,51,51,-1,51,-1,51,51,-1,51,-5,51,51,51,51,51,51,51,51,51,51,51,51,-2,51],
    sm26=[0,-2,52,-1,0,-2,52,52,0,-3,52,-1,52,-3,52,-9,52,52,-1,52,52,52,52,52,52,52,52,52,52,52,52,-5,52,52,52,52,52,52,-7,52,52,52,52,52,-1,52,-1,52,52,-1,52,-5,52,52,52,52,52,52,52,52,52,52,52,52,-2,52],
    sm27=[0,-2,53,-1,0,-2,53,53,0,-3,53,-1,53,-3,53,-9,53,53,-1,53,53,53,53,53,53,53,53,53,53,53,53,-5,53,53,53,53,53,53,-7,53,53,53,53,53,-1,53,-1,53,53,-1,53,-5,53,53,53,53,53,53,53,53,53,53,53,53,-2,53],
    sm28=[0,-2,18,-1,54,-2,19,20,0,-3,21,-1,55,-3,55,-2,56,-6,55,55,-1,55,55,55,55,55,55,55,55,55,55,55,55,-5,55,55,55,55,55,55,-7,55,55,55,55,55,-1,55,-1,55,55,-1,55,55,55,55,55,-1,55,55,55,55,55,55,55,55,55,55,55,55,55,55,55],
    sm29=[0,-2,57,-1,57,-2,57,57,0,-3,57,-1,57,-3,57,-2,57,-6,57,57,-1,57,57,57,57,57,57,57,57,57,57,57,57,-5,57,57,57,57,57,57,-7,57,57,57,57,57,-1,57,-1,57,57,-1,57,57,57,57,57,-1,57,57,57,57,57,57,57,57,57,57,57,57,57,57,57],
    sm30=[0,-2,18,-1,0,-2,19,20,0,-3,21,-5,58,-24,59,60,61,62,63,-1,58,58,58,58,58,64,65,66,67,68,69,70,-29,71,72,34],
    sm31=[0,-2,73,-1,0,-2,73,73,0,-3,73,-5,73,-11,74,-12,73,73,73,73,73,-1,73,73,73,73,73,73,73,73,73,73,73,73,-29,73,73,73],
    sm32=[0,-2,73,-1,0,-2,73,73,0,-3,73,-5,73,-11,75,-12,73,73,73,73,73,-1,73,73,73,73,73,73,73,73,73,73,73,73,-29,73,73,73],
    sm33=[0,-2,73,-1,0,-2,73,73,0,-3,73,-5,73,-11,76,-12,73,73,73,73,73,-1,73,73,73,73,73,73,73,73,73,73,73,73,-29,73,73,73],
    sm34=[0,-2,73,-1,0,-2,73,73,0,-3,73,-5,73,-24,73,73,73,73,73,-1,73,73,73,73,73,73,73,73,73,73,73,73,-29,73,73,73],
    sm35=[0,-2,73,-1,0,-2,73,73,0,-3,73,-5,73,-11,77,-12,73,73,73,73,73,-1,73,73,73,73,73,73,73,73,73,73,73,73,-29,73,73,73],
    sm36=[0,-4,0,-4,0,-9,78,-35,64,65,66,67,68,69,70],
    sm37=[0,-4,0,-4,0,-9,79,-35,79,79,79,79,79,79,79],
    sm38=[0,-4,0,-4,0,-9,79,-11,80,-23,79,79,79,79,79,79,79],
    sm39=[0,-4,0,-4,0,-9,79,-11,81,-23,79,79,79,79,79,79,79],
    sm40=[0,-4,0,-4,0,-9,79,-11,82,-23,79,79,79,79,79,79,79],
    sm41=[0,-4,0,-4,0,-9,79,-11,83,-23,79,79,79,79,79,79,79],
    sm42=[0,84,-1,84,-1,84,84,84,84,84,84,-3,84,-2,85,-1,84,-3,84],
    sm43=[0,-4,0,-4,0,-9,86,-30,29,30,31,32,33],
    sm44=[0,-4,0,-4,0,-9,87],
    sm45=[0,-4,0,-4,0,-9,88],
    sm46=[0,-2,18,-1,0,-2,19,20,0,-3,21,-5,89,-10,89,-1,89,89,89,89,-14,89,89,89,89,89,-38,34],
    sm47=[0,-4,0,-4,0,-9,90,-9,48,90,-1,90,90,90,90,-14,90,90,90,90,90],
    sm48=[0,-4,0,-4,0,-9,91,-9,48,91,-1,91,91,91,91,-14,91,91,91,91,91],
    sm49=[0,-2,92,-1,0,-2,92,92,0,-3,92,-5,92,-10,92,-1,92,92,92,92,-14,92,92,92,92,92,-38,92],
    sm50=[0,-2,93,-1,0,-2,93,93,0,-3,93,-5,93,-10,93,-1,93,93,93,93,-14,93,93,93,93,93,-38,93],
    sm51=[0,-2,94,-1,0,-2,94,94,0,-3,94,-1,94,-3,94,-9,94,94,-1,94,94,94,94,94,94,94,94,94,94,94,94,-5,94,94,94,94,94,94,-7,94,94,94,94,94,-1,94,-1,94,94,-1,94,-5,94,94,94,94,94,94,94,94,94,94,94,94,-2,94],
    sm52=[0,-2,18,-1,54,-2,19,20,0,-3,21,-1,95,-3,95,-2,56,-6,95,95,-1,95,95,95,95,95,95,95,95,95,95,95,95,-5,95,95,95,95,95,95,-7,95,95,95,95,95,-1,95,-1,95,95,-1,95,95,95,95,95,-1,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95],
    sm53=[0,-2,96,-1,96,-2,96,96,0,-3,96,-1,96,-3,96,-2,96,-6,96,96,-1,96,96,96,96,96,96,96,96,96,96,96,96,-5,96,96,96,96,96,96,-7,96,96,96,96,96,-1,96,-1,96,96,-1,96,96,96,96,96,-1,96,96,96,96,96,96,96,96,96,96,96,96,96,96,96],
    sm54=[0,-2,97,-1,97,-2,97,97,0,-3,97,-1,97,-3,97,-2,97,-6,97,97,-1,97,97,97,97,97,97,97,97,97,97,97,97,-5,97,97,97,97,97,97,-7,97,97,97,97,97,-1,97,-1,97,97,-1,97,97,97,97,97,-1,97,97,97,97,97,97,97,97,97,97,97,97,97,97,97],
    sm55=[0,-2,18,-1,0,-2,19,20,0,-3,21],
    sm56=[0,-4,0,-4,0,-9,98,-30,98,98,98,98,98],
    sm57=[0,-4,0,-4,0,-9,99,-16,100,101,102,103,-10,99,99,99,99,99],
    sm58=[0,-4,0,-4,0,-9,104,-16,104,104,104,104,105,106,107,108,-6,104,104,104,104,104],
    sm59=[0,-4,0,-4,0,-9,109,-16,109,109,109,109,109,109,109,109,-6,109,109,109,109,109],
    sm60=[0,-2,18,-1,0,-2,19,20,0,-3,21,-34,63,-6,64,65,66,67,68,69,70,-29,71,72,34],
    sm61=[0,-4,0,-4,0,-45,64,65,66,67,68,69,70],
    sm62=[0,-4,0,-4,0,-9,110,-16,110,110,110,110,110,110,110,110,-6,110,110,110,110,110],
    sm63=[0,-4,0,-4,0,-9,111,-16,111,111,111,111,111,111,111,111,-6,111,111,111,111,111],
    sm64=[0,-4,0,-4,0,-5,112,-3,112,-16,112,112,112,112,112,112,112,112,-5,112,112,112,112,112,112],
    sm65=[0,-4,0,-4,0,-5,113,-3,113,-16,113,113,113,113,113,113,113,113,-5,113,113,113,113,113,113,-7,114,115,116,117,118,-1,119,-1,120,121,-1,122,-5,123,124,125,126,127,128,129,130,131,132,133,134],
    sm66=[0,-4,0,-4,0,-5,135,-3,135,-16,135,135,135,135,135,135,135,135,-5,135,135,135,135,135,135,-7,135,135,135,135,135,-1,135,-1,135,135,-1,135,-5,135,135,135,135,135,135,135,135,135,135,135,135],
    sm67=[0,-4,0,-4,0,-5,136,-3,136,-16,136,136,136,136,136,136,136,136,-5,136,136,136,136,136,136,-7,114,115,116,117,118,-1,119,-1,120,121,-1,122,-5,123,124,125,126,127,128,129,130,131,132,133,134],
    sm68=[0,-4,0,-4,0,-5,137,-3,137,-16,137,137,137,137,137,137,137,137,-5,137,137,137,137,137,137,-7,137,137,137,137,137,-1,137,-1,137,137,-1,137,-5,137,137,137,137,137,137,137,137,137,137,137,137],
    sm69=[0,-4,0,-4,0,-52,114,115,116,117,118,-1,138,-1,139,121,-1,122,-5,123,124],
    sm70=[0,-4,0,-4,0,-52,140,140,140,140,140,-1,140,-1,140,140,-1,140,-5,140,140],
    sm71=[0,-2,18,-1,0,-2,19,20,0,-3,21,-79,34],
    sm72=[0,-2,141,-1,0,-2,141,141,0,-3,141,-5,141,-24,141,141,141,141,141,-1,141,141,141,141,141,141,141,141,141,141,141,141,-29,141,141,141],
    sm73=[0,-4,0,-4,0,-5,142,-3,143],
    sm74=[0,-4,0,-4,0,-5,144,-3,144],
    sm75=[0,-4,0,-4,0,-9,145,-35,145,145,145,145,145,145,145],
    sm76=[0,146,-1,146,-1,146,146,146,146,146,146,-3,146,-4,146,-3,146],
    sm77=[0,-2,1,-1,2,3,4,5,6,7,-3,8,-1,147,-1,148,-4,10],
    sm78=[0,-4,0,-4,0,-9,149],
    sm79=[0,-4,0,-4,0,-9,150,-9,48,150,-1,150,150,150,150,-14,150,150,150,150,150],
    sm80=[0,-2,151,-1,151,-2,151,151,0,-3,151,-1,151,-3,151,-2,151,-6,151,151,-1,151,151,151,151,151,151,151,151,151,151,151,151,-5,151,151,151,151,151,151,-7,151,151,151,151,151,-1,151,-1,151,151,-1,151,151,151,151,151,-1,151,151,151,151,151,151,151,151,151,151,151,151,151,151,151],
    sm81=[0,-2,152,-1,152,-2,152,152,0,-3,152,-1,152,-3,152,-2,152,-6,152,152,-1,152,152,152,152,152,152,152,152,152,152,152,152,-5,152,152,152,152,152,152,-7,152,152,152,152,152,-1,152,-1,152,152,-1,152,152,152,152,152,-1,152,152,152,152,152,152,152,152,152,152,152,152,152,152,152],
    sm82=[0,-2,18,-1,0,-2,19,20,0,-3,21,-30,59,60,61,62,63,-6,64,65,66,67,68,69,70,-29,71,72,34],
    sm83=[0,-4,0,-4,0,-9,153,-16,153,153,153,153,153,153,153,153,-6,153,153,153,153,153],
    sm84=[0,-4,0,-4,0,-39,154],
    sm85=[0,-4,0,-4,0,-81,155],
    sm86=[0,-4,0,-4,0,-82,156],
    sm87=[0,-4,0,-4,0,-5,157,-3,157,-16,157,157,157,157,157,157,157,157,-5,157,157,157,157,157,157,-13,158,-1,159,-10,125,126,127,128,129,130,131,132,133,134],
    sm88=[0,-4,0,-4,0,-5,160,-3,160,-16,160,160,160,160,160,160,160,160,-5,160,160,160,160,160,160],
    sm89=[0,-1,161,18,-1,0,-2,19,20,0,-3,21,-79,34],
    sm90=[0,-1,162,-2,0,-4,0],
    sm91=[0,-1,163,-2,0,-4,0],
    sm92=[0,-1,164,164,-1,0,-2,164,164,0,-3,164,-52,165,-2,166,-3,122,-5,123,124,-12,164],
    sm93=[0,-4,0,-4,0,-5,167,-3,167,-16,167,167,167,167,167,167,167,167,-5,167,167,167,167,167,167,-13,167,-1,167,-10,167,167,167,167,167,167,167,167,167,167],
    sm94=[0,-1,164,164,-1,0,-2,164,164,0,-3,164,-79,164],
    sm95=[0,-4,0,-4,0,-52,168],
    sm96=[0,-1,169,-2,0,-4,0,-5,170,-3,170,-16,170,170,170,170,170,170,170,170,-5,170,170,170,170,170,170],
    sm97=[0,-1,169,-2,0,-4,0],
    sm98=[0,-1,171,-2,0,-4,0,-5,172,-3,172,-16,172,172,172,172,172,172,172,172,-5,172,172,172,172,172,172],
    sm99=[0,-1,171,-2,0,-4,0],
    sm100=[0,-1,173,-2,0,-4,0],
    sm101=[0,-1,174,-2,0,-4,0],
    sm102=[0,-1,175,18,-1,0,-2,19,20,0,-3,21],
    sm103=[0,-1,176,176,-1,0,-2,176,176,0,-3,176],
    sm104=[0,-4,0,-4,0,-5,177,-3,177,-16,177,177,177,177,177,177,177,177,-5,177,177,177,177,177,177],
    sm105=[0,-4,0,-4,0,-5,178,-3,178,-16,178,178,178,178,178,178,178,178,-5,178,178,178,178,178,178],
    sm106=[0,-4,0,-4,0,-5,170,-3,170,-16,170,170,170,170,170,170,170,170,-5,170,170,170,170,170,170],
    sm107=[0,-4,0,-4,0,-5,172,-3,172,-16,172,172,172,172,172,172,172,172,-5,172,172,172,172,172,172],
    sm108=[0,-4,0,-4,0,-5,179,-3,179,-16,179,179,179,179,179,179,179,179,-5,179,179,179,179,179,179,-13,158,-1,159,-10,125,126,127,128,129,130,131,132,133,134],
    sm109=[0,-4,0,-4,0,-5,180,-3,180,-16,180,180,180,180,180,180,180,180,-5,180,180,180,180,180,180],
    sm110=[0,-4,0,-4,0,-5,181,-3,181,-16,181,181,181,181,181,181,181,181,-5,181,181,181,181,181,181,-13,158,-1,159,-10,125,126,127,128,129,130,131,132,133,134],
    sm111=[0,-4,0,-4,0,-5,182,-3,182,-16,182,182,182,182,182,182,182,182,-5,182,182,182,182,182,182,-7,114,115,116,117,118,-1,119,-1,120,121,-1,122,-5,123,124,125,126,127,128,129,130,131,132,133,134],
    sm112=[0,-4,0,-4,0,-5,183,-1,184],
    sm113=[0,185,-1,185,-1,185,185,185,185,185,185,-3,185,-4,185,-3,185],
    sm114=[0,-4,0,-4,0,-5,186,-1,186],
    sm115=[0,-4,0,-4,0,-5,187,-1,187],
    sm116=[0,-2,1,-1,2,3,4,5,6,7,-3,8,-1,188,-1,188,-4,10],
    sm117=[0,-2,189,-1,189,189,189,189,189,189,-3,189,-1,189,-1,189,-4,189],
    sm118=[0,-4,0,-4,0,-9,190,-30,190,190,190,190,190],
    sm119=[0,-4,0,-4,0,-9,191,-16,191,191,191,191,-10,191,191,191,191,191],
    sm120=[0,-4,0,-4,0,-9,192,-16,192,192,192,192,192,192,192,192,-6,192,192,192,192,192],
    sm121=[0,-4,0,-4,0,-9,193,-16,193,193,193,193,193,193,193,193,-6,193,193,193,193,193],
    sm122=[0,-4,0,-4,0,-5,194,-3,194,-16,194,194,194,194,194,194,194,194,-5,194,194,194,194,194,194],
    sm123=[0,-4,0,-4,0,-5,195,-3,195,-16,195,195,195,195,195,195,195,195,-5,195,195,195,195,195,195,-13,195,-1,195,-10,195,195,195,195,195,195,195,195,195,195],
    sm124=[0,-4,0,-4,0,-5,196,-3,196,-16,196,196,196,196,196,196,196,196,-5,196,196,196,196,196,196,-13,196,-1,196,-10,196,196,196,196,196,196,196,196,196,196],
    sm125=[0,-4,0,-4,0,-5,197,-3,197,-16,197,197,197,197,197,197,197,197,-5,197,197,197,197,197,197,-13,197,-1,197,-10,197,197,197,197,197,197,197,197,197,197],
    sm126=[0,-4,0,-4,0,-5,198,-3,198,-16,198,198,198,198,198,198,198,198,-5,198,198,198,198,198,198,-13,198,-1,198,-10,198,198,198,198,198,198,198,198,198,198],
    sm127=[0,-4,0,-4,0,-5,199,-3,199,-16,199,199,199,199,199,199,199,199,-5,199,199,199,199,199,199,-13,199,-1,199,-10,199,199,199,199,199,199,199,199,199,199],
    sm128=[0,-1,200,-2,0,-4,0,-57,201],
    sm129=[0,-1,202,-2,0,-4,0,-57,203],
    sm130=[0,-1,204,204,-1,0,-2,204,204,0,-3,204,-79,204],
    sm131=[0,-4,0,-4,0,-5,205,-3,205,-16,205,205,205,205,205,205,205,205,-5,205,205,205,205,205,205,-13,205,-1,205,-3,206,207,208,209,210,-2,205,205,205,205,205,205,205,205,205,205],
    sm132=[0,-4,0,-4,0,-5,211,-3,211,-16,211,211,211,211,211,211,211,211,-5,211,211,211,211,211,211,-13,211,-1,211,-3,212,213,214,215,-3,211,211,211,211,211,211,211,211,211,211],
    sm133=[0,-4,0,-4,0,-5,216,-3,216,-16,216,216,216,216,216,216,216,216,-5,216,216,216,216,216,216,-13,216,-1,216,-3,216,216,216,216,-3,216,216,216,216,216,216,216,216,216,216],
    sm134=[0,-4,0,-4,0,-5,217,-3,217,-16,217,217,217,217,217,217,217,217,-5,217,217,217,217,217,217],
    sm135=[0,-4,0,-4,0,-5,218,-3,218,-16,218,218,218,218,218,218,218,218,-5,218,218,218,218,218,218],
    sm136=[0,-4,0,-4,0,-5,219,-3,219,-16,219,219,219,219,219,219,219,219,-5,219,219,219,219,219,219,-13,158,-1,159,-10,125,126,127,128,129,130,131,132,133,134],
    sm137=[0,-4,0,-4,0,-5,220,-3,220,-16,220,220,220,220,220,220,220,220,-5,220,220,220,220,220,220],
    sm138=[0,-4,0,-4,0,-5,221,-3,221],
    sm139=[0,222,-1,222,-1,222,222,222,222,222,222,-3,222,-4,222,-3,222],
    sm140=[0,-2,1,-1,2,3,4,5,6,7,-3,8,-1,147,-1,147,-4,10],
    sm141=[0,-2,223,-1,223,223,223,223,223,223,-3,223,-1,223,-1,223,-4,223],
    sm142=[0,-1,224,-2,0,-4,0],
    sm143=[0,-1,225,-2,0,-4,0],
    sm144=[0,-4,0,-4,0,-5,226,-3,226,-16,226,226,226,226,226,226,226,226,-5,226,226,226,226,226,226,-13,226,-1,226,-10,226,226,226,226,226,226,226,226,226,226],
    sm145=[0,-1,227,-2,0,-4,0],
    sm146=[0,-1,228,-2,0,-4,0],
    sm147=[0,-4,0,-4,0,-5,229,-3,229,-16,229,229,229,229,229,229,229,229,-5,229,229,229,229,229,229,-13,229,-1,229,-10,229,229,229,229,229,229,229,229,229,229],
    sm148=[0,-1,230,230,-1,0,-2,230,230,0,-3,230],
    sm149=[0,-4,0,-4,0,-5,231,-3,231,-16,231,231,231,231,231,231,231,231,-5,231,231,231,231,231,231],
    sm150=[0,-4,0,-4,0,-5,232,-1,232],
    sm151=[0,-4,0,-4,0,-5,233,-3,233,-16,233,233,233,233,233,233,233,233,-5,233,233,233,233,233,233,-13,233,-1,233,-10,233,233,233,233,233,233,233,233,233,233],
    sm152=[0,-4,0,-4,0,-5,234,-3,234,-16,234,234,234,234,234,234,234,234,-5,234,234,234,234,234,234,-13,234,-1,234,-10,234,234,234,234,234,234,234,234,234,234],

        // Symbol Lookup map
        lu = new Map([[1,1],[2,2],[4,3],[8,4],[16,5],[32,6],[64,7],[128,8],[256,9],[512,10],[3,11],[264,12],[200,13],[201,14],[",",15],["[",16],["]",17],["((",18],["))",19],[null,1],["\\",22],["/",29],["?",30],[":",31],["f",32],["filter",33],["Filter",34],["FILTER",35],["&&",36],["AND",37],["And",38],["and",39],["||",40],["OR",41],["Or",42],["or",43],["NOT",44],["Not",45],["not",46],["!",47],["(",48],[")",49],["|",50],["s",51],["sort",52],["SORT",53],["Sort",54],["created",55],["CREATED",56],["modifier",57],["MODIFIED",58],["size",59],["SIZE",60],["#",61],["is",62],["equals",63],["=",64],["that",65],["greater",66],["than",67],[">",68],["less",69],["<",70],["lesser",71],["from",73],["to",74],["-",75],["TO",76],["To",77],["through",78],["on",79],["date",80],["DES",81],["des",82],["descending",83],["DESCENDING",84],["down",85],["ASC",86],["asc",87],["ascending",88],["ASCENDING",89],["up",90],["\"",91],["'",92],["*",93]]),

        //Reverse Symbol Lookup map
        rlu = new Map([[1,1],[2,2],[3,4],[4,8],[5,16],[6,32],[7,64],[8,128],[9,256],[10,512],[11,3],[12,264],[13,200],[14,201],[15,","],[16,"["],[17,"]"],[18,"(("],[19,"))"],[1,null],[22,"\\"],[29,"/"],[30,"?"],[31,":"],[32,"f"],[33,"filter"],[34,"Filter"],[35,"FILTER"],[36,"&&"],[37,"AND"],[38,"And"],[39,"and"],[40,"||"],[41,"OR"],[42,"Or"],[43,"or"],[44,"NOT"],[45,"Not"],[46,"not"],[47,"!"],[48,"("],[49,")"],[50,"|"],[51,"s"],[52,"sort"],[53,"SORT"],[54,"Sort"],[55,"created"],[56,"CREATED"],[57,"modifier"],[58,"MODIFIED"],[59,"size"],[60,"SIZE"],[61,"#"],[62,"is"],[63,"equals"],[64,"="],[65,"that"],[66,"greater"],[67,"than"],[68,">"],[69,"less"],[70,"<"],[71,"lesser"],[73,"from"],[74,"to"],[75,"-"],[76,"TO"],[77,"To"],[78,"through"],[79,"on"],[80,"date"],[81,"DES"],[82,"des"],[83,"descending"],[84,"DESCENDING"],[85,"down"],[86,"ASC"],[87,"asc"],[88,"ascending"],[89,"ASCENDING"],[90,"up"],[91,"\""],[92,"'"],[93,"*"]]),

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
    sm26,
    sm27,
    sm28,
    sm29,
    sm29,
    sm29,
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
    sm40,
    sm41,
    sm42,
    sm43,
    sm44,
    sm45,
    sm46,
    sm47,
    sm48,
    sm49,
    sm50,
    sm51,
    sm52,
    sm53,
    sm54,
    sm54,
    sm54,
    sm55,
    sm56,
    sm57,
    sm58,
    sm59,
    sm60,
    sm60,
    sm60,
    sm60,
    sm61,
    sm62,
    sm62,
    sm63,
    sm55,
    sm55,
    sm64,
    sm64,
    sm64,
    sm64,
    sm65,
    sm66,
    sm66,
    sm67,
    sm68,
    sm68,
    sm69,
    sm70,
    sm70,
    sm71,
    sm72,
    sm72,
    sm72,
    sm72,
    sm73,
    sm74,
    sm75,
    sm75,
    sm75,
    sm75,
    sm76,
    sm77,
    sm78,
    sm79,
    sm80,
    sm81,
    sm82,
    sm82,
    sm82,
    sm82,
    sm82,
    sm82,
    sm82,
    sm82,
    sm83,
    sm83,
    sm83,
    sm83,
    sm84,
    sm85,
    sm86,
    sm87,
    sm88,
    sm89,
    sm90,
    sm91,
    sm92,
    sm93,
    sm93,
    sm94,
    sm94,
    sm95,
    sm96,
    sm97,
    sm98,
    sm99,
    sm100,
    sm101,
    sm102,
    sm103,
    sm103,
    sm104,
    sm105,
    sm106,
    sm106,
    sm106,
    sm106,
    sm106,
    sm107,
    sm107,
    sm107,
    sm107,
    sm107,
    sm108,
    sm109,
    sm110,
    sm97,
    sm99,
    sm111,
    sm61,
    sm112,
    sm113,
    sm114,
    sm115,
    sm116,
    sm117,
    sm118,
    sm118,
    sm118,
    sm118,
    sm119,
    sm119,
    sm119,
    sm119,
    sm120,
    sm121,
    sm121,
    sm122,
    sm106,
    sm107,
    sm123,
    sm124,
    sm125,
    sm126,
    sm127,
    sm127,
    sm128,
    sm129,
    sm130,
    sm131,
    sm132,
    sm133,
    sm133,
    sm134,
    sm135,
    sm136,
    sm137,
    sm138,
    sm139,
    sm140,
    sm141,
    sm142,
    sm143,
    sm144,
    sm145,
    sm146,
    sm146,
    sm146,
    sm146,
    sm146,
    sm147,
    sm102,
    sm148,
    sm148,
    sm148,
    sm148,
    sm149,
    sm150,
    sm151,
    sm152],

    /************ Functions *************/

        max = Math.max, min = Math.min,

        //Error Functions
        e$1 = (tk,r,o,l,p)=>{if(l.END)l.throw("Unexpected end of input");else if(l.ty & (264)) l.throw(`Unexpected space character within input "${p.slice(l)}" `) ; else l.throw(`Unexpected token [${l.tx}]`);}, 
        eh = [e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1,
    e$1],

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
    C160_r_query_body=function (sym){this.container = sym[0];this.filter = sym[1];this.sort = sym[2];},
    C161_r_query_body=function (sym){this.container = null;this.filter = sym[0];this.sort = sym[1];},
    C162_r_query_body=function (sym){this.container = sym[0];this.filter = null;this.sort = sym[1];},
    C163_r_query_body=function (sym){this.container = sym[0];this.filter = sym[1];this.sort = null;},
    C164_r_query_body=function (sym){this.container = null;this.filter = null;this.sort = sym[0];},
    C165_r_query_body=function (sym){this.container = null;this.filter = sym[0];this.sort = null;},
    C166_r_query_body=function (sym){this.container = sym[0];this.filter = null;this.sort = null;},
    C167_r_query_body=function (){this.container = null;this.filter = null;this.sort = null;},
    C180_r_container_clause=function (sym){this.containers = [{ids : [""]},...sym[1]];this.id = sym[2];if(this.id)if(this.id.ids.length == 1 && this.id.ids[0] == "*"){if(!this.containers)this.containers = [];this.containers.push(this.id);this.id = null;}},
    C181_r_container_clause=function (sym){this.containers = [{ids : [""]},...sym[0]];this.id = sym[1];if(this.id)if(this.id.ids.length == 1 && this.id.ids[0] == "*"){if(!this.containers)this.containers = [];this.containers.push(this.id);this.id = null;}},
    C182_r_container_clause=function (sym){this.containers = [{ids : [""]}];this.id = sym[1];if(this.id)if(this.id.ids.length == 1 && this.id.ids[0] == "*"){if(!this.containers)this.containers = [];this.containers.push(this.id);this.id = null;}},
    C183_r_container_clause=function (sym){this.containers = [{ids : [""]},...sym[1]];this.id = null;if(this.id)if(this.id.ids.length == 1 && this.id.ids[0] == "*"){if(!this.containers)this.containers = [];this.containers.push(this.id);this.id = null;}},
    C184_r_container_clause=function (sym){this.containers = [{ids : [""]}];this.id = sym[0];if(this.id)if(this.id.ids.length == 1 && this.id.ids[0] == "*"){if(!this.containers)this.containers = [];this.containers.push(this.id);this.id = null;}},
    C185_r_container_clause=function (sym){this.containers = [{ids : [""]},...sym[0]];this.id = null;if(this.id)if(this.id.ids.length == 1 && this.id.ids[0] == "*"){if(!this.containers)this.containers = [];this.containers.push(this.id);this.id = null;}},
    C186_r_container_clause=function (){this.containers = [{ids : [""]}];this.id = null;if(this.id)if(this.id.ids.length == 1 && this.id.ids[0] == "*"){if(!this.containers)this.containers = [];this.containers.push(this.id);this.id = null;}},
    R210_r_filter_clause=()=>null,
    C230_r_and_expression=function (sym){this.type = "AND";this.left = sym[0];this.right = sym[2];},
    C240_r_or_expression=function (sym){this.type = "OR";this.left = sym[0];this.right = sym[2];},
    C250_r_not_expression=function (sym){this.type = "NOT";this.left = sym[1];},
    C260_r_wrapped_expression=function (sym){this.type = "MATCH";this.value = sym[0];},
    C320_r_created_statement=function (sym){this.type = "CREATED";this.val = sym[1];this.order = sym[2] || 1;},
    C321_r_created_statement=function (sym){this.type = "CREATED";this.val = null;this.order = sym[1] || 1;},
    C322_r_created_statement=function (sym){this.type = "CREATED";this.val = sym[1];this.order = 1;},
    C323_r_created_statement=function (){this.type = "CREATED";this.val = null;this.order = 1;},
    C340_r_modified_statement=function (sym){this.type = "MODIFIED";this.val = sym[1];this.order = sym[2] || 1;},
    C341_r_modified_statement=function (sym){this.type = "MODIFIED";this.val = null;this.order = sym[1] || 1;},
    C342_r_modified_statement=function (sym){this.type = "MODIFIED";this.val = sym[1];this.order = 1;},
    C343_r_modified_statement=function (){this.type = "MODIFIED";this.val = null;this.order = 1;},
    C360_r_size_statement=function (sym){this.type = "SIZE";this.val = sym[1];this.order = sym[2] || 1;},
    C361_r_size_statement=function (sym){this.type = "SIZE";this.val = sym[1];this.order = 1;},
    C370_r_tag_statement=function (sym){this.type = "TAG";this.id = sym[1];this.val = sym[2];this.order = sym[3] || 1;},
    C371_r_tag_statement=function (sym){this.type = "TAG";this.id = sym[1];this.val = null;this.order = sym[2] || 1;},
    C372_r_tag_statement=function (sym){this.type = "TAG";this.id = sym[1];this.val = sym[2];this.order = 1;},
    C373_r_tag_statement=function (sym){this.type = "TAG";this.id = sym[1];this.val = null;this.order = 1;},
    R410_r_comparison_expression=sym=>({type : "EQUALS_QUANTITATIVE",val : parseFloat(sym[1])}),
    R411_r_comparison_expression=sym=>({type : "EQUALS_QUALITATIVE",val : sym[1]}),
    R412_r_comparison_expression=sym=>({type : "GREATERTHAN",val : parseFloat(sym[1])}),
    R413_r_comparison_expression=sym=>({type : "LESSTHAN",val : parseFloat(sym[1])}),
    R450_r_range_expression=sym=>({type : "RANGE",val : [sym[1],sym[2]].map(parseFloat).sort((a,b)=>a < b ? -1 : 1)}),
    R451_r_range_expression=sym=>({type : "RANGE",val : [sym[1]].map(parseFloat).sort((a,b)=>a < b ? -1 : 1)}),
    R500_r_date_expression=sym=>({type : "DATE",val : [sym[1],sym[2]].map(d=>new Date(d).valueOf()).sort((a,b)=>a < b ? -1 : 1)}),
    R501_r_date_expression=sym=>({type : "DATE",val : [sym[1]].map(d=>new Date(d).valueOf()).sort((a,b)=>a < b ? -1 : 1)}),
    R530_r_order=()=>-1,
    R531_r_order=()=>1,
    C550_r_identifier=function (sym){this.ids = sym[0];},
    R590_r_string_data=sym=>[sym[0],...sym[1]].join("").trim(),
    R591_r_string_data=sym=>[sym[0]].join("").trim(),

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
    e=>166,
    e=>162,
    e=>158,
    e=>154,
    (...v)=>(redn(16387,0,...v)),
    e=>114,
    e=>174,
    e=>178,
    e=>182,
    e=>186,
    e=>190,
    e=>198,
    e=>202,
    e=>206,
    e=>210,
    e=>214,
    e=>146,
    (...v)=>redv(3083,R32_items,2,0,...v),
    (...v)=>redv(3083,R33_items,2,0,...v),
    (...v)=>redv(2059,R10_string_data_list,2,0,...v),
    (...v)=>redv(12299,R50_undefined621_group,2,0,...v),
    e=>218,
    (...v)=>redn(14343,1,...v),
    (...v)=>redn(15367,1,...v),
    (...v)=>rednv(16391,C166_r_query_body,1,0,...v),
    (...v)=>rednv(16391,C165_r_query_body,1,0,...v),
    (...v)=>rednv(16391,C164_r_query_body,1,0,...v),
    (...v)=>rednv(18439,C186_r_container_clause,1,0,...v),
    (...v)=>rednv(18439,C185_r_container_clause,1,0,...v),
    (...v)=>rednv(18439,C184_r_container_clause,1,0,...v),
    e=>250,
    (...v)=>redv(17415,R11_string_data_list,1,0,...v),
    (...v)=>rednv(56327,C550_r_identifier,1,0,...v),
    (...v)=>redv(55303,R11_string_data_list,1,0,...v),
    (...v)=>redn(57351,1,...v),
    (...v)=>redn(61447,1,...v),
    e=>274,
    (...v)=>redv(60423,R591_r_string_data,1,0,...v),
    e=>278,
    (...v)=>redn(64519,1,...v),
    (...v)=>redv(21511,R210_r_filter_clause,1,0,...v),
    e=>298,
    e=>302,
    e=>306,
    e=>310,
    e=>314,
    e=>358,
    e=>362,
    e=>370,
    e=>374,
    e=>382,
    e=>386,
    e=>390,
    e=>330,
    e=>334,
    (...v)=>redn(20487,1,...v),
    e=>394,
    e=>398,
    e=>402,
    e=>406,
    (...v)=>redv(29703,R210_r_filter_clause,1,0,...v),
    (...v)=>redn(27655,1,...v),
    e=>418,
    e=>422,
    e=>426,
    e=>430,
    (...v)=>rednv(6159,C62_data_insert_point,3,0,...v),
    e=>438,
    (...v)=>rednv(16395,C163_r_query_body,2,0,...v),
    (...v)=>rednv(16395,C162_r_query_body,2,0,...v),
    (...v)=>rednv(16395,C161_r_query_body,2,0,...v),
    (...v)=>rednv(18443,C183_r_container_clause,2,0,...v),
    (...v)=>rednv(18443,C182_r_container_clause,2,0,...v),
    (...v)=>rednv(18443,C181_r_container_clause,2,0,...v),
    (...v)=>redv(17419,R10_string_data_list,2,0,...v),
    (...v)=>redv(19467,R32_items,2,0,...v),
    (...v)=>redv(55307,R10_string_data_list,2,0,...v),
    (...v)=>redv(60427,R590_r_string_data,2,0,...v),
    (...v)=>redv(59399,R71_string_data_val_list,1,0,...v),
    (...v)=>redn(62471,1,...v),
    (...v)=>redv(21515,R50_undefined621_group,2,0,...v),
    (...v)=>redn(23559,1,...v),
    e=>458,
    e=>462,
    e=>466,
    e=>470,
    (...v)=>redn(24583,1,...v),
    e=>474,
    e=>478,
    e=>482,
    e=>486,
    (...v)=>redn(25607,1,...v),
    (...v)=>rednv(26631,C260_r_wrapped_expression,1,0,...v),
    (...v)=>redn(26631,1,...v),
    (...v)=>redn(30727,1,...v),
    (...v)=>rednv(32775,C323_r_created_statement,1,0,...v),
    e=>538,
    e=>550,
    e=>554,
    e=>558,
    e=>566,
    e=>562,
    e=>570,
    e=>574,
    e=>582,
    e=>590,
    e=>594,
    e=>606,
    e=>610,
    e=>614,
    e=>618,
    e=>622,
    e=>626,
    e=>630,
    e=>634,
    e=>638,
    e=>642,
    (...v)=>redn(31751,1,...v),
    (...v)=>rednv(34823,C343_r_modified_statement,1,0,...v),
    (...v)=>redn(33799,1,...v),
    e=>658,
    e=>662,
    (...v)=>redn(35847,1,...v),
    (...v)=>redn(20491,2,...v),
    e=>670,
    (...v)=>redv(29707,R50_undefined621_group,2,0,...v),
    (...v)=>redv(28679,R11_string_data_list,1,0,...v),
    (...v)=>redn(27659,2,...v),
    (...v)=>rednv(6163,C60_data_insert_point,4,0,...v),
    (...v)=>(redn(8195,0,...v)),
    e=>678,
    (...v)=>rednv(16399,C160_r_query_body,3,0,...v),
    (...v)=>rednv(18447,C180_r_container_clause,3,0,...v),
    (...v)=>redv(59403,R70_string_data_val_list,2,0,...v),
    (...v)=>redv(63499,R50_undefined621_group,2,0,...v),
    (...v)=>rednv(25611,C250_r_not_expression,2,0,...v),
    e=>730,
    e=>734,
    e=>738,
    (...v)=>rednv(32779,C322_r_created_statement,2,0,...v),
    e=>746,
    e=>750,
    (...v)=>rednv(32779,C321_r_created_statement,2,0,...v),
    e=>754,
    e=>762,
    e=>766,
    (...v)=>redn(38919,1,...v),
    e=>778,
    e=>782,
    (...v)=>redv(41991,R32_items,1,0,...v),
    e=>786,
    (...v)=>redn(39943,1,...v),
    (...v)=>redn(52231,1,...v),
    (...v)=>redn(40967,1,...v),
    (...v)=>redn(53255,1,...v),
    e=>790,
    (...v)=>redn(43015,1,...v),
    e=>802,
    (...v)=>redn(47111,1,...v),
    (...v)=>redv(54279,R530_r_order,1,0,...v),
    (...v)=>redv(54279,R531_r_order,1,0,...v),
    (...v)=>rednv(34827,C342_r_modified_statement,2,0,...v),
    (...v)=>rednv(34827,C341_r_modified_statement,2,0,...v),
    (...v)=>rednv(36875,C361_r_size_statement,2,0,...v),
    (...v)=>rednv(37899,C373_r_tag_statement,2,0,...v),
    e=>830,
    e=>826,
    (...v)=>redv(5131,R51_undefined621_group,2,0,...v),
    (...v)=>redv(4103,R11_string_data_list,1,0,...v),
    (...v)=>redn(9223,1,...v),
    (...v)=>redn(8199,1,...v),
    (...v)=>redv(7175,R71_string_data_val_list,1,0,...v),
    (...v)=>rednv(23567,C230_r_and_expression,3,0,...v),
    (...v)=>rednv(24591,C240_r_or_expression,3,0,...v),
    (...v)=>redv(26639,R50_undefined621_group,3,0,...v),
    (...v)=>redv(58383,R50_undefined621_group,3,0,...v),
    (...v)=>rednv(32783,C320_r_created_statement,3,0,...v),
    (...v)=>redv(41995,R410_r_comparison_expression,2,0,...v),
    (...v)=>redv(41995,R411_r_comparison_expression,2,0,...v),
    (...v)=>redv(41995,R412_r_comparison_expression,2,0,...v),
    (...v)=>redv(41995,R413_r_comparison_expression,2,0,...v),
    (...v)=>redv(41995,R50_undefined621_group,2,0,...v),
    (...v)=>redn(39947,2,...v),
    e=>838,
    (...v)=>redn(40971,2,...v),
    e=>842,
    (...v)=>redn(38923,2,...v),
    (...v)=>redv(46091,R451_r_range_expression,2,0,...v),
    e=>854,
    e=>858,
    e=>862,
    e=>866,
    e=>870,
    (...v)=>redv(51211,R501_r_date_expression,2,0,...v),
    e=>882,
    e=>886,
    e=>890,
    e=>894,
    (...v)=>redn(48135,1,...v),
    (...v)=>rednv(34831,C340_r_modified_statement,3,0,...v),
    (...v)=>rednv(36879,C360_r_size_statement,3,0,...v),
    (...v)=>rednv(37903,C372_r_tag_statement,3,0,...v),
    (...v)=>rednv(37903,C371_r_tag_statement,3,0,...v),
    (...v)=>redv(28687,R40_data_string_list,3,0,...v),
    (...v)=>redv(5135,R50_undefined621_group,3,0,...v),
    (...v)=>redv(7179,R70_string_data_val_list,2,0,...v),
    (...v)=>redn(39951,3,...v),
    (...v)=>redn(40975,3,...v),
    (...v)=>redv(46095,R450_r_range_expression,3,0,...v),
    e=>906,
    (...v)=>redn(44039,1,...v),
    (...v)=>redv(51215,R500_r_date_expression,3,0,...v),
    (...v)=>redn(49159,1,...v),
    (...v)=>rednv(37907,C370_r_tag_statement,4,0,...v),
    (...v)=>redv(4111,R40_data_string_list,3,0,...v),
    (...v)=>redv(45067,R50_undefined621_group,2,0,...v),
    (...v)=>redv(50187,R50_undefined621_group,2,0,...v)],

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
    nf,
    v=>lsm(v,gt5),
    v=>lsm(v,gt6),
    nf,
    v=>lsm(v,gt7),
    v=>lsm(v,gt8),
    nf,
    nf,
    v=>lsm(v,gt9),
    nf,
    nf,
    nf,
    nf,
    v=>lsm(v,gt10),
    nf,
    nf,
    nf,
    nf,
    v=>lsm(v,gt11),
    nf,
    nf,
    nf,
    nf,
    nf,
    v=>lsm(v,gt12),
    nf,
    nf,
    nf,
    nf,
    nf,
    v=>lsm(v,gt13),
    v=>lsm(v,gt14),
    nf,
    nf,
    v=>lsm(v,gt15),
    nf,
    nf,
    nf,
    nf,
    nf,
    v=>lsm(v,gt16),
    nf,
    nf,
    nf,
    nf,
    v=>lsm(v,gt17),
    nf,
    nf,
    nf,
    nf,
    v=>lsm(v,gt18),
    v=>lsm(v,gt19),
    v=>lsm(v,gt20),
    v=>lsm(v,gt21),
    v=>lsm(v,gt22),
    nf,
    nf,
    nf,
    v=>lsm(v,gt23),
    v=>lsm(v,gt24),
    nf,
    nf,
    nf,
    nf,
    v=>lsm(v,gt25),
    nf,
    nf,
    v=>lsm(v,gt26),
    nf,
    nf,
    v=>lsm(v,gt27),
    nf,
    nf,
    v=>lsm(v,gt28),
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
    v=>lsm(v,gt29),
    nf,
    nf,
    nf,
    nf,
    v=>lsm(v,gt30),
    v=>lsm(v,gt31),
    v=>lsm(v,gt32),
    v=>lsm(v,gt33),
    v=>lsm(v,gt34),
    v=>lsm(v,gt35),
    v=>lsm(v,gt36),
    v=>lsm(v,gt37),
    nf,
    nf,
    nf,
    nf,
    nf,
    nf,
    nf,
    v=>lsm(v,gt38),
    nf,
    v=>lsm(v,gt39),
    nf,
    nf,
    v=>lsm(v,gt40),
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
    v=>lsm(v,gt41),
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
    v=>lsm(v,gt42),
    nf,
    v=>lsm(v,gt43),
    nf,
    nf,
    v=>lsm(v,gt44),
    v=>lsm(v,gt45),
    nf,
    nf,
    nf,
    nf,
    v=>lsm(v,gt46),
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
    nf,
    nf,
    nf,
    nf,
    nf,
    nf,
    nf,
    nf,
    nf,
    v=>lsm(v,gt47),
    v=>lsm(v,gt48),
    nf,
    nf,
    nf,
    nf,
    v=>lsm(v,gt49),
    nf,
    nf,
    nf,
    v=>lsm(v,gt50),
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
    v=>lsm(v,gt51),
    nf,
    nf,
    nf,
    nf,
    nf,
    nf,
    nf,
    nf];

<<<<<<< HEAD
        // Retrieves notes from server based on query. 
        // Caches all notes received from server.
        // Returns a NoteContainer with all notes reveived.
        // Returns null of no notes matched query.
        async retrieve(
            query_candidate
        ) {
            const
                output = [],
                results = await this[RUMINATE_SERVER].query(query_candidate);


            if (results) {
                for (const note_data of results) {
                    const uid = note_data.uid.toString();
                    if (!note_data) continue;

                    if (!this[RUMINATE_NOTES].has(uid)) {
                        this[RUMINATE_NOTES].set(uid, new Note(
                            this,
                            new UID(uid),
                            note_data.id,
                            note_data.tags,
                            note_data.body,
                            note_data.refs || [],
                            note_data.modified,
                            false
                        ));
                    } else {
                        this[RUMINATE_NOTES].get(uid)[RUMINATE_NOTE_UPDATE](note_data);
                    }

                    output.push(this[RUMINATE_NOTES].get(uid));
                }
            }

            return new NoteContainer(...output);
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
                throw new Error(`ruminate.createNote: [note_tags] argument must be a string of comma separated values or an array of [strings | numbers].Got $ { note_tags.map(e => typeof e) }`);
            }

            if (typeof body !== "string")
                throw new Error("body argument must be a string value");

            if (!(uid instanceof UID))
                throw new Error("uid argument must be a UID instance");

            const note = new Note(
                this,
                uid,
                note_id,
                note_tags,
                body,
                [],
                Date.now() | 0,
                true, // Auto sync with server
                RUMINATE_NOTES
            );

            this[RUMINATE_NOTES].set(uid.toString(), note);

            return note;
        }
    }

    const uri_reg_ex = /(?:([^\:\?\[\]\@\/\#\b\s][^\:\?\[\]\@\/\#\b\s]*)(?:\:\/\/))?(?:([^\:\?\[\]\@\/\#\b\s][^\:\?\[\]\@\/\#\b\s]*)(?:\:([^\:\?\[\]\@\/\#\b\s]*)?)?\@)?(?:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|((?:\[[0-9a-f]{1,4})+(?:\:[0-9a-f]{0,4}){2,7}\])|([^\:\?\[\]\@\/\#\b\s\.]{2,}(?:\.[^\:\?\[\]\@\/\#\b\s]*)*))?(?:\:(\d+))?((?:[^\?\[\]\#\s\b]*)+)?(?:\?([^\[\]\#\s\b]*))?(?:\#([^\#\s\b]*))?/i;
=======
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
    };

    const RUMINATE_NOTE = Symbol("GRAZE NOTE");
    const RUMINATE_NOTE_BODY = Symbol("GRAZE NOTE BODY");
    const RUMINATE_NOTES = Symbol("GRAZE NOTES");
    const RUMINATE_SYNC_RATE = Symbol("GRAZE SYNC RATE");
    const RUMINATE_SYNC_INTERVAL_REF = Symbol("GRAZE SYNC INTERVAL REF");
    const RUMINATE_SERVER = Symbol("GRAZE SERVER");
    const RUMINATE_UPDATE_QUEUE = Symbol("GRAZE UPDATE");
    const RUMINATE_UPDATE_QUEUE_ALERT = Symbol("GRAZE UPDATE QUEUE ALERT");
    const RUMINATE_NOTE_UPDATE = Symbol("GRAZE NOTE UPDATE FUNCTION");
    const RUMINATE_REFERENCE = Symbol("GRAZE REFERENCE");
    const RUMINATE_NOTE_SYNC = Symbol("GRAZE NOTE SYNC");
    const RUMINATE_NOTE_PREPARE_FOR_SERVER = Symbol("GRAZE NOTE PREPARE FOR SERVER");
    const RUMINATE_NOTE_SYNC_LIST = Symbol("GRAZE NOTE SYNC LIST");
    const RUMINATE_NOTE_TAGS = Symbol("GRAZE NOTE TAGS");
    const RUMINATE_NOTE_NEED_UPDATE = Symbol("GRAZE NOTE NEED UPDATE");

    function CHANGED(note) {
    	if (!note[RUMINATE_NOTE_NEED_UPDATE]) {
    		note[RUMINATE_NOTE_NEED_UPDATE] = true;
    		note[RUMINATE_REFERENCE][RUMINATE_UPDATE_QUEUE_ALERT](note);
    	}
    }

    function ProcessTags(tag_string_list) {
    	if (!tag_string_list)
    		return new Map;

    	if (typeof tag_string_list == "string")
    		tag_string_list = tag_string_list.split(",");

    	return new Map(tag_string_list.map((t, p, tag) => (
    		p = typeof t == "string" ? t.split(":") : [t + ""],
    		tag = { v: undefined, d: false },
    		tag.v = (p.length > 1)
    		? isNaN(p[1])
    		? p[1].trim()
    		: parseFloat(p[1].trim())
    		: undefined,
            [p[0].trim().toLowerCase(), tag]
    	)));
    }

    class Note {
    	constructor(ruminate, uid, id, tags, body, refs, modified, NEED_SYNC = false) {

    		this[RUMINATE_REFERENCE] = ruminate;
    		this[RUMINATE_NOTE_SYNC_LIST] = [];
    		this[RUMINATE_NOTE_NEED_UPDATE] = false;
    		this[RUMINATE_NOTE_TAGS] = ProcessTags(tags);
    		this[RUMINATE_NOTE_BODY] = {
    			uid,
    			id,
    			modified,
    			tags,
    			body,
    			refs
    		};
    		if (NEED_SYNC)
    			CHANGED(this);
    	}

    	/****************** Basic Properties *************************/

    	get created() { return this[RUMINATE_NOTE_BODY].uid.date_created.valueOf() }
    	get createdDateObj() { return this[RUMINATE_NOTE_BODY].uid.date_created }
    	get modified() { return this[RUMINATE_NOTE_BODY].modified }
    	get uid() { return this[RUMINATE_NOTE_BODY].uid }
    	get id() { return this[RUMINATE_NOTE_BODY].id }
    	async delete(index, length) {}

    	/****************** Synchronizing *************************/

    	/*  
    	    Returns a promise that is fulfilled the next time 
    	    Graze syncs the note with the server
    	*/
    	sync() {
    		return new Promise(res => this[RUMINATE_NOTE_NEED_UPDATE] ? this[RUMINATE_NOTE_SYNC_LIST].push(res) : res());
    	}

    	[RUMINATE_NOTE_UPDATE](note_data) {
    		const note = this[RUMINATE_NOTE_BODY];

    		if (note_data.modified < note.modified
    			|| note_data.uid.toString() !== note.uid.toString())
    			return;

    		this[RUMINATE_NOTE_TAGS] = ProcessTags(note_data.tags);
    		note.id = note_data.id;
    		note.modified = note_data.modified;
    		note.tags = note_data.tags;
    		note.body = note_data.body;

    		this.updateObservers();
    	}

    	// Called by ruminate after data has been sent to server and response has been received. 
    	[RUMINATE_NOTE_SYNC](RESULT) {
    		if (!RESULT) {
    			CHANGED(this); // Prime for next update interval
    		} else {
    			this[RUMINATE_NOTE_SYNC_LIST].map(s => s(this));
    			this[RUMINATE_NOTE_SYNC_LIST].length = 0;
    		}
    	}

    	// Called by ruminate to process local data cache to send to server
    	[RUMINATE_NOTE_PREPARE_FOR_SERVER]() {

    		if (this[RUMINATE_NOTE_NEED_UPDATE]) {
    			const list = [];

    			for (const t of this[RUMINATE_NOTE_TAGS].entries())
    				list.push(`${t[1].d?"!":""}${t[0]}${t[1].v?":"+t[1].v:""}`);

    			this[RUMINATE_NOTE_BODY].tags = list;
    			this[RUMINATE_NOTE_NEED_UPDATE] = false;
    		}

    		return this[RUMINATE_NOTE_BODY];
    	}

    	/****************** BODY *************************/

    	get body() {
    		return this[RUMINATE_NOTE_BODY].body;
    	}

    	set body(str) {
    		const note = this[RUMINATE_NOTE_BODY];

    		let modstr = note.body,
    			NEED_SYNC_UPDATE_LOCAL = false,
    			offset = 0;

    		//Get Minimum changes to note
    		for (const diff of diffChars(note.body, str)) {
    			if (diff.added) {
    				modstr = modstr.slice(0, offset) + diff.value + modstr.slice(offset);
    				NEED_SYNC_UPDATE_LOCAL = true;
    			} else if (diff.removed) {
    				modstr = modstr.slice(0, offset) + modstr.slice(offset + diff.count);
    				NEED_SYNC_UPDATE_LOCAL = true;
    				offset -= diff.count;
    			}
    			offset += diff.count;
    			//insert into string
    		}

    		//update store with new note changes. 
    		if (NEED_SYNC_UPDATE_LOCAL) {
    			note.body = modstr;
    			CHANGED(this);
    		}
    	}

    	/****************** TAGS *************************/

    	removeTag(name) {

    		CHANGED(this);

    		name = name.toString().toLowerCase();

    		if (this[RUMINATE_NOTE_TAGS].has(name))
    			this[RUMINATE_NOTE_TAGS].get(name).d = true;

    		return true;
    	}

    	setTag(name, value) {
    		if (!name && !value)
    			return;

    		if (typeof(name) == "object") {
    			value = name.value;
    			name = name.name + "";
    		} else if (value === null)
    			value = undefined;

    		name = name.toString().toLowerCase();

    		this[RUMINATE_NOTE_TAGS].set(name, { v: value, d: false });

    		CHANGED(this);

    		return true;
    	}

    	setTags(...v) {
    		// Remove existing tags to make sure the expected result
    		// of all tags now comprising of values defined in 
    		// the set v.

    		this.tags.map(t => this.delete(t.name));

    		if (v) {
    			if (Array.isArray(v))
    				for (const tag_set of v) {
    					if (Array.isArray(tag_set)) {
    						for (const tag of v)
    							setTag(name, value);
    						this.setTag(tag.name, tag.value);
    					} else if (typeof tag_set == "object")
    						this.setTag(tag_set.name, tag_set.value);
    				}
    			else
    				this.setTag(v.name, v.value);
    		}

    		return true;
    	}

    	getTag(name) {
    		name = name.toString().toLowerCase();
    		const tag = this[RUMINATE_NOTE_TAGS].get(name);
    		return (tag && !tag.d) ? tag.v ? tag.v : name : null;
    	}

    	getTags() {
    		return [...this[RUMINATE_NOTE_TAGS].keys()]
    			.map((name, v) => (v = this.getTag(name), v ? v == name ? { name } : { name, value: v } : null))
    			.filter(e => e !== null);
    	}

    	get tag() {
    		return new Proxy(this, {
    			get: (obj, prop) => this.getTag(prop),
    			set: (obj, prop, value) => {
    				if (value === null)
    					this.removeTag(prop);
    				return this.setTag(prop, value)
    			}
    		})
    	}

    	set tag(e) {}

    	get tags() {
    		return this.getTags();
    	}

    	set tags(v) {
    		this.setTags(v);
    	}


    	/********************* Rendering ****************************/

    	// render the note's message data into a string output
    	async render(handler, set = new Set) {
    		const
    			note = this[RUMINATE_NOTE_BODY],
    			ruminate = this[RUMINATE_REFERENCE];

    		if (handler) {
    			return handler("string", note.body);
    			for (const value of parser(whind(note.body))) {
    				if (typeof value == "string")
    					await handler("string", value);
    				else {
    					const notes = await ruminate.retrieve(value.value);
    					await handler("notes", notes, value);
    				}
    			}
    			handler("complete");
    		} else {

    			if (!set.has(this.uid.string))
    				set.add(this.uid.string);

    			var strings = [],
    				start = 0,
    				body = this.body;

    			for (const junction of parser(whind(note.body))) {

    				strings.push(body.slice(start, junction.start));

    				start = junction.end;

    				for (const note of await ruminate.retrieve(junction.query)) {

    					if (set.has(note.uid.string))
    						continue;

    					if (note)
    						strings.push(await note.render(handler, new Set(set)));
    				}

    			}

    			strings.push(body.slice(start));

    			return strings.join("");
    		}
    	}
    }

    observer_mixin("update", Note.prototype);

    // ((graze pull: use js_comments : graze/docs/functions/common/options.js : options, common ))
    // Parses options from an object and updates the target according to parameters in option_params
    // options is an object
    // target is an object
    // target_name is a string used for warning messages. 
    //
    // options_params is a Map that contains [key, value] pairs of the type [string_name, object_pro]:
    //
    //      The [string_name] is the name of the option. It is matched to the option key names and should be a lower case phrase or word.
    //
    //      The [object]'s [keys] and associated [values] are 
    //
    //          value : [Function | String | Symbol ] -
    // 
    //                  This selects the type of action that is performed when a matching option
    //                  is encountered. values with typeof Function will be called with thie target as the this object
    //                  and the [option_value] of the option matching [option_key] as its only argument. 
    //                                                          
    //                  Values of type String or Symbol will be will be used to lookup the associated property in target
    //                  which is then assigned the [option_value] of the option property [option_key].
    //
    //          parse *optional* : Array of [Function | Any] - 
    //
    //                  Used to convert and or validate the [option_value] before it is applied as an argument or a property value.
    //                  If the parse function returns value of [undefined | NaN | null] then the next parse object in the array is
    //                  used to process the value. 
    //
    //                  The last option may be of any type and will be assigned to the value if the preceding parse
    //                  entries failed to yield an acceptable value.
    //      
    //                  If after using all parse entries to render a value the value is still [undefined | null] the
    //                  option will not be considered at all.
    //    

    function NumberIsNaN(value) {
        return typeof value === "number" && isNaN(value);
    }

    function OptionHandler(options = null, target = null, target_name = "", option_params = null) {
        if (!(option_params instanceof Map))
            throw new Error("Option paramaters for [" + target_name + "] need to be placed within a Map")

        // Parser for handling options
        if (options && typeof options == "object" && !Array.isArray(options))
            for (let name in options) {

                name = name.toLowerCase();

                const option_param = option_params.get(name);

                if (option_param) {
                    let parse = option_param.parse;

                    if (!option_param.parse) parse = [e => e];

                    if (!Array.isArray(parse))
                        parse = [parse];

                    const original_value = options[name];
                    let value = null,
                        index = 0;

                    while ((value === null || value === undefined || NumberIsNaN(value))
                        && index < parse.length) {

                        if (typeof parse[index] == "function")
                            value = parse[index++](original_value);
                        else if (parse[index] === original_value) {
                            value = parse[index++];
                            break;
                        }else{
                            value = parse[index++];
                        }
                    }

                    if (value === undefined || NumberIsNaN(value)) {
                        console.warn(`${target_name} option [${name}] does not accept value [${value}] of type ${typeof value}.`);
                        break;
                    }

                    switch (typeof option_param.value) {
                        case "function":
                            option_param.value.call(target, value);
                            break;
                        case "symbol":
                        case "string":
                            target[option_param.value] = value;
                            break;
                    }
                } else {
                    const closest = []; //fuzzy.closest([...acceptable_options.keys()], 3, 4);
                    console.warn(`${target_name} does not have option [${name}]. ${closes.length > 0 ? `Did you mean ${closest.join(" , ")}?` : ""}`);
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

    function loopRL(search_string, match_string, search_window, base){
    	
    	const check = search_string[search_string.length-1];

    	if(base == 0)
    		base = search_string.length-1;

    	const s_len = search_string.length,
    		m_len = match_string.length;

    	while(base < m_len){

    		while(match_string[++base] !== check){
    			if(base >= m_len)
    				return {score:-1}
    		}

    		let mi = base,
    			floor = Math.max(base-search_window, -1),
    			si = s_len-2,
    			score = 0,
    			char = search_string[si],
    			matches = [],
    			match = 1;

    		while(si > -1 && --mi > floor){

    			if(char == match_string[mi]){
    				match++;
    				char = search_string[--si];
    			}else{
    				if(match > 0)
    					matches.unshift(mi+1, match);

    				match = 0;
    				
    				score++;
    			}
    		}

    		if(si == -1){
    			matches.unshift(mi, match);
    			return {score, matches, skip : mi + s_len + 2}
    		} else{
    			base += s_len - si - 1;
    		}
    	}

    	return  {score:-1}
    }

    function loopLR(search_string, match_string, search_window, base){
    	const check = search_string[0];

    	if(base == 0)
    		base--;

    	if(base >= match_string.length)
    		return {score:-1}

    	const s_len = search_string.length,
    		m_len = match_string.length;

    	while(base < m_len){

    		while(match_string[++base] !== check){
    			if(base >= m_len)
    				return {score:-1}
    		}

    		let mi = base,
    			ceil = Math.min(base+search_window, m_len),
    			si = 1,
    			score = 0,
    			char = search_string[si],
    			matches = [],
    			match = 1;

    		while(si < s_len && ++mi < ceil){

    			if(char == match_string[mi]){
    				match++;
    				char = search_string[++si];
    			}else{
    				if(match > 0)
    					matches.push(mi-match, match);

    				match = 0;
    				
    				score++;
    			}
    		}

    		if(si == s_len){
    			matches.push(mi-match+1, match);
    			return {score, matches, skip:base + si - 1}
    		} else{
    			base += si - 1;
    		}
    	}

    	return  {score:-1}
    }



    function fuzzy(search_string, match_string, BEST = false, search_window = search_string.length << 1){

    	if(search_string.length > match_string.length)
    		return {score:-1};

    	if(search_string.length == match_string.length)
    		if(search_string == match_string)
    			return {score:0, matches : [{index:0, str: search_string}]}
    		else 
    			return {score:-1};

    	search_window = Math.min(Math.max(search_window, search_string.length + 2), match_string.length);


    	var base = 0;

    	if(BEST){
    		var result = null, results = [];

    		while((result = loopLR(search_string, match_string, search_window, base)).score > -1)
    			results.push(result), base = result.skip;

    		return results.length > 0 ? results.sort((a,b)=> a.score < b.score ? -1 : 1).shift() : {score:-1}
    	}
    	/* First */
    	else return loopLR(search_string, match_string, search_window, base);
    }

    fuzzy.closest = function(search_strings, match_string){

    };

    class Ruminate {

        constructor(options) {
            //Private

            //Queue of notes that need to be synced with the server. 
            this[RUMINATE_UPDATE_QUEUE] = [];

            //The server that stores the data and provides query functionality.
            this[RUMINATE_SERVER] = null;

            //Store of notes that have been pulled from server. Indexed by uid.
            this[RUMINATE_NOTES] = new Map();

            // The rate at which to synchronize the active notes with the server. 
            // Value is in milliseconds. Default is 5 seconds.        
            this[RUMINATE_SYNC_RATE] = 5000;

            // Reference to the synchronization interval index 
            this[RUMINATE_SYNC_INTERVAL_REF] = -1;

            this.lastCheck = Date.now();

            // List of options that are accepted by ruminate
            const acceptable_options = new Map([
                ["server", { value: this.connect }],
                ["sync_rate", { value: "sync_rate", parse: [parseInt, null, undefined] }]
            ]);

            OptionHandler(options, this, "Graze", acceptable_options);
        }

        //******************************** SERVER ********************************//

        /* Connects the Graze instance to a server */
        connect(server) {

            //Check for appropiate server methods
            const storeNote = (typeof server.storeNote == "function") | 0;
            const removeNote = (typeof server.removeNote == "function") | 0;
            const implode = (typeof server.implode == "function") | 0;
            const getUpdatedUIDs = (typeof server.getUpdatedUIDs == "function") | 0;
            const query = (typeof server.query == "function") | 0;

            const ACCEPTABLE = !!((storeNote & removeNote & implode & getUpdatedUIDs & query) | 0);

            if (!ACCEPTABLE) {
                const error_message = ["Server object is not suitable. " + server.type + ":"];

                if (!storeNote)
                    storeNote.push(`\tThe method "storeNote" ([note]) is not present`);
                if (!getUpdatedUIDs)
                    error_message.push(`\tThe method "getUpdatedUIDs" ([Date]) is not present`);
                if (!removeNote)
                    error_message.push(`\tThe method "removeNote" ([note | uid]) is not present`);
                if (!query)
                    error_message.push(`\tThe method "query" ([string | UID, UID, ...]) is not present`);
                if (!implode)
                    error_message.push(`\tThe method "implode" () is not present`);

                throw new Error(error_message.join("\n"))
            }

            this[RUMINATE_SERVER] = server;
        }

        /* Disconnects from the connected server */
        disconnect() {

            if (!this[RUMINATE_SERVER])
                return false;

            this[RUMINATE_SERVER] = null;

            return true;
        }

        //************************** SYNCHRONIZATION ******************************//

        [RUMINATE_UPDATE_QUEUE_ALERT](note_ref) {
            this[RUMINATE_UPDATE_QUEUE].push(note_ref);
        }

        // Accepts a numerical value with the type milliseconds
        // sets the rate at which ruminate synchonizes with the server.
        // minimum value is 1000    (one second);
        // maximum value is 3600000 (one hour);
        // If the value passed is null, the synchronization is disabled. 
        set sync_rate(value) {
            if (value === null) this[RUMINATE_SYNC_RATE] = -1;
            else
                this[RUMINATE_SYNC_RATE] = Math.min(3600000, Math.max(1000, parseInt(value) || 1000));
            this.setAutoSync(RUMINATE_SYNC_RATE, RUMINATE_SYNC_INTERVAL_REF);
        }

        get sync_rate() {
            return this[RUMINATE_SYNC_RATE];
        }

        //Sets the synchronization 
        setAutoSync(rate_symbol, interval_reference) {
            if (rate_symbol === RUMINATE_SYNC_RATE && RUMINATE_SYNC_INTERVAL_REF === interval_reference) {

                if (this[interval_reference] > -1)
                    clearInterval(this[interval_reference]);

                if (this[rate_symbol] > 0)
                    this[interval_reference] = setInterval(this.sync.bind(this), this[rate_symbol]);
            }
        }

        // Synchronizes changed notes with the server and updates the local cache 
        // with any notes that have been changed remotely. **Candidate for web worker**
        async sync() {
            const server = this[RUMINATE_SERVER],
                queue = this[RUMINATE_UPDATE_QUEUE];

            if (server) {

                //get all updated notes from the store. 
                const uids = await server.getUpdatedUIDs(this.lastCheck);

                if (uids.length > 0)
                    this.lastCheck = Date.now();

                for (const uid of uids)
                    this.retrieve(uid);

                const out_queue = queue.slice();

                queue.length = 0;

                if (out_queue.length > 0) {

                    for (const note of out_queue) {

                        const RESULT = (await server.storeNote(note[RUMINATE_NOTE_PREPARE_FOR_SERVER]()));

                        if (!RESULT) {
                            console.warn(`Unable to sync note ${id} with uid ${note.uid}`);
                        } else {
                            note[RUMINATE_NOTE_BODY].modified = (new Date).valueOf();
                        }

                        note[RUMINATE_NOTE_SYNC](RESULT);
                    }
                }


            } else
                this.sync_rate = null; //Make sure auto sync is off.
        }

        //*************************** NOTE HANDLING *********************************//

        // Removes all notes from the Graze instance. Any existing client notes will still exists,
        // and can be reconnected by changing one of its values.
        purgeCache() {
            this[RUMINATE_NOTES] = new Map;
        }

        createUID() { return new UID }

        get sort_indexes() { return NoteContainer.sort_indexes; }

        // Deprecate in favor of sync
        async store(...vals) {
            var RESULT = 0,
                note;

            for (const candidate of vals) {

                if (!(note = candidate.__ruminate_retrieve_note__))
                    note = candidate;

                RESULT += (await this[RUMINATE_SERVER].storeNote(note)) | 0;
            }

            return RESULT;
        }

        // Retrieves notes from server based on query. 
        // Caches all notes received from server.
        // Returns a NoteContainer with all notes reveived.
        // Returns null of no notes matched query.
        async retrieve(
            query // Query string
        ) {

            const
                output = [],
                results = await this[RUMINATE_SERVER].query(query);


            if (results) {
                for (const note_data of results) {
                    const uid = note_data.uid.toString();
                    if (!note_data) continue;

                    if (!this[RUMINATE_NOTES].has(uid)) {
                        this[RUMINATE_NOTES].set(uid, new Note(
                            this,
                            new UID(uid),
                            note_data.id,
                            note_data.tags,
                            note_data.body,
                            note_data.refs || [],
                            note_data.modified,
                            false
                        ));
                    } else {
                        this[RUMINATE_NOTES].get(uid)[RUMINATE_NOTE_UPDATE](note_data);
                    }

                    output.push(this[RUMINATE_NOTES].get(uid));
                }
            }

            return new NoteContainer(...output);
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
                throw new Error(`ruminate.createNote: [note_tags] argument must be a string of comma separated values or an array of [strings | numbers].Got $ { note_tags.map(e => typeof e) }`);
            }

            if (typeof body !== "string")
                throw new Error("body argument must be a string value");

            if (!(uid instanceof UID))
                throw new Error("uid argument must be a UID instance");

            const note = new Note(
                this,
                uid,
                note_id,
                note_tags,
                body,
                [],
                Date.now() | 0,
                true, // Auto sync with server
                RUMINATE_NOTES
            );

            this[RUMINATE_NOTES].set(uid.toString(), note);

            return note;
        }
    }

    const uri_reg_ex = /(?:([a-zA-Z][\dA-Za-z\+\.\-]*)(?:\:\/\/))?(?:([a-zA-Z][\dA-Za-z\+\.\-]*)(?:\:([^\<\>\:\?\[\]\@\/\#\b\s]*)?)?\@)?(?:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|((?:\[[0-9a-f]{1,4})+(?:\:[0-9a-f]{0,4}){2,7}\])|([^\<\>\:\?\[\]\@\/\#\b\s\.]{2,}(?:\.[^\<\>\:\?\[\]\@\/\#\b\s]*)*))?(?:\:(\d+))?((?:[^\?\[\]\#\s\b]*)+)?(?:\?([^\[\]\#\s\b]*))?(?:\#([^\#\s\b]*))?/i;
>>>>>>> origin/temp

    const STOCK_LOCATION = {
        protocol: "",
        host: "",
        port: "",
        path: "",
        hash: "",
        query: "",
        search: ""
    };

    /** Implement Basic Fetch Mechanism for NodeJS **/
    if (typeof(fetch) == "undefined" && typeof(global) !== "undefined") {
        (async () => {
            const fs = (await import('fs')).default.promises;
            const path = (await import('path')).default;
            global.fetch = (url, data) =>
                new Promise(async (res, rej) => {
                    let p = await path.resolve(process.cwd(), (url[0] == ".") ? url + "" : "." + url);
                    try {
                        let data = await fs.readFile(p, "utf8");
                        return res({
                            status: 200,
                            text: () => {
                                return {
                                    then: (f) => f(data)
                                }
                            }
                        })
                    } catch (err) {
                        return rej(err);
                    }
                });
        })();
    }

    function fetchLocalText(URL, m = "same-origin") {
        return new Promise((res, rej) => {
            fetch(URL, {
                mode: m, // CORs not allowed
                credentials: m,
                method: "Get"
            }).then(r => {
                if (r.status < 200 || r.status > 299)
                    r.text().then(rej);
                else
                    r.text().then(res);
            }).catch(e => rej(e));
        });
    }

    function fetchLocalJSON(URL, m = "same-origin") {
        return new Promise((res, rej) => {
            fetch(URL, {
                mode: m, // CORs not allowed
                credentials: m,
                method: "Get"
            }).then(r => {
                if (r.status < 200 || r.status > 299)
                    r.json().then(rej);
                else
                    r.json().then(res).catch(rej);
            }).catch(e => rej(e));
        });
    }

    function submitForm(URL, form_data, m = "same-origin") {
        return new Promise((res, rej) => {
            var form;

            if (form_data instanceof FormData)
                form = form_data;
            else {
                form = new FormData();
                for (let name in form_data)
                    form.append(name, form_data[name] + "");
            }

            fetch(URL, {
                mode: m, // CORs not allowed
                credentials: m,
                method: "POST",
                body: form,
            }).then(r => {
                if (r.status < 200 || r.status > 299)
                    r.text().then(rej);
                else
                    r.json().then(res);
            }).catch(e => e.text().then(rej));
        });
    }

    function submitJSON(URL, json_data, m = "same-origin") {
        return new Promise((res, rej) => {
            fetch(URL, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                mode: m, // CORs not allowed
                credentials: m,
                method: "POST",
                body: JSON.stringify(json_data),
            }).then(r => {
                if (r.status < 200 || r.status > 299)
                    r.json().then(rej);
                else
                    r.json().then(res);
            }).catch(e => e.text().then(rej));
        });
    }



    /**
     * Used for processing URLs, handling `document.location`, and fetching data.
     * @param      {string}   url           The URL string to wrap.
     * @param      {boolean}  USE_LOCATION  If `true` missing URL parts are filled in with data from `document.location`. 
     * @return     {URL}   If a falsy value is passed to `url`, and `USE_LOCATION` is `true` a Global URL is returned. This is directly linked to the page and will _update_ the actual page URL when its values are change. Use with caution. 
     * @alias URL
     * @memberof module:wick.core.network
     */
    class URL {

        static resolveRelative(URL_or_url_original, URL_or_url_new) {

            let URL_old = (URL_or_url_original instanceof URL) ? URL_or_url_original : new URL(URL_or_url_original);
            let URL_new = (URL_or_url_new instanceof URL) ? URL_or_url_new : new URL(URL_or_url_new);

            let new_path = "";
            if (URL_new.path[0] != "/") {

                let a = URL_old.path.split("/");
                let b = URL_new.path.split("/");


                if (b[0] == "..") a.splice(a.length - 1, 1);
                for (let i = 0; i < b.length; i++) {
                    switch (b[i]) {
                        case "..":
                        case ".":
                            a.splice(a.length - 1, 1);
                            break;
                        default:
                            a.push(b[i]);
                    }
                }
                URL_new.path = a.join("/");
            }


            return URL_new;
        }

        constructor(url = "", USE_LOCATION = false) {

            let IS_STRING = true,
                IS_LOCATION = false;


            let location = (typeof(document) !== "undefined") ? document.location : STOCK_LOCATION;

            if (url instanceof Location) {
                location = url;
                url = "";
                IS_LOCATION = true;
            }
            if (!url || typeof(url) != "string") {
                IS_STRING = false;
                IS_LOCATION = true;
                if (URL.GLOBAL && USE_LOCATION)
                    return URL.GLOBAL;
            }

            /**
             * URL protocol
             */
            this.protocol = "";

            /**
             * Username string
             */
            this.user = "";

            /**
             * Password string
             */
            this.pwd = "";

            /**
             * URL hostname
             */
            this.host = "";

            /**
             * URL network port number.
             */
            this.port = 0;

            /**
             * URL resource path
             */
            this.path = "";

            /**
             * URL query string.
             */
            this.query = "";

            /**
             * Hashtag string
             */
            this.hash = "";

            /**
             * Map of the query data
             */
            this.map = null;

            if (IS_STRING) {
                if (url instanceof URL) {
                    this.protocol = url.protocol;
                    this.user = url.user;
                    this.pwd = url.pwd;
                    this.host = url.host;
                    this.port = url.port;
                    this.path = url.path;
                    this.query = url.query;
                    this.hash = url.hash;
                } else {
                    let part = url.match(uri_reg_ex);
                    this.protocol = part[1] || ((USE_LOCATION) ? location.protocol : "");
                    this.user = part[2] || "";
                    this.pwd = part[3] || "";
                    this.host = part[4] || part[5] || part[6] || ((USE_LOCATION) ? location.hostname : "");
                    this.port = parseInt(part[7] || ((USE_LOCATION) ? location.port : 0));
                    this.path = part[8] || ((USE_LOCATION) ? location.pathname : "");
                    this.query = part[9] || ((USE_LOCATION) ? location.search.slice(1) : "");
                    this.hash = part[10] || ((USE_LOCATION) ? location.hash.slice(1) : "");

                }
            } else if (IS_LOCATION) {
                this.protocol = location.protocol.replace(/\:/g,"");
                this.host = location.hostname;
                this.port = location.port;
                this.path = location.pathname;
                this.hash = location.hash.slice(1);
                this.query = location.search.slice(1);
                this._getQuery_(this.query);

                if (USE_LOCATION) {
                    URL.G = this;
                    return URL.R;
                }
            }
            this._getQuery_(this.query);
        }


        /**
        URL Query Syntax

        root => [root_class] [& [class_list]]
             => [class_list]

        root_class = key_list

        class_list [class [& key_list] [& class_list]]

        class => name & key_list

        key_list => [key_val [& key_list]]

        key_val => name = val

        name => ALPHANUMERIC_ID

        val => NUMBER
            => ALPHANUMERIC_ID
        */

        /**
         * Pulls query string info into this.map
         * @private
         */
        _getQuery_() {
            let map = (this.map) ? this.map : (this.map = new Map());

            let lex = whind(this.query);


            const get_map = (k, m) => (m.has(k)) ? m.get(k) : m.set(k, new Map).get(k);

            let key = 0,
                key_val = "",
                class_map = get_map(key_val, map),
                lfv = 0;

            while (!lex.END) {
                switch (lex.tx) {
                    case "&": //At new class or value
                        if (lfv > 0)
                            key = (class_map.set(key_val, lex.s(lfv)), lfv = 0, lex.n.pos);
                        else {
                            key_val = lex.s(key);
                            key = (class_map = get_map(key_val, map), lex.n.pos);
                        }
                        continue;
                    case "=":
                        //looking for a value now
                        key_val = lex.s(key);
                        lfv = lex.n.pos;
                        continue;
                }
                lex.n;
            }

            if (lfv > 0) class_map.set(key_val, lex.s(lfv));
        }

        setPath(path) {

            this.path = path;

            return new URL(this);
        }

        setLocation() {
            history.replaceState({}, "replaced state", `${this}`);
            window.onpopstate();
        }

        toString() {
            let str = [];

            if (this.host) {

                if (this.protocol)
                    str.push(`${this.protocol}://`);

                str.push(`${this.host}`);
            }

            if (this.port)
                str.push(`:${this.port}`);

            if (this.path)
                str.push(`${this.path[0] == "/" ? "" : "/"}${this.path}`);

            if (this.query)
                str.push(((this.query[0] == "?" ? "" : "?") + this.query));

            if (this.hash)
                str.push("#"+this.hash);


            return str.join("");
        }

        /**
         * Pulls data stored in query string into an object an returns that.
         * @param      {string}  class_name  The class name
         * @return     {object}  The data.
         */
        getData(class_name = "") {
            if (this.map) {
                let out = {};
                let _c = this.map.get(class_name);
                if (_c) {
                    for (let [key, val] of _c.entries())
                        out[key] = val;
                    return out;
                }
            }
            return null;
        }

        /**
         * Sets the data in the query string. Wick data is added after a second `?` character in the query field, and appended to the end of any existing data.
         * @param      {string}  class_name  Class name to use in query string. Defaults to root, no class 
         * @param      {object | Model | AnyModel}  data        The data
         */
        setData(data = null, class_name = "") {

            if (data) {

                let map = this.map = new Map();

                let store = (map.has(class_name)) ? map.get(class_name) : (map.set(class_name, new Map()).get(class_name));

                //If the data is a falsy value, delete the association.

                for (let n in data) {
                    if (data[n] !== undefined && typeof data[n] !== "object")
                        store.set(n, data[n]);
                    else
                        store.delete(n);
                }

                //set query
                let class_, null_class, str = "";

                if ((null_class = map.get(""))) {
                    if (null_class.size > 0) {
                        for (let [key, val] of null_class.entries())
                            str += `&${key}=${val}`;

                    }
                }

                for (let [key, class_] of map.entries()) {
                    if (key === "")
                        continue;
                    if (class_.size > 0) {
                        str += `&${key}`;
                        for (let [key, val] of class_.entries())
                            str += `&${key}=${val}`;
                    }
                }

                str = str.slice(1);

                this.query = this.query.split("?")[0] + "?" + str;

                if (URL.G == this)
                    this.goto();
            } else {
                this.query = "";
            }

            return this;

        }

        /**
         * Fetch a string value of the remote resource. 
         * Just uses path component of URL. Must be from the same origin.
         * @param      {boolean}  [ALLOW_CACHE=true]  If `true`, the return string will be cached. If it is already cached, that will be returned instead. If `false`, a network fetch will always occur , and the result will not be cached.
         * @return     {Promise}  A promise object that resolves to a string of the fetched value.
         */
        fetchText(ALLOW_CACHE = true) {

            if (ALLOW_CACHE) {

                let resource = URL.RC.get(this.path);

                if (resource)
                    return new Promise((res) => {
                        res(resource);
                    });
            }

            return fetchLocalText(this.path).then(res => (URL.RC.set(this.path, res), res));
        }

        /**
         * Fetch a JSON value of the remote resource. 
         * Just uses path component of URL. Must be from the same origin.
         * @param      {boolean}  [ALLOW_CACHE=true]  If `true`, the return string will be cached. If it is already cached, that will be returned instead. If `false`, a network fetch will always occur , and the result will not be cached.
         * @return     {Promise}  A promise object that resolves to a string of the fetched value.
         */
        fetchJSON(ALLOW_CACHE = true) {

            let string_url = this.toString();

            if (ALLOW_CACHE) {

                let resource = URL.RC.get(string_url);

                if (resource)
                    return new Promise((res) => {
                        res(resource);
                    });
            }

            return fetchLocalJSON(string_url).then(res => (URL.RC.set(this.path, res), res));
        }

        /**
         * Cache a local resource at the value 
         * @param    {object}  resource  The resource to store at this URL path value.
         * @returns {boolean} `true` if a resource was already cached for this URL, false otherwise.
         */
        cacheResource(resource) {

            let occupied = URL.RC.has(this.path);

            URL.RC.set(this.path, resource);

            return occupied;
        }

        submitForm(form_data) {
            return submitForm(this.toString(), form_data);
        }

        submitJSON(json_data) {
            return submitJSON(this.toString(), json_data);
        }
        /**
         * Goes to the current URL.
         */
        goto() {
            return;
            let url = this.toString();
            history.pushState({}, "ignored title", url);
            window.onpopstate();
            URL.G = this;
        }

        get pathname() {
            return this.path;
        }

        get href() {
            return this.toString();
        }
    }

    /**
     * The fetched resource cache.
     */
    URL.RC = new Map();

    /**
     * The Default Global URL object. 
     */
    URL.G = null;

    /**
     * The Global object Proxy.
     */
    URL.R = {
        get protocol() {
            return URL.G.protocol;
        },
        set protocol(v) {
            return;
            URL.G.protocol = v;
        },
        get user() {
            return URL.G.user;
        },
        set user(v) {
            return;
            URL.G.user = v;
        },
        get pwd() {
            return URL.G.pwd;
        },
        set pwd(v) {
            return;
            URL.G.pwd = v;
        },
        get host() {
            return URL.G.host;
        },
        set host(v) {
            return;
            URL.G.host = v;
        },
        get port() {
            return URL.G.port;
        },
        set port(v) {
            return;
            URL.G.port = v;
        },
        get path() {
            return URL.G.path;
        },
        set path(v) {
            return;
            URL.G.path = v;
        },
        get query() {
            return URL.G.query;
        },
        set query(v) {
            return;
            URL.G.query = v;
        },
        get hash() {
            return URL.G.hash;
        },
        set hash(v) {
            return;
            URL.G.hash = v;
        },
        get map() {
            return URL.G.map;
        },
        set map(v) {
            return;
            URL.G.map = v;
        },
        setPath(path) {
            return URL.G.setPath(path);
        },
        setLocation() {
            return URL.G.setLocation();
        },
        toString() {
            return URL.G.toString();
        },
        getData(class_name = "") {
            return URL.G.getData(class_name = "");
        },
        setData(class_name = "", data = null) {
            return URL.G.setData(class_name, data);
        },
        fetchText(ALLOW_CACHE = true) {
            return URL.G.fetchText(ALLOW_CACHE);
        },
        cacheResource(resource) {
            return URL.G.cacheResource(resource);
        }
    };
    Object.freeze(URL.R);
    Object.freeze(URL.RC);
    Object.seal(URL);

    /**
     * To be extended by objects needing linked list methods.
     */
    const LinkedList = {

        props: {
            /**
             * Properties for horizontal graph traversal
             * @property {object}
             */
            defaults: {
                /**
                 * Next sibling node
                 * @property {object | null}
                 */
                nxt: null,

                /**
                 * Previous sibling node
                 * @property {object | null}
                 */
                prv: null
            },

            /**
             * Properties for vertical graph traversal
             * @property {object}
             */
            children: {
                /**
                 * Number of children nodes.
                 * @property {number}
                 */
                noc: 0,
                /**
                 * First child node
                 * @property {object | null}
                 */
                fch: null,
            },
            parent: {
                /**
                 * Parent node
                 * @property {object | null}
                 */
                par: null
            }
        },

        methods: {
            /**
             * Default methods for Horizontal traversal
             */
            defaults: {

                insertBefore: function(node) {

                    if (!this.nxt && !this.prv) {
                        this.nxt = this;
                        this.prv = this;
                    }

                    if(node){
                        if (node.prv)
                           node.prv.nxt = node.nxt;
                        
                        if(node.nxt) 
                            node.nxt.prv = node.prv;
                    
                        node.prv = this.prv;
                        node.nxt = this;
                        this.prv.nxt = node;
                        this.prv = node;
                    }else{
                        if (this.prv)
                            this.prv.nxt = node;
                        this.prv = node;
                    } 
                },

                insertAfter: function(node) {

                    if (!this.nxt && !this.prv) {
                        this.nxt = this;
                        this.prv = this;
                    }

                    if(node){
                        if (node.prv)
                           node.prv.nxt = node.nxt;
                        
                        if(node.nxt) 
                            node.nxt.prv = node.prv;
                    
                        node.nxt = this.nxt;
                        node.prv = this;
                        this.nxt.prv = node;
                        this.nxt = node;
                    }else{
                        if (this.nxt)
                            this.nxt.prv = node;
                        this.nxt = node;
                    } 
                }
            },
            /**
             * Methods for both horizontal and vertical traversal.
             */
            parent_child: {
                /**
                 *  Returns eve. 
                 * @return     {<type>}  { description_of_the_return_value }
                 */
                root() {
                    return this.eve();
                },
                /**
                 * Returns the root node. 
                 * @return     {Object}  return the very first node in the linked list graph.
                 */
                eve() {
                    if (this.par)
                        return this.par.eve();
                    return this;
                },

                push(node) {
                    this.addChild(node);
                },

                unshift(node) {
                    this.addChild(node, (this.fch) ? this.fch.pre : null);
                },

                replace(old_node, new_node) {
                    if (old_node.par == this && old_node !== new_node) {
                        if (new_node.par) new_node.par.remove(new_node);

                        if (this.fch == old_node) this.fch = new_node;
                        new_node.par = this;


                        if (old_node.nxt == old_node) {
                            new_node.nxt = new_node;
                            new_node.prv = new_node;
                        } else {
                            new_node.prv = old_node.prv;
                            new_node.nxt = old_node.nxt;
                            old_node.nxt.prv = new_node;
                            old_node.prv.nxt = new_node;
                        }

                        old_node.par = null;
                        old_node.prv = null;
                        old_node.nxt = null;
                    }
                },

                insertBefore: function(node) {
                    if (this.par)
                        this.par.addChild(node, this.pre);
                    else
                        LinkedList.methods.defaults.insertBefore.call(this, node);
                },

                insertAfter: function(node) {
                    if (this.par)
                        this.par.addChild(node, this);
                    else
                        LinkedList.methods.defaults.insertAfter.call(this, node);
                },

                addChild: function(child = null, prev = null) {

                    if (!child) return;

                    if (child.par)
                        child.par.removeChild(child);

                    if (prev && prev.par && prev.par == this) {
                        if (child == prev) return;
                        child.prv = prev;
                        prev.nxt.prv = child;
                        child.nxt = prev.nxt;
                        prev.nxt = child;
                    } else if (this.fch) {
                        child.prv = this.fch.prv;
                        this.fch.prv.nxt = child;
                        child.nxt = this.fch;
                        this.fch.prv = child;
                    } else {
                        this.fch = child;
                        child.nxt = child;
                        child.prv = child;
                    }

                    child.par = this;
                    this.noc++;
                },

                /**
                 * Analogue to HTMLElement.removeChild()
                 *
                 * @param      {HTMLNode}  child   The child
                 */
                removeChild: function(child) {
                    if (child.par && child.par == this) {
                        child.prv.nxt = child.nxt;
                        child.nxt.prv = child.prv;

                        if (child.prv == child || child.nxt == child) {
                            if (this.fch == child)
                                this.fch = null;
                        } else if (this.fch == child)
                            this.fch = child.nxt;

                        child.prv = null;
                        child.nxt = null;
                        child.par = null;
                        this.noc--;
                    }
                },

                /**
                 * Gets the next node. 
                 *
                 * @param      {HTMLNode}  node    The node to get the sibling of.
                 * @return {HTMLNode | TextNode | undefined}
                 */
                getNextChild: function(node = this.fch) {
                    if (node && node.nxt != this.fch && this.fch)
                        return node.nxt;
                    return null;
                },

                /**
                 * Gets the child at index.
                 *
                 * @param      {number}  index   The index
                 */
                getChildAtIndex: function(index, node = this.fch) {
                    if(node.par !== this)
                        node = this.fch;

                    let first = node;
                    let i = 0;
                    while (node && node != first) {
                        if (i++ == index)
                            return node;
                        node = node.nxt;
                    }

                    return null;
                },
            }
        },

        gettersAndSetters : {
            peer : {
                next: {
                    enumerable: true,
                    configurable: true,
                    get: function() {
                        return this.nxt;
                    },
                    set: function(n) {
                        this.insertAfter(n);
                    }
                },
                previous: {
                    enumerable: true,
                    configurable: true,
                    get: function() {
                        return this.prv;
                    },
                    set: function(n) {
                        this.insertBefore(n);
                    }   
                }
<<<<<<< HEAD
=======
            };
        }
    };

    Object.freeze(URL.R);
    Object.freeze(URL.RC);
    Object.seal(URL);

    /**
     * To be extended by objects needing linked list methods.
     */
    const LinkedList = {

        props: {
            /**
             * Properties for horizontal graph traversal
             * @property {object}
             */
            defaults: {
                /**
                 * Next sibling node
                 * @property {object | null}
                 */
                nxt: null,

                /**
                 * Previous sibling node
                 * @property {object | null}
                 */
                prv: null
            },

            /**
             * Properties for vertical graph traversal
             * @property {object}
             */
            children: {
                /**
                 * Number of children nodes.
                 * @property {number}
                 */
                noc: 0,
                /**
                 * First child node
                 * @property {object | null}
                 */
                fch: null,
            },
            parent: {
                /**
                 * Parent node
                 * @property {object | null}
                 */
                par: null
            }
        },

        methods: {
            /**
             * Default methods for Horizontal traversal
             */
            defaults: {

                insertBefore: function(node) {

                    if (!this.nxt && !this.prv) {
                        this.nxt = this;
                        this.prv = this;
                    }

                    if(node){
                        if (node.prv)
                           node.prv.nxt = node.nxt;
                        
                        if(node.nxt) 
                            node.nxt.prv = node.prv;
                    
                        node.prv = this.prv;
                        node.nxt = this;
                        this.prv.nxt = node;
                        this.prv = node;
                    }else{
                        if (this.prv)
                            this.prv.nxt = node;
                        this.prv = node;
                    } 
                },

                insertAfter: function(node) {

                    if (!this.nxt && !this.prv) {
                        this.nxt = this;
                        this.prv = this;
                    }

                    if(node){
                        if (node.prv)
                           node.prv.nxt = node.nxt;
                        
                        if(node.nxt) 
                            node.nxt.prv = node.prv;
                    
                        node.nxt = this.nxt;
                        node.prv = this;
                        this.nxt.prv = node;
                        this.nxt = node;
                    }else{
                        if (this.nxt)
                            this.nxt.prv = node;
                        this.nxt = node;
                    } 
                }
            },
            /**
             * Methods for both horizontal and vertical traversal.
             */
            parent_child: {
                /**
                 *  Returns eve. 
                 * @return     {<type>}  { description_of_the_return_value }
                 */
                root() {
                    return this.eve();
                },
                /**
                 * Returns the root node. 
                 * @return     {Object}  return the very first node in the linked list graph.
                 */
                eve() {
                    if (this.par)
                        return this.par.eve();
                    return this;
                },

                push(node) {
                    this.addChild(node);
                },

                unshift(node) {
                    this.addChild(node, (this.fch) ? this.fch.pre : null);
                },

                replace(old_node, new_node) {
                    if (old_node.par == this && old_node !== new_node) {
                        if (new_node.par) new_node.par.remove(new_node);

                        if (this.fch == old_node) this.fch = new_node;
                        new_node.par = this;


                        if (old_node.nxt == old_node) {
                            new_node.nxt = new_node;
                            new_node.prv = new_node;
                        } else {
                            new_node.prv = old_node.prv;
                            new_node.nxt = old_node.nxt;
                            old_node.nxt.prv = new_node;
                            old_node.prv.nxt = new_node;
                        }

                        old_node.par = null;
                        old_node.prv = null;
                        old_node.nxt = null;
                    }
                },

                insertBefore: function(node) {
                    if (this.par)
                        this.par.addChild(node, this.pre);
                    else
                        LinkedList.methods.defaults.insertBefore.call(this, node);
                },

                insertAfter: function(node) {
                    if (this.par)
                        this.par.addChild(node, this);
                    else
                        LinkedList.methods.defaults.insertAfter.call(this, node);
                },

                addChild: function(child = null, prev = null) {

                    if (!child) return;

                    if (child.par)
                        child.par.removeChild(child);

                    if (prev && prev.par && prev.par == this) {
                        if (child == prev) return;
                        child.prv = prev;
                        prev.nxt.prv = child;
                        child.nxt = prev.nxt;
                        prev.nxt = child;
                    } else if (this.fch) {
                        child.prv = this.fch.prv;
                        this.fch.prv.nxt = child;
                        child.nxt = this.fch;
                        this.fch.prv = child;
                    } else {
                        this.fch = child;
                        child.nxt = child;
                        child.prv = child;
                    }

                    child.par = this;
                    this.noc++;
                },

                /**
                 * Analogue to HTMLElement.removeChild()
                 *
                 * @param      {HTMLNode}  child   The child
                 */
                removeChild: function(child) {
                    if (child.par && child.par == this) {
                        child.prv.nxt = child.nxt;
                        child.nxt.prv = child.prv;

                        if (child.prv == child || child.nxt == child) {
                            if (this.fch == child)
                                this.fch = null;
                        } else if (this.fch == child)
                            this.fch = child.nxt;

                        child.prv = null;
                        child.nxt = null;
                        child.par = null;
                        this.noc--;
                    }
                },

                /**
                 * Gets the next node. 
                 *
                 * @param      {HTMLNode}  node    The node to get the sibling of.
                 * @return {HTMLNode | TextNode | undefined}
                 */
                getNextChild: function(node = this.fch) {
                    if (node && node.nxt != this.fch && this.fch)
                        return node.nxt;
                    return null;
                },

                /**
                 * Gets the child at index.
                 *
                 * @param      {number}  index   The index
                 */
                getChildAtIndex: function(index, node = this.fch) {
                    if(node.par !== this)
                        node = this.fch;

                    let first = node;
                    let i = 0;
                    while (node && node != first) {
                        if (i++ == index)
                            return node;
                        node = node.nxt;
                    }

                    return null;
                },
            }
        },

        gettersAndSetters : {
            peer : {
                next: {
                    enumerable: true,
                    configurable: true,
                    get: function() {
                        return this.nxt;
                    },
                    set: function(n) {
                        this.insertAfter(n);
                    }
                },
                previous: {
                    enumerable: true,
                    configurable: true,
                    get: function() {
                        return this.prv;
                    },
                    set: function(n) {
                        this.insertBefore(n);
                    }   
                }
>>>>>>> origin/temp
            },
            tree : {
                children: {
                    enumerable: true,
                    configurable: true,
                    /**
                     * @return {array} Returns an array of all children.
                     */
                    get: function() {
                        for (var z = [], i = 0, node = this.fch; i++ < this.noc;)(
                            z.push(node), node = node.nxt
                        );
                        return z;
                    },
                    set: function(e) {
                        /* No OP */
                    }
                },
                parent: {
                    enumerable: true,
                    configurable: true,
                    /**
                     * @return parent node
                     */
                    get: function() {
                        return this.par;
                    },
                    set: function(p) {
                        if(p && p.addChild)
                            p.addChild(this);
                        else if(p === null && this.par)
                            this.par.removeChild(this);
                    }
                }
            }
        },


        mixin : (constructor)=>{
            const proto = (typeof(constructor) == "function") ? constructor.prototype : (typeof(constructor) == "object") ? constructor : null;
            if(proto){
                Object.assign(proto, 
                    LinkedList.props.defaults, 
                    LinkedList.methods.defaults
                );
            }
            Object.defineProperties(proto, LinkedList.gettersAndSetters.peer);
        },

        mixinTree : (constructor)=>{
            const proto = (typeof(constructor) == "function") ? constructor.prototype : (typeof(constructor) == "object") ? constructor : null;
            if(proto){
                Object.assign(proto, 
                    LinkedList.props.defaults, 
                    LinkedList.props.children, 
                    LinkedList.props.parent, 
                    LinkedList.methods.defaults, 
                    LinkedList.methods.parent_child
                    );
                Object.defineProperties(proto, LinkedList.gettersAndSetters.tree);
                Object.defineProperties(proto, LinkedList.gettersAndSetters.peer);
            }
        }
    };

    /** NODE TYPE IDENTIFIERS **/
    const HTML = 0;
    const TEXT = 1;
    const offset = "    ";

    /**
     * A node for text data.
     * @param  {string}  str     The text value of the node.
     */
    class TextNode {

        constructor(str = "") {
            /**
             * The text value
             */
            this.txt = str;
        }

        /**
         * Returns the type of `1` (`TEXT`)
         */
        get type() {
            return TEXT;
        }

        /**
         * Returns a string representation of the object.
         * @param      {string}  str     Optional string passed down from calling method.
         * @return     {string}  String representation of the object.
         */
        toString(off = 0) {
            return `${offset.repeat(off)} ${this.txt}\n`;
        }

        /**
         * Builds a real DOM HTMLTextNode node. 
         * @param      {HTMLElement}  parent  The real html element.
         */
        build(parent) {
            parent.appendChild(document.createTextNode(this.txt));
        }

    }

    LinkedList.mixinTree(TextNode);


    /**
     * A node for HTML data. 
     * Handles the parsing of HTML strings.
     */
    class HTMLNode {

        constructor() {

            /**
             * Element attributes
             * @public
             */
            this.attributes = [];

            /**
             * Any Comment Lines found within.
             * @private
             */
            //this.dtd_nodes = [];

            /**
             * The tag name of the object.
             * @public
             */
            this.tag = "";

            /**
             * A URL instance when set.
             * @private
             */
            this.url = null;

            /**
             * Whether the node is a DTD, such as a comment.
             * @private
             */
            this.DTD = false;

            /**
             * True if the element is a single tag element. 
             */
            this.single = false;

        }

        /******************************************* ATTRIBUTE AND ELEMENT ACCESS ******************************************************************************************************************/

        /**
         * Returns the type of `0` (`HTML`)
         * @public
         */
        get type() {
            return HTML;
        }

        get tagName() {
            return this.tag.toUpperCase();
        }

        get classList() {
            let classes = this.getAttrib("class");
            if (typeof classes.value == "string")
                return classes.split(" ");
            return [];
        }

        getAttribute(name) {
            let attrib = this.getAttrib(name);
            return (attrib) ? attrib.value : void 0;
        }

        get parentElement() {
            return this.par;
        }

        get previousElementSibling() {
            if (this.par) {
                let guard = this.par.fch;

                if (this == guard) return null;

                let node = this.prv;

                while (node && node != gaurd) {
                    if (node.type == HTML)
                        return node;
                    node = node.prv;
                }

                if (node.type == HTML)
                    return node;
            }
            return null;
        }

        get nextElementSibling() {
            if (this.par) {
                let guard = this.par.fch;

                let node = this.nxt;

                while (node && node != guard) {
                    if (node.type == HTML)
                        return node;
                    node = node.nxt;
                }
            }
            return null;
        }



        /**
         * Gets an attribute.
         * @param      {string}  prop    The attribute name to lookup;
         * @public
         */
        getAttrib(prop) {
            for (let i = -1, l = this.attributes.length; ++i < l;) {
                let attrib = this.attributes[i];
                if (attrib.name == prop && !attrib.IGNORE) return attrib;
            }
            return null;
        }



        /**
         * Get Elements by the tag name.
         * @param      {string}   tag                  A string to match with the element's tag value.
         * @param      {boolean}  [INCLUDE_DESCENDANTS=false]  When `true` searching will recurse depth first into child elements.
         * @param      {Array}    array                Internal element store that is returned. 
         * @return     {Array}    An array of matched elements.
         * @public
         */
        getTag(tag, INCLUDE_DESCENDANTS = false, array = []) {
            for (let node = this.fch; node;
                (node = this.getNextChild(node))) {
                if (node.type == HTML) {
                    if (node.tag == tag) array.push(node);
                    if (INCLUDE_DESCENDANTS) node.getTag(tag, INCLUDE_DESCENDANTS, array);
                }
            }
            return array;
        }



        /**
         * Get Elements by the tag name.
         * @param      {string}   _class               A string to find with the element's class value.
         * @param      {boolean}  [INCLUDE_DESCENDANTS=false]  When `true` searching will recurse depth first into child elements.
         * @param      {Array}    array                Internal element store that is returned. 
         * @return     {Array}    An array of matched elements.
         * @public
         */
        getClass(_class, INCLUDE_DESCENDANTS = false, array = []) {
            for (let node = this.fch; node;
                (node = this.getNextChild(node))) {
                if (node.type == HTML) {
                    if (node.class.includes(_class)) array.push(node);
                    if (INCLUDE_DESCENDANTS) node.getClass(_class, INCLUDE_DESCENDANTS, array);
                }
            }
            return array;
        }



        /**
         * Get first element with matching id.
         * @param      {string}   id                   The identifier value to find.
         * @param      {boolean}  [INCLUDE_DESCENDANTS=false]  When `true` searching will recurse depth first into child elements.
         * @return     {HTMLNode}   The first element whose id matches.
         * @public
         */
        getID(id, INCLUDE_DESCENDANTS = false) {
            for (let node = this.fch, ch; node;
                (node = this.getNextChild(node))) {
                if (node.type == HTML) {
                    if (node.id == id) return node;
                    if (INCLUDE_DESCENDANTS && (ch = node.getID(id, INCLUDE_DESCENDANTS))) return ch;
                }
            }
            return null;
        }



        /**
         * The id attribute value.
         * @public
         */
        get id() {
            let id_attrib = this.getAttrib("id");
            return (id_attrib) ? id_attrib.value : "";
        }



        /**
         * The class attribute value.
         * @public
         */
        get class() {
            let id_attrib = this.getAttrib("class");
            return (id_attrib) ? id_attrib.value : "";
        }



        /**
         * Returns a string representation of the object.
         * @return     {string}  String representation of the object.
         * @public
         */
        toString(off = 0) {

            let o = offset.repeat(off);

            let str = `${o}<${this.tag}`,
                atr = this.attributes,
                i = -1,
                l = atr.length;

            while (++i < l) {
                let attr = atr[i];
               
                if(attr.name) 
                    str += ` ${attr.name}="${attr.value}"`;
            }

            str += ">\n";
            
            if(this.single)
                return str;

            str += this.innerToString(off+1);

            return str + `${o}</${this.tag}>\n`;
        }

        innerToString(off){
            let str = "";
            for (let node = this.fch; node;
                (node = this.getNextChild(node))) {
                str += node.toString(off);
            }
            return str;
        }



        /******************************************* PARSING ******************************************************************************************************************/



        /**
         * Creates a text node. 
         *
         * @param      {Lexer} - A Lexical tokenizing object supporting methods found in {@link Lexer}
         * @param      {start}  start   The starting point of the data slice
         * @private
         */
        createTextNode(lex, start, end) {
            if (end) {
                let other_lex = lex.copy();
                other_lex.IWS = true;
                other_lex.off = start - 1;
                other_lex.tl = 1;
                other_lex.sl = end;
                let text_node = this.processTextNodeHook(other_lex.n, true);
                if (text_node) this.addChild(text_node);
            } else if (start < lex.off) {
                let other_lex = lex.copy();
                other_lex.off = start;
                other_lex.END = false;
                other_lex.tl = 0;
                other_lex.fence(lex);
                other_lex.IWS = false;
                other_lex.n;
                other_lex.IWS = true;

                if ((other_lex.sl - other_lex.off) < 2){
                    //TODO
                    throw new Error("Unexpected end of input");
                }

                let text_node = this.processTextNodeHook(other_lex, false);
                if (text_node) this.addChild(text_node);
            }
        }



        /**
         * Parses an HTML open tag.
         * @param {Lexer} - A Lexical tokenizing object supporting methods found in {@link Lexer}  
         * @param {Object} attribs - An object which will receive the attribute keys and values. 
         * @private
         */
        parseOpenTag(lex, DTD, old_url) {
            let HAS_URL = false;

            while (!lex.END && lex.text !== ">" && lex.text !== "/") {


                if (DTD && lex.ch == "-" && lex.pk.ch == "-") {
                    //parse comment

                    let pk = lex.pk;
                    if (!lex.text) throw Error("Unexpected end of input.");
                    let a = pk.n.ch,
                        b = pk.n.ch;
                    while (!pk.END && (b !== "-" || a !== "-")) {
                        a = b;
                        b = pk.n.tx;
                    }
                    lex.sync().n;
                    continue;
                }

                lex.IWS = false;
                
                let pk = lex.pk;
                
                while (!pk.END && !(pk.ty & (pk.types.ws | pk.types.str | pk.types.nl)) && pk.ch !== "=" && pk.ch !== ">") { pk.n; }
                
                let attrib_name = pk.slice(lex).trim();
                
                lex.sync(); 
                
                lex.IWS = true;

                let out_lex = lex.copy();
                
                out_lex.sl = lex.off;

                if (lex.ch == "=") {
                    let pk = lex.pk;

                    let start = pk.off;

                    pk.IWS = true;
                    while (!(pk.ty & (pk.types.ws | pk.types.str | pk.types.nl)) && pk.ch !== ">") { pk.n; }
                    pk.IWS = false;

                    if (pk.off > start) {
                        out_lex = lex.n.copy();
                        out_lex.fence(pk);
                        lex.sync();
                    } else {
                        //Have simple value
                        lex.sync(pk);
                        out_lex = lex.copy();
                        if (lex.pos < 0)
                            lex.throw(`Unexpected end of input. Expecting value for attribute "${attrib_name}"`);
                        else if (lex.type == lex.types.str) {
                            out_lex.tl = 1;
                            out_lex.n;
                            out_lex.sl = lex.pos + lex.tl - 1;
                            lex.n;
                        } else {
                            lex.next();
                            out_lex.fence(lex);
                        }
                    }
                }

                if (attrib_name == "url") {
                    this.url = URL.resolveRelative(old_url, out_lex.slice());
                    HAS_URL = true;
                }

                let attrib = this.processAttributeHook(attrib_name, out_lex);

                if (attrib)
                    this.attributes.push(attrib);
            }

            if (lex.text == "/") // Void Nodes
                lex.assert("/");

            return HAS_URL;
        }

        parseRunner(lex = null, OPENED = false, IGNORE_TEXT_TILL_CLOSE_TAG = false, parent = null, old_url = new URL(0, !!1)) {
            let start = lex.pos;
            let end = lex.pos;
            let HAS_INNER_TEXT = false;
            main_loop:
            while (!lex.END) {
                switch (lex.ch) {
                    case "/":
                        if (lex.pk.ch == "<") { //ignore the white space.
                            lex.sync();
                            break;
                        }
                        break;

                    case "<":
                        if (!IGNORE_TEXT_TILL_CLOSE_TAG) lex.IWS = true;

                        let pk = lex.pk;

                        if (pk.ch == "/") {
                            if (pk.pk.tx !== this.tag){
                                 break main_loop;   
                            }

                            if (HAS_INNER_TEXT) {
                                if (IGNORE_TEXT_TILL_CLOSE_TAG)
                                    this.createTextNode(lex, start);
                                else if ((end - start) > 0)
                                    this.createTextNode(lex, start, end);
                            }

                            //Close tag
                            let name = lex.sync().n.tx;

                            //Close tag is not the one we are looking for. We'll create a new dummy node and close the tag with it. 
                            if (name !== this.tag) {
                                //Create new node with the open tag 
                                let insert = new HTMLNode();
                                insert.tag = name;
                                this.addChild(insert);
                            }

                            lex.n;
                            lex.IWS = false;
                            lex.a(">");

                            this.endOfElementHook(lex, parent);

                            return this;
                        }

                        if (pk.ch == "!") {
                            /* DTD - Doctype and Comment tags*/
                            //This type of tag is dropped
                            while (!lex.END && lex.n.ch !== ">") {};
                            lex.a(">");
                            continue;
                        }

                        if (!IGNORE_TEXT_TILL_CLOSE_TAG) {
                            //Open tag
                            if (!OPENED) {
                                let URL = false;
                                this.DTD = false;
                                this.attributes.length = 0;

                                //Expect tag name 
                                this.tag = lex.n.tx.toLowerCase();


                                URL = this.parseOpenTag(lex.n, false, old_url);
                                start = lex.pos + 1;
                                lex.IWS = false;
                                if (lex.ch == "/") lex.n;
                                lex.a(">");


                                OPENED = true;

                                HAS_INNER_TEXT = IGNORE_TEXT_TILL_CLOSE_TAG = this.ignoreTillHook(this.tag);

                                if (URL) {

                                    //Need to block against ill advised URL fetches. 

                                    //Hook to pull in data from remote resource
                                    let prom = this.processFetchHook(lex, true, IGNORE_TEXT_TILL_CLOSE_TAG, parent);

                                    if (prom instanceof Promise) {
                                        return prom.then(() => {
                                            if (this.selfClosingTagHook(this.tag)) {
                                                return this;
                                            } // Tags without matching end tags.
                                            return this.parseRunner(lex, true, IGNORE_TEXT_TILL_CLOSE_TAG, this, old_url);
                                        });
                                    }
                                }

                                if (this.selfClosingTagHook(this.tag)){
                                     // Tags without matching end tags.
                                    this.single = true;
                                    return this;
                                }

                                continue;
                            } else {
                                lex.IWS = false;
                                //Create text node;
                                if (HAS_INNER_TEXT) {
                                    if (IGNORE_TEXT_TILL_CLOSE_TAG)
                                        this.createTextNode(lex, start);
                                    else if ((end - start) > 0) {
                                        this.createTextNode(lex, start, end);
                                    }
                                }

                                //New Child node found
                                let node = this.createHTMLNodeHook(lex.pk.tx, lex.off);

                                this.addChild(node);

                                let prom = node.parseRunner(lex, false, false, this, this.url || old_url);
                                
                                if(prom instanceof Promise){
                                    return prom.then(child => {
                                        if (child.DTD) this.removeChild(child);
                                        return this.parseRunner(lex, OPENED, false, this, old_url);
                                    });    
                                }else{
                                    if (node.DTD) this.removeChild(node);
                                    return this.parseRunner(lex, OPENED, false, this, old_url);
                                }
                                
                            }
                            //}
                        }
                        lex.IWS = false;
                        break;
                }

                if (!IGNORE_TEXT_TILL_CLOSE_TAG) {
                    if (lex.ty == 8 && !HAS_INNER_TEXT) {
                        start = lex.pos;
                    } else if (lex.ty == 256) {} else {
                        HAS_INNER_TEXT = true;
                        end = lex.off + lex.tl;
                    }
                }

                lex.n;
            }

            if (OPENED && start < lex.off) {
                //Got here from an network import, need produce a text node;
                this.createTextNode(lex, start);
            }

            return this;
        }

        /**
         * Parses HTML string. Appends new nodes, or consumes first node if tag is an empty string.
         * @param      {Lexer} - A Lexical tokenizing object supporting methods found in {@link Lexer}
         * @param      {boolean}  OPENED       The opened
         * @param      {boolean}  IGNORE_TEXT_TILL_CLOSE_TAG  If `true`, parser will ignore all HTML syntax until the closing tag is found.
         * @return     {Promise}  
         * @private
         */
        parse(lex, url =  new URL(0, !!1)) {
            
            if(typeof(lex) == "string") lex = whind(lex);
            
            lex.IWS = false;
            
            return new Promise((res, rej) => {
                res(this.parseRunner(lex, false, false, null, url));
            });
        }

        /******************************************* HOOKS ******************************************************************************************************************/

        endOfElementHook() {}

        selfClosingTagHook(tag) {
            switch (tag) {
                case "input":
                case "br":
                case "img":
                //svg
                case "rect":
                    return true;
            }

            return false;
        }

        ignoreTillHook(tag) {
            if (tag == "script" || tag == "style") // Special character escaping tags.
                return true;
            return false;
        }

        createHTMLNodeHook(tag, start) { return new HTMLNode(tag); }

        processFetchHook(lexer, OPENED, IGNORE_TEXT_TILL_CLOSE_TAG, parent, url) {
            let path = this.url.path,
                CAN_FETCH = true;

            //make sure URL is not already called by a parent.
            while (parent) {
                if (parent.url && parent.url.path == path) {
                    console.warn(`Preventing recursion on resource ${this.url.path}`);
                    CAN_FETCH = false;
                    break;
                }
                parent = parent.par;
            }

            if (CAN_FETCH) {
                return this.url.fetchText().then((text) => {
                    let lexer = whind(text);
                    return this.parseRunner(lexer, true, IGNORE_TEXT_TILL_CLOSE_TAG, this, this.url);
                }).catch((e) => {
                    console.error(e);
                });
            }
            return null;
        }

        processAttributeHook(name, lex) { return {IGNORE:false, name, value: lex.slice() }; }
        
        processTextNodeHook(lex, IS_INNER_HTML) {
            if (!IS_INNER_HTML)
                return new TextNode(lex.trim().slice());
            let txt = "";
            /*
            lex.IWS = true;

            while (!lex.END) {
                if (lex.ty == 8) {
                    txt += " ";
                } else if (lex.ty == 256) {} else {
                    txt += lex.tx;
                }
                lex.IWS = false;
                lex.n;
            }

            if(!(lex.ty & (8 | 256)))
                txt += lex.tx;
            */
            //if (txt.length > 0) {
                
                let t = lex.trim();
                 debugger   
                if(t.string_length > 0)
                    return new TextNode(t.slice());
                
            //}

            return null;
        }

        build(parent) {
            let ele = document.createElement(this.tag);

            for (let i = 0, l = this.attributes.length; i < l; i++) {
                let attr = this.attributes[i];
                ele.setAttribute(attr.name, attr.value);
            }
            //let passing_element = ele;
            let passing_element = (this.tag == "template") ? ele.content : ele;

            for (let node = this.fch; node;
                (node = this.getNextChild(node))) {
                node.build(passing_element);
            }

            if (parent) parent.appendChild(ele);

            return ele;
        }
    }

     LinkedList.mixinTree(HTMLNode);


    /**
     * Builds an HTML AST. 
     * @function
     * @param {string} html_string - A string containing HTML data.
     * @param {string} css_string - An existing CSSRootNode to merge with new `selectors` and `rules`.
     * @return {Promise} Returns a `Promise` that will return a new or existing CSSRootNode.
     * @memberof module:wick.core
     * @alias html
     */
    const HTMLParser = (html_string, root = null, url) => (root = (!root || !(root instanceof HTMLNode)) ? new HTMLNode() : root, root.parse(whind(html_string.replace(/\&lt;/g, "<").replace(/\&gt;/g, ">"), url)));

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
        p$1 = 1,
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
        new_line$1 = "\n",
        hashtag = "#";

    // Methods needed
    var markdom = (function MarkDOM() {



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
            return node(cb, start, 0, 0, p$1 | cb | br, cb)
        }

        function new_line_node() {
            var intermediate = node(br, 0, 0, 0, br);
            setChild(intermediate, node(br, 0, 0, 0, br));
            return intermediate;
        }

        function paragraph_node(start) {
            return node(p$1, start, 0, p$1);
        }

        function text_node(start, end) {
            return node(tx, start, end);
        }

        function setChild(node, ...children) {
            let c = null;
            for (const child of children) {
                if (child) {
                    node.children.push(child);
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

            [new_line$1]: (lex) => {return (lex.next(), setIgnore(new_line_node()))}
        };

        const joins = {
            [p$1]: {
                [p$1]: (t, b) => (setChild(t, ...b.children), t),
                [br]: (t) => {t.cap = true; return t}
            },
            [bq]: {
                [bq]: (t, b) => (setChild(t, ...b.children), t),
            },
            [li]: {
                [li]: (t, b) => (setChild(t, b), t),
            },
            [cb]: {
                [p$1]: (t, b) => (setChild(t, ...b.children), t),
                [br]: (t, b) => (setChild(t, node(nl)), t),
                [cb]: (t) => (t.cap = true, t)
            },
            [nl]: {},
            [br]: {
                [br]: t => t
            }
        };

        const join = (top, bottom, up, j) => {
            console.log(top, bottom);

            if (!bottom.active) {
                top.children.push(...bottom.children);
                return top;
            }

            return (!top.cap && (j = joins[top.type]) && j[bottom.type]) ?
                j[bottom.type](top, bottom) :
                null;
        };

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
                            obj = parseLine(lex, node(italic, lex.off), ch, 1);
                        else if (count == 2)
                            obj = parseLine(lex, node(bold, lex.off), ch, 2);
                        else if (count > 2) {
                            const diff = count - Math.min(2, count);
                            lex.off -= diff;
                            lex.tl = 0;
                            lex.next();
                            obj = parseLine(lex, node(bold, lex.off), ch, 2);
                        }

                        if (!obj.active) {
                            reset(lex, off + count);
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

        };

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

                    output_stack.push(intermediate);
                }


                //REnder test
                function r(d) {
                    let ele = { nodeName: "", childNodes: null },
                        tag = "DIV";
                    switch (d.type) {
                        case p$1:
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
                                }];
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
        const name = node.nodeName;
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
        };
    }
    const TAGS = {};
    tagReplace("H1", "# ", "\n", false, 1);
    tagReplace("H2", "## ", "\n", false, 1);
    tagReplace("H3", "### ", "\n", false, 1);
    tagReplace("H4", "#### ", "\n", false, 1);
    tagReplace("H5", "##### ", "\n", false, 1);
    tagReplace("H6", "###### ", "\n", false, 1);
    tagReplace("PRE", "``` %langauge", "```", true, 1);
    tagReplace("CODE", "```", "```", true, Infinity);
    tagReplace("BLOCKQUOTE", ">", "\n", false, 1);
    tagReplace("A", "[%href](", ")", true, Infinity);
    tagReplace("IMG", "![%src](", ")", true, Infinity);
    tagReplace("EM", "*", "*", false, Infinity);
    tagReplace("B", "**", "**", false, Infinity);
    tagReplace("BR", "\n", "", false, Infinity, false);
    tagReplace("STRONG", "*", "*", false, Infinity);
    tagReplace("P", "", "\n\n", false, 1);
    tagReplace("NOTES", "((%query))\n", "", true, 1, false);
    //tagReplace("NOTES", "((%query))[%meta]\n", "", true, 1, false)

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
    gt6$1 = [0,-44,41,-2,42,44,43],
    gt7$1 = [0,-9,47,48,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt8$1 = [0,-14,79,-1,80,65,61,68,62,71,63,64],
    gt9$1 = [0,-13,26,-1,85],
    gt10$1 = [0,-5,38,-34,10,86,11,-2,13,12,-2,15],
    gt11$1 = [0,-47,87,44,43],
    gt12$1 = [0,-49,88],
    gt13$1 = [0,-12,97,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt14$1 = [0,-12,98,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt15$1 = [0,-12,99,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt16$1 = [0,-12,100,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt17$1 = [0,-8,101,102,48,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt18$1 = [0,-45,103,-3,15],
    gt19$1 = [0,-45,104,-3,15],
    gt20$1 = [0,-24,107,108,109,105,120,-2,111,122,-3,112,125,126,106],
    gt21$1 = [0,-24,107,108,109,137,120,-2,111,122,-3,112,125,126,138],
    gt22$1 = [0,-24,107,108,109,139,120,-2,111,122,-3,112],
    gt23$1 = [0,-40,10,142,11,-2,13,12,-2,15],
    gt24$1 = [0,-9,144,48,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt25$1 = [0,-9,145,48,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt26$1 = [0,-9,146,48,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt27$1 = [0,-9,147,48,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt28$1 = [0,-10,148,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt29$1 = [0,-10,149,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt30$1 = [0,-10,150,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt31$1 = [0,-10,151,49,50,-3,58,65,61,68,62,71,63,64,-16,10,57,11,56,-1,13,12,-2,15],
    gt32$1 = [0,-37,125,126,155],
    gt33$1 = [0,-40,10,159,11,-2,13,12,-2,15],
    gt34$1 = [0,-28,120,-2,162,122,-3,163],
    gt35$1 = [0,-33,168,-11,169,-3,15],
    gt36$1 = [0,-37,125,126,171],
    gt37$1 = [0,-37,125,126,172],
    gt38$1 = [0,-24,107,108,109,173,120,-2,111,122,-3,112,125,126,174],
    gt39$1 = [0,-16,175,65,61,68,62,71,63,64],
    gt40$1 = [0,-29,179,178],
    gt41$1 = [0,-34,186,185],
    gt42$1 = [0,-37,125,126,191],
    gt43$1 = [0,-33,193,-11,169,-3,15],

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
    sm21$1=[0,51,-1,51,-1,0,-2,51,51,0,-3,51,-3,55,-12,51,51,51,51,51,-1,51,51,51,51,51,-1,51,51,51,51,51,51,51,-29,51,51,51],
    sm22$1=[0,56,-3,0,-4,0,-32,42,43,44,45,46,47,48],
    sm23$1=[0,57,-3,0,-4,0,-32,57,57,57,57,57,57,57],
    sm24$1=[0,57,-3,0,-4,0,-7,58,-24,57,57,57,57,57,57,57],
    sm25$1=[0,57,-3,0,-4,0,-7,59,-24,57,57,57,57,57,57,57],
    sm26$1=[0,57,-3,0,-4,0,-7,60,-24,57,57,57,57,57,57,57],
    sm27$1=[0,57,-3,0,-4,0,-7,61,-24,57,57,57,57,57,57,57],
    sm28$1=[0,62,-3,0,-4,0,-26,12,13,14,15,16],
    sm29$1=[0,63,-3,0,-4,0],
    sm30$1=[0,64,-3,0,-4,0],
    sm31$1=[0,65,-1,2,-1,0,-2,3,4,0,-3,5,-2,65,-1,65,65,65,65,-14,65,65,65,65,65,-39,17],
    sm32$1=[0,66,-3,0,-4,0,-5,26,66,-1,66,66,66,66,-14,66,66,66,66,66],
    sm33$1=[0,67,-3,0,-4,0,-5,26,67,-1,67,67,67,67,-14,67,67,67,67,67],
    sm34$1=[0,68,-1,68,-1,0,-2,68,68,0,-3,68,-2,68,-1,68,68,68,68,-14,68,68,68,68,68,-39,68],
    sm35$1=[0,69,-1,69,-1,0,-2,69,69,0,-3,69,-2,69,-1,69,69,69,69,-14,69,69,69,69,69,-39,69],
    sm36$1=[0,70,-1,70,-1,0,-2,70,70,0,-3,70,-1,70,70,-1,70,70,70,70,70,70,70,70,70,70,70,70,-5,70,70,70,70,70,70,70,-7,70,70,70,70,70,-1,70,-1,70,70,-1,70,-5,70,70,70,70,70,70,70,70,70,70,70,70,-2,70],
    sm37$1=[0,71,-1,2,-1,33,-2,3,4,0,-3,5,-1,71,71,-1,71,71,71,71,71,71,71,71,71,71,71,71,-5,71,71,71,71,71,71,71,-7,71,71,71,71,71,-1,71,-1,71,71,-1,71,71,71,71,71,-1,71,71,71,71,71,71,71,71,71,71,71,71,71,71,71,-1,34],
    sm38$1=[0,72,-1,72,-1,72,-2,72,72,0,-3,72,-1,72,72,-1,72,72,72,72,72,72,72,72,72,72,72,72,-5,72,72,72,72,72,72,72,-7,72,72,72,72,72,-1,72,-1,72,72,-1,72,72,72,72,72,-1,72,72,72,72,72,72,72,72,72,72,72,72,72,72,72,-1,72],
    sm39$1=[0,73,-1,73,-1,73,-2,73,73,0,-3,73,-1,73,73,-1,73,73,73,73,73,73,73,73,73,73,73,73,-5,73,73,73,73,73,73,73,-7,73,73,73,73,73,-1,73,-1,73,73,-1,73,73,73,73,73,-1,73,73,73,73,73,73,73,73,73,73,73,73,73,73,73,-1,73],
    sm40$1=[0,-2,2,-1,0,-2,3,4,0,-3,5],
    sm41$1=[0,74,-3,0,-4,0,-26,74,74,74,74,74],
    sm42$1=[0,75,-3,0,-4,0,-12,76,77,78,79,-9,75,75,75,75,75,75],
    sm43$1=[0,80,-3,0,-4,0,-12,80,80,80,80,81,82,83,84,-5,80,80,80,80,80,80],
    sm44$1=[0,85,-3,0,-4,0,-12,85,85,85,85,85,85,85,85,-5,85,85,85,85,85,85],
    sm45$1=[0,-2,2,-1,0,-2,3,4,0,-3,5,-20,41,-7,42,43,44,45,46,47,48,-29,49,50,17],
    sm46$1=[0,-2,2,-1,0,-2,3,4,0,-3,5,-16,37,38,39,40,41,-7,42,43,44,45,46,47,48,-29,49,50,17],
    sm47$1=[0,86,-3,0,-4,0,-12,86,86,86,86,86,86,86,86,-5,86,86,86,86,86,86],
    sm48$1=[0,87,-3,0,-4,0,-12,87,87,87,87,87,87,87,87,-5,87,87,87,87,87,87],
    sm49$1=[0,88,-3,0,-4,0,-12,88,88,88,88,88,88,88,88,-5,88,88,88,88,88,88,88],
    sm50$1=[0,89,-3,0,-4,0,-12,89,89,89,89,89,89,89,89,-5,89,89,89,89,89,89,89,-7,90,91,92,93,94,-1,95,-1,96,97,-1,98,-5,99,100,101,102,103,104,105,106,107,108,109,110],
    sm51$1=[0,111,-3,0,-4,0,-12,111,111,111,111,111,111,111,111,-5,111,111,111,111,111,111,111,-7,111,111,111,111,111,-1,111,-1,111,111,-1,111,-5,111,111,111,111,111,111,111,111,111,111,111,111],
    sm52$1=[0,112,-3,0,-4,0,-12,112,112,112,112,112,112,112,112,-5,112,112,112,112,112,112,112,-7,90,91,92,93,94,-1,95,-1,96,97,-1,98,-5,99,100,101,102,103,104,105,106,107,108,109,110],
    sm53$1=[0,113,-3,0,-4,0,-12,113,113,113,113,113,113,113,113,-5,113,113,113,113,113,113,113,-7,113,113,113,113,113,-1,113,-1,113,113,-1,113,-5,113,113,113,113,113,113,113,113,113,113,113,113],
    sm54$1=[0,-4,0,-4,0,-39,90,91,92,93,94,-1,114,-1,115,97,-1,98,-5,99,100],
    sm55$1=[0,-4,0,-4,0,-39,116,116,116,116,116,-1,116,-1,116,116,-1,116,-5,116,116],
    sm56$1=[0,-2,2,-1,0,-2,3,4,0,-3,5,-66,17],
    sm57$1=[0,117,-1,117,-1,0,-2,117,117,0,-3,117,-16,117,117,117,117,117,-1,117,117,117,117,117,-1,117,117,117,117,117,117,117,-29,117,117,117],
    sm58$1=[0,118,-3,0,-4,0,-31,119],
    sm59$1=[0,120,-3,0,-4,0,-31,120],
    sm60$1=[0,121,-3,0,-4,0,-32,121,121,121,121,121,121,121],
    sm61$1=[0,122,-3,0,-4,0],
    sm62$1=[0,123,-3,0,-4,0,-5,26,123,-1,123,123,123,123,-14,123,123,123,123,123],
    sm63$1=[0,124,-1,124,-1,124,-2,124,124,0,-3,124,-1,124,124,-1,124,124,124,124,124,124,124,124,124,124,124,124,-5,124,124,124,124,124,124,124,-7,124,124,124,124,124,-1,124,-1,124,124,-1,124,124,124,124,124,-1,124,124,124,124,124,124,124,124,124,124,124,124,124,124,124,-1,124],
    sm64$1=[0,125,-1,125,-1,125,-2,125,125,0,-3,125,-1,125,125,-1,125,125,125,125,125,125,125,125,125,125,125,125,-5,125,125,125,125,125,125,125,-7,125,125,125,125,125,-1,125,-1,125,125,-1,125,125,125,125,125,-1,125,125,125,125,125,125,125,125,125,125,125,125,125,125,125,-1,125],
    sm65$1=[0,126,-3,0,-4,0,-12,126,126,126,126,126,126,126,126,-5,126,126,126,126,126,126],
    sm66$1=[0,-4,0,-4,0,-25,127],
    sm67$1=[0,-4,0,-4,0,-25,128],
    sm68$1=[0,-4,0,-4,0,-68,129],
    sm69$1=[0,-4,0,-4,0,-69,130],
    sm70$1=[0,131,-3,0,-4,0,-12,131,131,131,131,131,131,131,131,-5,131,131,131,131,131,131,131,-13,132,-1,133,-10,101,102,103,104,105,106,107,108,109,110],
    sm71$1=[0,134,-3,0,-4,0,-12,134,134,134,134,134,134,134,134,-5,134,134,134,134,134,134,134],
    sm72$1=[0,-1,135,2,-1,0,-2,3,4,0,-3,5,-66,17],
    sm73$1=[0,-1,136,-2,0,-4,0],
    sm74$1=[0,-1,137,-2,0,-4,0],
    sm75$1=[0,-1,138,138,-1,0,-2,138,138,0,-3,138,-39,139,-2,140,-3,98,-5,99,100,-12,138],
    sm76$1=[0,141,-3,0,-4,0,-12,141,141,141,141,141,141,141,141,-5,141,141,141,141,141,141,141,-13,141,-1,141,-10,141,141,141,141,141,141,141,141,141,141],
    sm77$1=[0,-1,138,138,-1,0,-2,138,138,0,-3,138,-66,138],
    sm78$1=[0,-4,0,-4,0,-39,142],
    sm79$1=[0,143,144,-2,0,-4,0,-12,143,143,143,143,143,143,143,143,-5,143,143,143,143,143,143,143],
    sm80$1=[0,-1,144,-2,0,-4,0],
    sm81$1=[0,145,146,-2,0,-4,0,-12,145,145,145,145,145,145,145,145,-5,145,145,145,145,145,145,145],
    sm82$1=[0,-1,146,-2,0,-4,0],
    sm83$1=[0,-1,147,-2,0,-4,0],
    sm84$1=[0,-1,148,-2,0,-4,0],
    sm85$1=[0,-1,149,2,-1,0,-2,3,4,0,-3,5],
    sm86$1=[0,-1,150,150,-1,0,-2,150,150,0,-3,150],
    sm87$1=[0,151,-3,0,-4,0,-12,151,151,151,151,151,151,151,151,-5,151,151,151,151,151,151,151],
    sm88$1=[0,152,-3,0,-4,0,-12,152,152,152,152,152,152,152,152,-5,152,152,152,152,152,152,152],
    sm89$1=[0,143,-3,0,-4,0,-12,143,143,143,143,143,143,143,143,-5,143,143,143,143,143,143,143],
    sm90$1=[0,145,-3,0,-4,0,-12,145,145,145,145,145,145,145,145,-5,145,145,145,145,145,145,145],
    sm91$1=[0,153,-3,0,-4,0,-12,153,153,153,153,153,153,153,153,-5,153,153,153,153,153,153,153,-13,132,-1,133,-10,101,102,103,104,105,106,107,108,109,110],
    sm92$1=[0,154,-3,0,-4,0,-12,154,154,154,154,154,154,154,154,-5,154,154,154,154,154,154,154],
    sm93$1=[0,155,-3,0,-4,0,-12,155,155,155,155,155,155,155,155,-5,155,155,155,155,155,155,155,-13,132,-1,133,-10,101,102,103,104,105,106,107,108,109,110],
    sm94$1=[0,156,-3,0,-4,0,-12,156,156,156,156,156,156,156,156,-5,156,156,156,156,156,156,156,-7,90,91,92,93,94,-1,95,-1,96,97,-1,98,-5,99,100,101,102,103,104,105,106,107,108,109,110],
    sm95$1=[0,-4,0,-4,0,-32,42,43,44,45,46,47,48],
    sm96$1=[0,157,-3,0,-4,0,-25,157,157,157,157,157,157],
    sm97$1=[0,158,-3,0,-4,0,-12,158,158,158,158,-9,158,158,158,158,158,158],
    sm98$1=[0,159,-3,0,-4,0,-12,159,159,159,159,159,159,159,159,-5,159,159,159,159,159,159],
    sm99$1=[0,160,-3,0,-4,0,-12,160,160,160,160,160,160,160,160,-5,160,160,160,160,160,160],
    sm100$1=[0,161,-3,0,-4,0,-12,161,161,161,161,161,161,161,161,-5,161,161,161,161,161,161,161],
    sm101$1=[0,162,-3,0,-4,0,-12,162,162,162,162,162,162,162,162,-5,162,162,162,162,162,162,162,-13,162,-1,162,-10,162,162,162,162,162,162,162,162,162,162],
    sm102$1=[0,163,-3,0,-4,0,-12,163,163,163,163,163,163,163,163,-5,163,163,163,163,163,163,163,-13,163,-1,163,-10,163,163,163,163,163,163,163,163,163,163],
    sm103$1=[0,164,-3,0,-4,0,-12,164,164,164,164,164,164,164,164,-5,164,164,164,164,164,164,164,-13,164,-1,164,-10,164,164,164,164,164,164,164,164,164,164],
    sm104$1=[0,165,-3,0,-4,0,-12,165,165,165,165,165,165,165,165,-5,165,165,165,165,165,165,165,-13,165,-1,165,-10,165,165,165,165,165,165,165,165,165,165],
    sm105$1=[0,166,-3,0,-4,0,-12,166,166,166,166,166,166,166,166,-5,166,166,166,166,166,166,166,-13,166,-1,166,-10,166,166,166,166,166,166,166,166,166,166],
    sm106$1=[0,-1,167,-2,0,-4,0,-44,168],
    sm107$1=[0,-1,169,-2,0,-4,0,-44,170],
    sm108$1=[0,-1,171,171,-1,0,-2,171,171,0,-3,171,-66,171],
    sm109$1=[0,172,-3,0,-4,0,-12,172,172,172,172,172,172,172,172,-5,172,172,172,172,172,172,172,-13,172,-1,172,-3,173,174,175,176,177,-2,172,172,172,172,172,172,172,172,172,172],
    sm110$1=[0,178,-3,0,-4,0,-12,178,178,178,178,178,178,178,178,-5,178,178,178,178,178,178,178,-13,178,-1,178,-3,179,180,181,182,-3,178,178,178,178,178,178,178,178,178,178],
    sm111$1=[0,183,-3,0,-4,0,-12,183,183,183,183,183,183,183,183,-5,183,183,183,183,183,183,183,-13,183,-1,183,-3,183,183,183,183,-3,183,183,183,183,183,183,183,183,183,183],
    sm112$1=[0,184,-3,0,-4,0,-12,184,184,184,184,184,184,184,184,-5,184,184,184,184,184,184,184],
    sm113$1=[0,185,-3,0,-4,0,-12,185,185,185,185,185,185,185,185,-5,185,185,185,185,185,185,185],
    sm114$1=[0,186,-3,0,-4,0,-12,186,186,186,186,186,186,186,186,-5,186,186,186,186,186,186,186,-13,132,-1,133,-10,101,102,103,104,105,106,107,108,109,110],
    sm115$1=[0,187,-3,0,-4,0,-12,187,187,187,187,187,187,187,187,-5,187,187,187,187,187,187,187],
    sm116$1=[0,188,-3,0,-4,0,-31,188],
    sm117$1=[0,-1,189,-2,0,-4,0],
    sm118$1=[0,-1,190,-2,0,-4,0],
    sm119$1=[0,191,-3,0,-4,0,-12,191,191,191,191,191,191,191,191,-5,191,191,191,191,191,191,191,-13,191,-1,191,-10,191,191,191,191,191,191,191,191,191,191],
    sm120$1=[0,-1,192,-2,0,-4,0],
    sm121$1=[0,-1,193,-2,0,-4,0],
    sm122$1=[0,194,-3,0,-4,0,-12,194,194,194,194,194,194,194,194,-5,194,194,194,194,194,194,194,-13,194,-1,194,-10,194,194,194,194,194,194,194,194,194,194],
    sm123$1=[0,-1,195,195,-1,0,-2,195,195,0,-3,195],
    sm124$1=[0,196,-3,0,-4,0,-12,196,196,196,196,196,196,196,196,-5,196,196,196,196,196,196,196],
    sm125$1=[0,197,-3,0,-4,0,-12,197,197,197,197,197,197,197,197,-5,197,197,197,197,197,197,197,-13,197,-1,197,-10,197,197,197,197,197,197,197,197,197,197],
    sm126$1=[0,198,-3,0,-4,0,-12,198,198,198,198,198,198,198,198,-5,198,198,198,198,198,198,198,-13,198,-1,198,-10,198,198,198,198,198,198,198,198,198,198],

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
    sm21$1,
    sm22$1,
    sm23$1,
    sm24$1,
    sm25$1,
    sm26$1,
    sm27$1,
    sm28$1,
    sm29$1,
    sm30$1,
    sm31$1,
    sm32$1,
    sm33$1,
    sm34$1,
    sm35$1,
    sm36$1,
    sm37$1,
    sm38$1,
    sm39$1,
    sm39$1,
    sm39$1,
    sm40$1,
    sm41$1,
    sm42$1,
    sm43$1,
    sm44$1,
    sm45$1,
    sm45$1,
    sm45$1,
    sm45$1,
    sm46$1,
    sm47$1,
    sm47$1,
    sm48$1,
    sm40$1,
    sm40$1,
    sm49$1,
    sm49$1,
    sm49$1,
    sm49$1,
    sm50$1,
    sm51$1,
    sm51$1,
    sm52$1,
    sm53$1,
    sm53$1,
    sm54$1,
    sm55$1,
    sm55$1,
    sm56$1,
    sm57$1,
    sm57$1,
    sm57$1,
    sm57$1,
    sm58$1,
    sm59$1,
    sm60$1,
    sm60$1,
    sm60$1,
    sm60$1,
    sm61$1,
    sm62$1,
    sm63$1,
    sm64$1,
    sm46$1,
    sm46$1,
    sm46$1,
    sm46$1,
    sm46$1,
    sm46$1,
    sm46$1,
    sm46$1,
    sm65$1,
    sm65$1,
    sm65$1,
    sm65$1,
    sm66$1,
    sm67$1,
    sm68$1,
    sm69$1,
    sm70$1,
    sm71$1,
    sm72$1,
    sm73$1,
    sm74$1,
    sm75$1,
    sm76$1,
    sm76$1,
    sm77$1,
    sm77$1,
    sm78$1,
    sm79$1,
    sm80$1,
    sm81$1,
    sm82$1,
    sm83$1,
    sm84$1,
    sm85$1,
    sm86$1,
    sm86$1,
    sm87$1,
    sm88$1,
    sm89$1,
    sm89$1,
    sm89$1,
    sm89$1,
    sm89$1,
    sm90$1,
    sm90$1,
    sm90$1,
    sm90$1,
    sm90$1,
    sm91$1,
    sm92$1,
    sm93$1,
    sm80$1,
    sm82$1,
    sm94$1,
    sm95$1,
    sm96$1,
    sm96$1,
    sm96$1,
    sm96$1,
    sm97$1,
    sm97$1,
    sm97$1,
    sm97$1,
    sm98$1,
    sm99$1,
    sm99$1,
    sm100$1,
    sm89$1,
    sm90$1,
    sm101$1,
    sm102$1,
    sm103$1,
    sm104$1,
    sm105$1,
    sm105$1,
    sm106$1,
    sm107$1,
    sm108$1,
    sm109$1,
    sm110$1,
    sm111$1,
    sm111$1,
    sm112$1,
    sm113$1,
    sm114$1,
    sm115$1,
    sm116$1,
    sm117$1,
    sm118$1,
    sm119$1,
    sm120$1,
    sm121$1,
    sm121$1,
    sm121$1,
    sm121$1,
    sm121$1,
    sm122$1,
    sm85$1,
    sm123$1,
    sm123$1,
    sm123$1,
    sm123$1,
    sm124$1,
    sm125$1,
    sm126$1],

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
    v=>lsm$1(v,gt6$1),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt7$1),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt8$1),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt9$1),
    nf$1,
    nf$1,
    v=>lsm$1(v,gt10$1),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt11$1),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt12$1),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt13$1),
    v=>lsm$1(v,gt14$1),
    v=>lsm$1(v,gt15$1),
    v=>lsm$1(v,gt16$1),
    v=>lsm$1(v,gt17$1),
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt18$1),
    v=>lsm$1(v,gt19$1),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt20$1),
    nf$1,
    nf$1,
    v=>lsm$1(v,gt21$1),
    nf$1,
    nf$1,
    v=>lsm$1(v,gt22$1),
    nf$1,
    nf$1,
    v=>lsm$1(v,gt23$1),
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
    v=>lsm$1(v,gt24$1),
    v=>lsm$1(v,gt25$1),
    v=>lsm$1(v,gt26$1),
    v=>lsm$1(v,gt27$1),
    v=>lsm$1(v,gt28$1),
    v=>lsm$1(v,gt29$1),
    v=>lsm$1(v,gt30$1),
    v=>lsm$1(v,gt31$1),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt32$1),
    nf$1,
    v=>lsm$1(v,gt33$1),
    nf$1,
    nf$1,
    v=>lsm$1(v,gt34$1),
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
    v=>lsm$1(v,gt35$1),
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
    v=>lsm$1(v,gt36$1),
    nf$1,
    v=>lsm$1(v,gt37$1),
    nf$1,
    nf$1,
    v=>lsm$1(v,gt38$1),
    v=>lsm$1(v,gt39$1),
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
    v=>lsm$1(v,gt40$1),
    v=>lsm$1(v,gt41$1),
    nf$1,
    nf$1,
    nf$1,
    nf$1,
    v=>lsm$1(v,gt42$1),
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
    v=>lsm$1(v,gt43$1),
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

    function matchString(strings, to_match_string, offset = 0, index = 0, FOLLOWING_WILD_CARD = (offset == 0)) {

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

    function parseId(identifier, string) {
        if (!identifier)
            return true;

        if (!string)
            return false;

        return matchString(identifier.ids, string) >= 0;
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

            if (matchString(ids, tag[0]) >= 0) {

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
                var v = matchString(val.ids, value) >= 0;
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

            if (matchString(ids, tag[0]) >= 0) {

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
                return matchString(filter.value.ids, note.query_data) >= 0;
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

    //import { Worker } from "worker_threads.js";


    function stringifyQuery(query, { sort = false, filter = false } = {}) {
        let str = "";

        const { container } = query;
        //ID
        str += container.containers.map(c => c.ids.join("")).join("/") + "/" + (container.id ? container.id.ids.join("") : "");

        if (filter && query.filter)
        ; //str += "?" + filter.map

        if (sort && query.sort)
        ; //str += "|" + sort.map

        return str;
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

<<<<<<< HEAD
        return async function runQuery(query_string, container) {
            
=======
        return async function runQuery(query_candidate, container) {

>>>>>>> origin/temp
            var results = [];

            if (!query_candidate)
                return results;

            if (UID.isUID(query_candidate + "")) {
                return [SERVER_getNoteFromUID(query_candidate)];
            }

            if (Array.isArray(query_candidate)) {
                for (const item of query_candidate)
                    results = results.concat(await runQuery(item));
                return results;
            }

            /************************************* UTILIZING QUERY SYNTAX *********************************************/
            var query;

            if (typeof query_candidate == "object"
                && (query_candidate.container || query_candidate.filter)
            ) {
                query = query_candidate;
            } else if (typeof query_candidate == "string") {
                try {
                    query = parser$1(whind(query_candidate + ""));
                } catch (e) {
                    return [];
                }
            } else {
                //Query candidate not in a form suitable for use.
                return [];
            }

            const uids = container.query(query.container ? query.container.containers : default_container);

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

                if ((offset = matchString(identifier, string)) >= 0) {

                    if (offset != string.length) continue;

                    parseContainer$1(identifiers, ctnr, output, idI + 1);

                    continue
                } else if (FOLLOWING_WILD_CARD)
                    parseContainer$1(identifiers, ctnr, output, idI, true);
            }
        }
    }

    //import crdt from "../../cpp/crdt.asm.js";



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
                        if (note.uid) {
                            getContainer(container.get(note.id).uid).set(note.uid, note);
                            uid_store.set(note.uid, note.id);
                        }
                return true;
            } catch (e) {
                writeError(e);
            }
            return false
        }

        function noteFromUID(uid) {
            const id = uid_store.get(uid + "");

            if (!id) return null;

            return noteFromID(id, uid);
        }

        function noteFromID(id, uid) {
            return getContainer(container.get(id, delimeter).uid).get(uid) || null;
        }

        const queryRunner = QueryEngine({
                getNotesFromContainer: container_uid => [...getContainer(container_uid).values()],
                getNoteFromUID: note_uid => noteFromUID(note_uid)
            },
            false
        );  

        let CPP_RUNTIME_LOADED = true;//false

        //const crdt_watcher = new Promise(res=>crdt({onRuntimeInitialized: function() {CPP_RUNTIME_LOADED = true; res()}}))

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

                //Await C++ Runtime
                if(!CPP_RUNTIME_LOADED)
                    await crdt_watcher;

                let result = false;

                const temp = path.resolve(process.cwd(), json_file_path);

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
                    modified_time = Date.now();
                    
                stored_note = noteFromUID(uid);

                if (!stored_note)
                    stored_note = { id: note.id };

                const old_id = stored_note.id;

                stored_note.modified = modified_time;
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

            // Return a list of all uid's that a modified time greater than [date] given
            async getUpdatedUIDs(date){
                
                await read(); //Hack - mack sure store is up to date;

                const d = (new Date(date).valueOf());

                const out = [];

                for(const store of container_store.values()){

                    for(const note of store.values()){
                        if(note.modified > d)
                            out.push(note.uid.toString());
                    }
                }
                return out;
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
                            writeError(e);
                        }

                        file_path = "";
                    })
            }
        })
    }

    function ruminate_json_server_constructor() {
        if (new.target);
        return Server();
    }

    const server = {
    	json : ruminate_json_server_constructor
    };

    const client = {
    	markdom
    };

    exports.client = client;
    exports.ruminate = Ruminate;
    exports.server = server;

    return exports;

}({}, require("fs"), require("path")));
<<<<<<< HEAD
=======
>>>>>>> origin/temp