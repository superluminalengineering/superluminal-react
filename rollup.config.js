import peerDepsExternal from "rollup-plugin-peer-deps-external";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import postcss from 'rollup-plugin-postcss';
import image from '@rollup/plugin-image';
import nodePolyfills from 'rollup-plugin-node-polyfills';

export default {
    input: "src/index.tsx",
    output: [
        {
            file: "dist/index.cjs.js",
            format: "cjs",
            exports: "named",
        },
        {
            file: "dist/index.esm.js",
            format: "esm",
        }
    ],
    plugins: [
        peerDepsExternal(),
        resolve(),
        commonjs(),
        typescript(),
        postcss({
            extract: 'styles.css', // the path to output the CSS file
            modules: true,
            use: ['sass'],
        }),    
        image(),
        nodePolyfills(),  // added this line
    ]
};
