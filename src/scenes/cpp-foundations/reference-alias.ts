import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';
import { codePanel } from './lib/code-panel';
import { lerp, stepAt } from './lib/steps';

const CODE = [
    'int score = 10;',
    'int& r = score;',
    'int copy = score;',
    'r = 20;',
];

interface State {
    line: number;
    alias: number;
    copy: number;
    score: number;
    copied: number;
    note: string;
}

const STATES: State[] = [
    { line: 1, alias: 0, copy: 0, score: 10, copied: 0, note: 'A box named <code>score</code>, holding 10, at address 100.' },
    { line: 2, alias: 1, copy: 0, score: 10, copied: 0, note: '<code>int&</code> declares a <em>reference</em>. No new box appears. <code>r</code> is a second name tied to the box <code>score</code> already is.' },
    { line: 3, alias: 1, copy: 1, score: 10, copied: 10, note: 'A plain <code>int</code> is different. <code>copy</code> gets its own box, at its own address, and the 10 is copied in.' },
    { line: 4, alias: 1, copy: 1, score: 20, copied: 10, note: 'Writing through <code>r</code> writes to the one box, so <code>score</code> reads 20 too. <code>copy</code> never hears about it.' },
];

const STEP = 3.2;
const BX = 430;
const BW = 120;
const BH = 50;

export default defineScene({
    label: 'A box named score holds 10. A reference r is added as a second label on the same box, with no new box. A separate variable copy gets its own box with its own copy of the value. Assigning 20 through r changes score to 20 but leaves copy at 10.',
    duration: STATES.length * STEP,
    height: 280,
    beats: STATES.map((s, i) => ({ at: i * STEP, text: s.note })),
    build({ draw }) {
        const highlight = codePanel(draw, CODE);

        // The shared box, with its labels above and below
        const box = draw.rect(BX, 70, BW, BH, { color: color.dim, width: 1.5 });
        const value = draw.text('', BX + BW / 2, 102, { mono: true, size: 18, anchor: 'middle', color: color.value });
        draw.text('score', BX + BW / 2, 58, { mono: true, size: 14, anchor: 'middle', color: color.dim });
        draw.text('100', BX - 10, 100, { mono: true, size: 11, anchor: 'end', color: color.faint });
        const rLabel = draw.text('r', BX + BW / 2, 148, { mono: true, size: 14, anchor: 'middle', color: color.focus });
        const rTie = draw.line(BX + BW / 2, 120, BX + BW / 2, 132, { color: color.focus, width: 1.5 });

        // The separate box
        const copyBox = draw.rect(BX, 190, BW, BH, { color: color.dim, width: 1.5 });
        const copyValue = draw.text('', BX + BW / 2, 222, { mono: true, size: 18, anchor: 'middle', color: color.value });
        const copyName = draw.text('copy', BX + BW / 2, 178, { mono: true, size: 14, anchor: 'middle', color: color.dim });
        const copyAddress = draw.text('104', BX - 10, 220, { mono: true, size: 11, anchor: 'end', color: color.faint });

        return ({ t }) => {
            const { s, prev, k } = stepAt(STATES, STEP, t);

            highlight(s.line);

            const alias = lerp(prev.alias, s.alias, k);
            rLabel.opacity(alias);
            rTie.opacity(alias);
            box.set({ stroke: s.alias ? color.focus : color.dim });
            value.text(s.score);

            const copy = lerp(prev.copy, s.copy, k);
            copyBox.opacity(copy);
            copyValue.text(s.copied).opacity(copy);
            copyName.opacity(copy);
            copyAddress.opacity(copy);
        };
    },
});
