import { Plugin } from './types';


class PluginHost {

    setDefault<T extends keyof Plugin>(plugin_type: T, plugin: Plugin[T]) {

    }

    getPluginByName<T extends keyof Plugin>(plugin_type: T, plugin_name: string): Plugin[T] {
        return "";
    }
}


export const host = new PluginHost();