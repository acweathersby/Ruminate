/* TODO - Make sure UID algorithm generates effectivly unique IDs */
export default class UID extends ArrayBuffer {

    static isUID(candidate, temp) {
        return (
            (candidate instanceof UID)
            || (
                (typeof candidate == "string")
                && (temp = (candidate.match(/RUMI\-[a-f\d]+\-[a-f\d]+/g)))
                && temp[0] == candidate
            )
        )
    }

    constructor(string_val, offset) {

        super(12);

        const dv = new DataView(this);

        if (string_val instanceof UID) {
            const dv2 = new DataView(string_val);
            dv.setBigUint64(0, dv2.getBigUint64(0));
            dv.setUint32(8, dv2.getUint32(8));
        } else if (string_val instanceof ArrayBuffer && typeof offset == "number") {
            const dv2 = new DataView(string_val, offset);
            dv.setBigUint64(0, dv2.getBigUint64(0));
            dv.setUint32(8, dv2.getUint32(8));
        } else if (string_val && typeof string_val == "string") {
            string_val
                .split("-")
                .slice(1, Infinity)
                .forEach((v,i)=>{
                    if(i==0){
                        dv.setBigUint64(0, BigInt("0x"+v));
                    }else{
                        dv.setUint32(8, Number("0x"+v));
                    }
                })
        }
    }

    frozenClone() { return (new UID(this)).freeze(uid); }

    toString() { return this.string; }

    toBuffer(array_buffer, offset) {
        const from = new Uint32Array(this);
        const to = new Uint32Array(array_buffer, offset, 3);
        to[0] = from[0];
        to[1] = from[1];
        to[2] = from[2];
    }

    set string(e) { /*empty*/ }

    /** Returns a string representation of the UID */
    get string() {

        const dv = new DataView(this);

        return "RUMI-" + dv.getBigUint64(0).toString(16) + "-" + dv.getUint32(8).toString(16);
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