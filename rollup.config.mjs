import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import stripProps from 'rollup-plugin-strip-props';
import trueBanner from 'rollup-plugin-true-banner';


export default [
    {
        input: 'index.js',
        output: [
            {
                file: 'dist/terminal.min.js',
                format: 'es',
                sourcemap: false,
            }
        ],
        plugins: [
            resolve(),
            commonjs(),
            stripProps([
                'devman'
            ]),
            terser({
                mangle: {
                    reserved: ['autofocus'],
                    keep_fnames: true,
                    keep_classnames: true,
                },
                format: {
                    comments: /^!/
                },
                compress: {
                    keep_fargs: true,
                    drop_console: true, // Strip console logs
                },
            }),
            trueBanner({
                file: 'LICENSE',
                licenseFile: true
            })
        ],
    },
];
