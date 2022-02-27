
export enum PluginType {
    NoteDispatch
}

export interface NoteDispatch {
}

export interface Plugin {
    [PluginType.NoteDispatch]: NoteDispatch;
}
