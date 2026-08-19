// TEMPORARY final verification (deleted after run).
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const SRC = fs.readFileSync(path.join(__dirname, 'js', 'app.js'), 'utf8');
const dom = {
    addEventListener() {}, getElementById() { return null; },
    createElement(tag) { return { tagName: tag, style: {}, set href(v) {}, set download(v) {}, appendChild() { return {}; }, removeChild() {}, click() {}, innerHTML: '' }; },
    body: { appendChild() { return {}; }, removeChild() {} }
};
const pptxLog = [];
function PptxGenJS() {
    this.layout = null; this._slides = [];
    this.write = () => 'AAAA';
    this.addSlide = function () { const r = { texts: [], shapes: [] }; r.addText = (t, o) => r.texts.push(Object.assign({ text: t }, o)); r.addShape = (t, o) => r.shapes.push(Object.assign({ type: t }, o)); this._slides.push(r); return r; };
    pptxLog.push(this);
}
const ctx = { console, Math, JSON, String, Array, Object, Date, document: dom, window: dom, PptxGenJS, setTimeout: () => {} };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(SRC + '\n;globalThis.__appRef__ = app;\n', ctx);
const app = ctx.__appRef__;

const TEMPLATES = ['Sermon Classic', 'Elegant Heritage', 'Midnight Aurora', 'Forest Chapel', 'Lilac Grace', 'Rose Atelier'];
const slideTypes = ['title', 'point', 'verse', 'message'];
const slides = [
    { type: 'title', title: 'The Journey of Faith', verse: 'Hebrews 11:1', footer: 'First Baptist Church' },
    { type: 'point', title: 'Faith grows daily in community', badge: 'GROWTH', desc: 'We grow together in Christ.', highlights: ['grows'] },
    { type: 'verse', ref: 'John 3:16', text: 'For God so loved the world that He gave His only Son.', version: 'ESV' },
    { type: 'message', ref: 'Part 3: Walking in Hope', text: 'Grace transforms our brokenness into radiant hope and purpose.', footer: 'X', highlights: ['hope'] }
];
function exportTemplate(name) {
    app.selectedTemplate = name; app.slidesQueue = slides.map((s) => Object.assign({}, s)); pptxLog.length = 0;
    app.exportToPowerPoint();
    return pptxLog[pptxLog.length - 1]._slides;
}
function runs(slide) {
    const out = [];
    for (const t of slide.texts) {
        if (Array.isArray(t.text)) out.push(...t.text.map((r) => r.options));
        else out.push(t);
    }
    return out;
}
let pass = true;

// (1) Font-size parity across all 6 templates
const perType = {};
for (const name of TEMPLATES) {
    const s = exportTemplate(name);
    const maxes = s.map((s) => s.texts.length ? Math.max(...s.texts.map((t) => t.fontSize || 0)) : 0);
    console.log(name.padEnd(18), JSON.stringify(slideTypes.map((t, i) => `${t}:${maxes[i]}`)));
    for (let i = 0; i < s.length; i++) (perType[slideTypes[i]] = perType[slideTypes[i]] || []).push(maxes[i]);
}
const expected = { title: 58, point: 42, verse: 40, message: 48 };
for (const type of slideTypes) {
    const ok = perType[type].every((s) => s === perType[type][0]) && perType[type][0] === expected[type];
    console.log(`[${ok ? 'PASS' : 'FAIL'}] ${type} font-size parity: ${JSON.stringify(perType[type])}`);
    pass = pass && ok;
}

// (2) Lily of highlights solid #C0522E (warm terracotta font, no fill/gradient)
const lav = exportTemplate('Lilac Grace');
const ptHl = runs(lav[1]).filter((r) => r && r.color === 'C0522E');
const msgHl = runs(lav[3]).filter((r) => r && r.color === 'C0522E');
console.log(`[${ptHl.length && msgHl.length ? 'PASS' : 'FAIL'}] Lily of highlights solid #C0522E (point:${ptHl.length}, message:${msgHl.length})`);
pass = pass && ptHl.length && msgHl.length;
// (2b) No gradient text fill remains on the lilac title headline
const titleGrad = lav[0].texts.filter((t) => t.fill && t.fill.type === 'gradient');
console.log(`[${titleGrad.length ? 'FAIL' : 'PASS'}] Lily of no gradient text fill (title headline)`);
pass = pass && titleGrad.length === 0;

// (4) Title slides support user-chosen highlights in every template
for (const name of TEMPLATES) {
    app.selectedTemplate = name; app.slidesQueue = [{ type: 'title', title: 'Walking in Unshakable Hope', verse: 'Romans 8:28-39', highlights: ['Hope'] }]; pptxLog.length = 0;
    app.exportToPowerPoint();
    const theme = app.getTheme();
    const hlColor = theme.hl || '';
    const tSlide = pptxLog[pptxLog.length - 1]._slides[0];
    const hlRuns = tSlide.texts.filter((tx) => Array.isArray(tx.text) && tx.text.some((r) => r.options && ((hlColor && r.options.color === hlColor) || (r.options.fill && r.options.fill.type === 'gradient'))));
    console.log(`[${hlRuns.length ? 'PASS' : 'FAIL'}] ${name} title honors user highlight word`);
    pass = pass && hlRuns.length > 0;
}
// (5) No auto-highlight: a plain title (no highlights) renders no accent runs
app.selectedTemplate = 'Lilac Grace'; app.slidesQueue = [{ type: 'title', title: 'Walking in Unshakable Hope', verse: 'Romans 8:28-39' }]; pptxLog.length = 0;
app.exportToPowerPoint();
const tPlain = pptxLog[pptxLog.length - 1]._slides[0];
const autoHl = tPlain.texts.filter((tx) => Array.isArray(tx.text) && tx.text.some((r) => r.options && r.options.color === 'C0522E'));
console.log(`[${autoHl.length ? 'FAIL' : 'PASS'}] Lily of no auto-highlight on a plain title`);
pass = pass && autoHl.length === 0;

// (3) Center glow removed: no large glow ellipse; cloud frame still present
const bigGlow = lav.some((s) => s.shapes.some((sh) => sh.type === 'ellipse' && sh.fill && (sh.fill.color === 'FFFFFF' || sh.fill.color === 'D4C4F7') && (sh.w > 1)));
const cornerDots = lav[0].shapes.filter((sh) => sh.type === 'ellipse' && sh.fill && sh.fill.color === '7C3AED');
const cloudFrame = lav[0].shapes.some((sh) => sh.type === 'roundRect' && sh.line && sh.line.color === '8B5CF6');
console.log(`[${!bigGlow ? 'PASS' : 'FAIL'}] Lily of center glow ellipse removed`);
console.log(`[${cornerDots.length === 4 ? 'PASS' : 'FAIL'}] Lily of keeps 4 corner dots (subtle, no wash)`);
console.log(`[${cloudFrame ? 'PASS' : 'FAIL'}] Lily of keeps rounded cloud frame`);
pass = pass && !bigGlow && cornerDots.length === 4 && cloudFrame;

console.log(pass ? '\nALL FINAL CHECKS PASSED' : '\nFAILURES');
process.exit(pass ? 0 : 1);
