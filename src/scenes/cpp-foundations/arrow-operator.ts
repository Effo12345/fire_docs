import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';
import { codePanel } from './lib/code-panel';
import { curvedArrow } from './lib/curved-arrow';
import { lerp, stepAt } from './lib/steps';

const CODE = [
    'struct Point { int x; int y; };',
    'Point pt = {3, 4};',
    'Point* p = &pt;',
    'p->x = 8;',
];

// pick: 0 nothing, 1 the whole struct (*p), 2 the field x
interface State {
    line: number;
    p: number;
    pick: number;
    x: number;
    label: string;
    note: string;
}

const STATES: State[] = [
    { line: 2, p: 0, pick: 0, x: 3, label: '', note: 'A <code>Point</code> is two ints stored side by side. Its address, 200, is where the first one starts.' },
    { line: 3, p: 1, pick: 0, x: 3, label: '', note: '<code>p</code> holds that address.' },
    { line: 4, p: 1, pick: 1, x: 3, label: '*p', note: 'Take <code>p->x = 8;</code> apart. <code>*p</code> follows the arrow and gives the whole <code>Point</code>.' },
    { line: 4, p: 1, pick: 2, x: 3, label: '(*p).x', note: 'Then <code>.x</code> picks the field out of it. The parentheses are needed because <code>.</code> binds tighter than <code>*</code>.' },
    { line: 4, p: 1, pick: 2, x: 8, label: 'p->x', note: '<code>p->x</code> is the same thing, written the way people actually write it. 8 goes into the <code>x</code> field of <code>pt</code>.' },
];

const STEP = 3.2;
const BX = 440;
const CW = 100;
const CH = 46;
const PT_Y = 190;

export default defineScene({
    label: 'A Point struct holds two ints, x and y, at addresses 200 and 204. A pointer p holds the address 200. The expression star p picks out the whole Point, dot x picks the x field, and p arrow x is shorthand for that pair. Assigning 8 changes x from 3 to 8.',
    duration: STATES.length * STEP,
    height: 316,
    beats: STATES.map((s, i) => ({ at: i * STEP, text: s.note })),
    build({ draw }) {
        const highlight = codePanel(draw, CODE);
        const arrow = curvedArrow(draw, 0);

        // p sits above the struct, its arrow comes straight down
        const pBox = draw.rect(BX, 56, CW, CH, { color: color.dim, width: 1.5 });
        const pName = draw.text('p', BX - 10, 84, { mono: true, size: 14, anchor: 'end', color: color.dim });
        const pValue = draw.text('200', BX + CW / 2, 86, { mono: true, size: 18, anchor: 'middle', color: color.focus });

        const cells = ['x', 'y'].map((name, i) => {
            const x = BX + i * CW;
            return {
                box: draw.rect(x, PT_Y, CW, CH, { color: color.dim, width: 1.5 }),
                name: draw.text(name, x + 10, PT_Y + 17, { mono: true, size: 12.5, color: color.dim }),
                address: draw.text(200 + i * 4, x + CW / 2, PT_Y + CH + 18, { mono: true, size: 11, anchor: 'middle', color: color.faint }),
                value: draw.text('', x + CW / 2, PT_Y + 30, { mono: true, size: 18, anchor: 'middle', color: color.value }),
            };
        });
        draw.text('pt', BX - 10, PT_Y + 29, { mono: true, size: 14, anchor: 'end', color: color.dim });
        const outline = draw.rect(BX - 4, PT_Y - 4, CW * 2 + 8, CH + 8, { color: color.focus, width: 2 });
        const outlineX = draw.rect(BX - 4, PT_Y - 4, CW + 8, CH + 8, { color: color.focus, width: 2 });
        const label = draw.text('', BX + CW, 290, { mono: true, size: 18, anchor: 'middle', color: color.focus });

        return ({ t }) => {
            const { s, prev, k } = stepAt(STATES, STEP, t);

            highlight(s.line);

            const pOn = lerp(prev.p, s.p, k);
            pBox.opacity(pOn);
            pValue.opacity(pOn);
            pName.opacity(pOn);
            arrow(BX + CW / 2, 56 + CH, BX + CW / 2, PT_Y - 4, pOn, s.pick ? color.focus : color.dim);

            cells[0].value.text(s.x);
            cells[1].value.text(4);

            outline.opacity(s.pick === 1 ? 1 : 0);
            outlineX.opacity(s.pick === 2 ? 1 : 0);
            label.text(s.label);
        };
    },
});
