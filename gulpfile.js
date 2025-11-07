import gulp from 'gulp';
import replace from 'gulp-replace';
import CleanCSS from 'clean-css';
import fs from 'fs';

// Paths
const paths = {
    js: ['dist/terminal.min.js'],            // Your JS source file
    css: './terminal.css',                   // Your CSS file
    output: 'dist/',                         // Output directory
};


// ---------- CSS Injection ----------
// Read and escape CSS content
function getEscapedCSS() {
    const css = fs.readFileSync(paths.css, 'utf8');
    const minifiedCSS = new CleanCSS({
        level: {
            1: {
                specialComments: 0
            }
        }
    }).minify(css).styles;
    return JSON.stringify(minifiedCSS);  // Escapes properly for JS string
}

// Task to inject CSS
export function injectCSS() {
    const escapedCSS = getEscapedCSS();

    return gulp.src(paths.js)
        .pipe(replace('"INJECT_CSS_HERE"', escapedCSS))  // Match exact placeholder
        .pipe(gulp.dest(paths.output));
}

export default gulp.series(
    injectCSS
);