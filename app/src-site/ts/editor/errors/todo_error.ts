export class TodoError extends Error {
    __message: string;

    __stack: string;

    constructor(message: string) {
        super("[!TODO!] " + message.trimStart());
        this.__message = message;
        this.__stack = this.stack;

        this.stack = `[!TODO!] ${this.__message}` + this.__stack;
    }

    get message(): string {
        return `[!TODO!] ${this.__message}`;
    }
}
