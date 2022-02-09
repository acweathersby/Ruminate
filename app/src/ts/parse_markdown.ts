import { complete } from "@hctoolkit/runtime";
import { FunctionMaps, Markdown } from "./ast.js";
import { Bytecode, Entrypoint, ReduceNames } from "./parser_data.js";


export function parseMarkdownText(text: string): Markdown {
    const { result, err } = complete<Markdown>(text, Entrypoint.markdown, Bytecode, FunctionMaps, ReduceNames);

    if (err)
        throw err;

    return result;
}
