import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default [
    {
        input: 'index.js',
        output: [
            {
                file: 'dist/index.js',
                format: 'es',
                sourcemap: false,
            }
        ],
        plugins: [
            resolve(),
            commonjs(),
            terser({
                mangle: {
                    reserved: ['autofocus'],
                    keep_fnames: true,
                    keep_classnames: true,
                },
                format: {
                    comments: /@license|@preserve|^!/
                },
                compress: {
                    keep_fargs: true,
                    drop_console: true, // Strip console logs
                },
            }),
        ],
    },
];
