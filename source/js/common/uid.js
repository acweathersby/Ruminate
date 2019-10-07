/* TODO - Make sure UID algorithm generates effectivly unique IDs */
export default class UID extends ArrayBuffer {

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

    constructor(string_val, offset) {

        super(16);

        const dv = new DataView(this);

        if (string_val instanceof UID) {
            const dv2 = new DataView(string_val);
            dv.setBigUint64(0, dv2.getBigUint64(0));
            dv.setBigUint64(8, dv2.getBigUint64(8));
        } else if (string_val instanceof ArrayBuffer && typeof offset == "number") {
            const dv2 = new DataView(string_val, offset);
            dv.setBigUint64(0, dv2.getBigUint64(0));
            dv.setBigUint64(8, dv2.getBigUint64(8));
            
        }else if(string_val && typeof string_val == "string") {
            string_val
                .replace(/\-/g, "")
                .split("")
                .reduce((r, v, i) => (i % 2 ? r[i >> 1] += v : r.push(v), r), [])
                .map((v, i) => dv.setUint8(i, parseInt(v, 16)))
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

    toBuffer(array_buffer, offset){
        const from = new Uint32Array(this);
        const to = new Uint32Array(array_buffer, offset, 4);
        to[0] = from[0];
        to[1] = from[1];
        to[2] = from[2];
        to[3] = from[3];
    }

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
