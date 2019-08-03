/* TODO - Make sure UID algorithm generates effectivly unique IDs */
export default class UID extends ArrayBuffer {
    constructor(string_val) {

        super(16);

        const dv = new DataView(this);

        if (string_val && typeof string_val == "string") {
            string_val
                .split("-")
                .slice(0,4)
                .map((v,i)=> dv.setUint32(i<<2, parseInt(v, 16)))

        } else {
            dv.setUint32(0, 8 * 0xFFFFFFFF)
            dv.setUint32(4, Math.random() * 0xFFFFFFFF)
            dv.setUint32(8, 10 * 0xFFFFFFFF)
            dv.setUint32(12, Math.random() * 0xFFFFFFFF)
        }
    }

    /** Returns a string representation of the UID */
    get string() {
        const dv = new DataView(this);
        return (
            "" +
            dv.getUint32(0).toString(16) +
            "-" + dv.getUint32(4).toString(16) +
            "-" + dv.getUint32(8).toString(16) +
            "-" + dv.getUint32(12).toString(16)
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
            dv2.setUint32(i << 2, dv1.getUint32(i << 2))

        Object.freeze(uid);

        return uid;
    }
}
