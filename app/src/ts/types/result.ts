export const enum ResultType {
    OK, Failed
}
export type VoidResult =
    { type: ResultType.OK; } |
    { type: ResultType.Failed; code: number; message: string; };
type ReturnResult<T> =
    { type: ResultType.OK; value: T; } |
    { type: ResultType.Failed; code: number; message: string; };
