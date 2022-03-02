

const enum ChangeType {
    ADD, DEL
}
export class DeleteAction {
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
export class AddAction {
    off: number;
    txt: string;

    get type() {
        return ChangeType.ADD;
    }
    constructor(off: number, txt: string) {
        this.off = off;
        this.txt = txt;
    }
}
