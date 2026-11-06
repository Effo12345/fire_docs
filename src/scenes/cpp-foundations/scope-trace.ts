import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';

const CODE = [
    'int speed = 10;',
    '{',
    '    int extra = 5;',
    '    int speed = 99;',
    '    extra = extra + 1;',
    '}',
    'speed = speed + 1;',
];

// What exists after each step: 1 means visible, 0 means gone
interface State {
    line: number;
    outer: string | number;
    outerHidden: number;
    block: number;
    extra: string | number;
    extraOn: number;
    inner: string | number;
    innerOn: number;
    note: string;
}

const STATES: State[] = [
    { line: 1, outer: 10, outerHidden: 0, block: 0, extra: '', extraOn: 0, inner: '', innerOn: 0, note: 'This <code>speed</code> is declared outside any braces, so it can be used from here to the end of the program.' },
    { line: 2, outer: 10, outerHidden: 0, block: 1, extra: '', extraOn: 0, inner: '', innerOn: 0, note: 'An opening brace starts a new <em>block</em>. Names declared inside it belong to the block.' },
    { line: 3, outer: 10, outerHidden: 0, block: 1, extra: 5, extraOn: 1, inner: '', innerOn: 0, note: '<code>extra</code> comes into existence here, inside the block.' },
    { line: 4, outer: 10, outerHidden: 1, block: 1, extra: 5, extraOn: 1, inner: 99, innerOn: 1, note: 'Another <code>speed</code>. It is a different box, and while it exists the name means this one. The outer box is hidden, not gone.' },
    { line: 5, outer: 10, outerHidden: 1, block: 1, extra: 6, extraOn: 1, inner: 99, innerOn: 1, note: 'Work inside the block uses the block\'s boxes.' },
    { line: 6, outer: 10, outerHidden: 0, block: 0, extra: 6, extraOn: 0, inner: 99, innerOn: 0, note: 'The closing brace ends the block. Every box declared inside it is destroyed, the 99 and the 6 with them. The outer <code>speed</code> never changed.' },
    { line: 7, outer: 11, outerHidden: 0, block: 0, extra: '', extraOn: 0, inner: '', innerOn: 0, note: 'Back in the open, <code>speed</code> means the outer box again. And <code>extra</code> no longer exists, so using it here would be an error.' },
];

const STEP = 2.2;
const KEYWORD = /^(int)$/;

export default defineScene({
    label: 'Seven lines of C++ with a pair of braces. A variable named speed is declared, a block opens and declares extra and a second speed that hides the first, and when the block closes both inner boxes disappear and the outer speed returns.',
    duration: STATES.length * STEP,
    height: 340,
    beats: STATES.map((s, i) => ({ at: i * STEP, text: s.note })),
    build({ draw }) {
        const top = 40;
        const lineHeight = 30;
        const band = draw.rect(0, 0, 330, lineHeight, { fill: 'rgba(244, 211, 94, 0.11)' });

        CODE.forEach((line, i) => {
            const y = top + i * lineHeight;
            draw.text(i + 1, 26, y, { mono: true, size: 12, color: color.faint, anchor: 'end' });
            const text = draw.text('', 44, y, { mono: true, size: 14 });
            text.el.setAttribute('xml:space', 'preserve');
            text.el.style.whiteSpace = 'pre';
            for (const token of line.match(/\s+|\w+|./g) ?? []) {
                const span = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                span.textContent = token;
                span.setAttribute('fill', KEYWORD.test(token) ? color.value : /^\d+$/.test(token) ? color.target : color.ink);
                text.el.appendChild(span);
            }
        });

        // Right side: the outer box up top, the block's frame below it
        const bucket = (x: number, y: number, label: string) => {
            const tag = draw.text(label, x + 40, y - 9, { mono: true, size: 13, color: color.dim, anchor: 'middle' });
            const box = draw.rect(x, y, 80, 44, { color: color.dim, width: 1.5 });
            const value = draw.text('', x + 40, y + 29, { mono: true, size: 18, anchor: 'middle', color: color.value });
            return { box, value, tag };
        };
        const OX = 400;
        const outer = bucket(OX, 52, 'speed');
        const outerTag = draw.text('hidden', OX + 96, 80, { size: 13, color: color.dim });

        const frame = draw.rect(OX - 24, 130, 292, 170, { color: color.focus, width: 1.5, dash: '6 5' });
        const frameLabel = draw.text('inside the braces', OX - 12, 152, { size: 13, color: color.focus });
        const extra = bucket(OX, 200, 'extra');
        const inner = bucket(OX + 150, 200, 'speed');

        const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

        return ({ t }) => {
            const index = Math.min(STATES.length - 1, Math.floor(t / STEP));
            const s = STATES[index];
            const prev = STATES[Math.max(0, index - 1)];
            const within = Math.min(1, (t - index * STEP) / (STEP * 0.3));
            const k = 1 - Math.pow(1 - within, 3);

            band.set({ y: top + (s.line - 1) * lineHeight - lineHeight * 0.7 });

            // Boxes fade between their previous and current visibility
            const fade = (a: number, b: number) => lerp(a, b, k);
            const hidden = fade(prev.outerHidden, s.outerHidden);
            outer.box.opacity(1 - 0.6 * hidden);
            outer.tag.opacity(1 - 0.6 * hidden);
            outer.value.text(s.outer).opacity(1 - 0.6 * hidden);
            outerTag.opacity(hidden);

            frame.opacity(fade(prev.block, s.block));
            frameLabel.opacity(fade(prev.block, s.block));

            // A box that just disappeared shows its last value while it fades
            const extraOpacity = fade(prev.extraOn, s.extraOn);
            extra.box.opacity(extraOpacity);
            extra.tag.opacity(extraOpacity);
            extra.value.text(s.extra === '' ? prev.extra : s.extra).opacity(extraOpacity);
            const innerOpacity = fade(prev.innerOn, s.innerOn);
            inner.box.opacity(innerOpacity);
            inner.tag.opacity(innerOpacity);
            inner.value.text(s.inner === '' ? prev.inner : s.inner).opacity(innerOpacity);
        };
    },
});
