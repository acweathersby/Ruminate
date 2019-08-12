import resolve from 'rollup-plugin-node-resolve';

const output = [{
    name: "graze_objects",
    file: "./build/graze.js",
    globals:(id)=>`require("${id}")`,
    format: "iife",
    sourcemap:"inline"
}];

export default {
    external: ['path',"fs"],
    input: "./source/front_end.js",
    output,
    treeshake: false,
    plugins: [
        resolve({jail:"",modulesOnly: true}),  
        //terser({mangle:true, module:true}), 
        //gzipPlugin()
    ]
};
