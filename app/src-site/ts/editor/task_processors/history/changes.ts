

export const enum ChangeType {
    INS, DEL
}
export class DeleteDiff {
    off: number;
    len: number;

    get type() {
        return ChangeType.DEL;
    }

    constructor(off: number, len: number) {
        this.off = off;
        this.len = len;
    }
}
export class InsertDiff {
    off: number;
    txt: string;

    get type() {
        return ChangeType.INS;
    }
    constructor(off: number, txt: string) {
        this.off = off;
        this.txt = txt;
    }
}
