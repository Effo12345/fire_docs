import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';
import { codePanel } from './lib/code-panel';
import { curvedArrow } from './lib/curved-arrow';
import { lerp, stepAt } from './lib/steps';

const CODE = [
    'int score = 10;',
    'int* p = &score;',
    '*p = 7;',
    'int other = 3;',
    'p = &other;',
];

// One box per variable. Addresses are small made-up numbers; the real ones are huge.
const NAMES = ['score', 'p', 'other'];
const ADDRESS = [100, 104, 108];
const ROW_Y = [56, 126, 196];

interface State {
    line: number;
    shown: number[];
    values: (string | number)[];
    target: number;
    glow: number;
    note: string;
}

const STATES: State[] = [
    { line: 1, shown: [1, 0, 0], values: [10, '', ''], target: -1, glow: 0, note: '<code>int score = 10;</code> sets aside a box and puts 10 in it. Every box has an address, here 100, like the numbered boxes in <em>Inside a Computer</em>.' },
    { line: 2, shown: [1, 1, 0], values: [10, 100, ''], target: 0, glow: 0, note: '<code>&score</code> is the box\'s address, 100. The new variable <code>p</code> is another box, and the thing it holds is that number. The arrow is only a drawing of "100 means that box".' },
    { line: 3, shown: [1, 1, 0], values: [7, 100, ''], target: 0, glow: 1, note: '<code>*p</code> means "the box at the address in <code>p</code>". Writing 7 there changes <code>score</code>, and the name <code>score</code> never appeared on that line.' },
    { line: 4, shown: [1, 1, 1], values: [7, 100, 3], target: 0, glow: 0, note: 'A third box, at address 108.' },
    { line: 5, shown: [1, 1, 1], values: [7, 108, 3], target: 2, glow: 0, note: 'A pointer is a variable, so it can be assigned. <code>p</code> now holds 108. Nothing else moved: only the number inside <code>p</code> changed.' },
];

const STEP = 3.2;
const BX = 450;
const BW = 150;
const BH = 46;
const mid = (i: number) => ROW_Y[Math.max(0, i)] + BH / 2;

export default defineScene({
    label: 'Three boxes: score at address 100, p at address 104 and other at address 108. The pointer p is given the address 100, so it points at score. Writing 7 through p changes score. Then p is given the address 108 and points at other instead.',
    duration: STATES.length * STEP,
    height: 280,
    beats: STATES.map((s, i) => ({ at: i * STEP, text: s.note })),
    build({ draw }) {
        const highlight = codePanel(draw, CODE);
        const arrow = curvedArrow(draw, 64);

        const boxes = NAMES.map((name, i) => {
            const y = ROW_Y[i];
            return {
                box: draw.rect(BX, y, BW, BH, { color: color.dim, width: 1.5 }),
                name: draw.text(name, BX - 10, y + 20, { mono: true, size: 14, anchor: 'end', color: color.dim }),
                address: draw.text(ADDRESS[i], BX - 10, y + 36, { mono: true, size: 11, anchor: 'end', color: color.faint }),
                value: draw.text('', BX + BW / 2, y + 30, { mono: true, size: 18, anchor: 'middle', color: color.value }),
            };
        });

        draw.text('memory', BX, 30, { size: 13, color: color.dim });

        return ({ t }) => {
            const { s, prev, k } = stepAt(STATES, STEP, t);

            highlight(s.line);

            boxes.forEach((b, i) => {
                const opacity = lerp(prev.shown[i], s.shown[i], k);
                const lit = i === 0 ? s.glow : 0;
                b.box.opacity(opacity).set({ stroke: lit ? color.focus : color.dim });
                b.name.opacity(opacity);
                b.address.opacity(opacity);
                b.value.text(s.values[i]).opacity(opacity).set({ fill: i === 1 ? color.focus : color.value });
            });

            // The arrow leaves p and slides to whichever box p holds the address of
            const was = prev.target >= 0 ? prev.target : s.target;
            const now = s.target >= 0 ? s.target : prev.target;
            const aim = lerp(mid(was), mid(now), k);
            const on = s.target >= 0 ? lerp(prev.target >= 0 ? 1 : 0, 1, k) : 0;
            arrow(BX + BW, mid(1), BX + BW, aim, on, s.glow ? color.focus : color.dim);
        };
    },
});
