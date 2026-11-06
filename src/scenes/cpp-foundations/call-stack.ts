import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';
import { codePanel } from './lib/code-panel';

const CODE = [
    'int add(int a, int b) {',
    '    return a + b;',
    '}',
    '',
    'int average(int x, int y) {',
    '    int sum = add(x, y);',
    '    return sum / 2;',
    '}',
    '',
    'int main() {',
    '    int r = average(50, 80);',
    '}',
];

type Row = [string, string | number];

interface Frame {
    rows: Row[];
    back: string;
}

// Frames on the stack after each step, bottom to top: main, average, add
interface State {
    line: number;
    frames: Frame[];
    note: string;
}

const MAIN = (r: string | number): Frame => ({ rows: [['r', r]], back: 'back to: the system' });
const AVG = (sum: string | number): Frame => ({ rows: [['x', 50], ['y', 80], ['sum', sum]], back: 'back to: line 11' });
const ADD: Frame = { rows: [['a', 50], ['b', 80]], back: 'back to: line 6' };

const STATES: State[] = [
    { line: 10, frames: [MAIN('?')], note: 'The program starts in <code>main</code>. Its call gets a <em>stack frame</em>: room for its local <code>r</code>, which holds leftover junk (shown as ?) until it is assigned.' },
    { line: 11, frames: [MAIN('?')], note: '<code>main</code> calls <code>average</code> with 50 and 80. First the arguments are worked out.' },
    { line: 5, frames: [MAIN('?'), AVG('?')], note: 'A new frame goes on top. It holds the parameters <code>x</code> and <code>y</code>, a spot for the local <code>sum</code>, and the line to come back to.' },
    { line: 6, frames: [MAIN('?'), AVG('?')], note: '<code>average</code> calls <code>add</code>, and the call starts with the arguments <code>x</code> and <code>y</code>.' },
    { line: 1, frames: [MAIN('?'), AVG('?'), ADD], note: 'A third frame, on top again. Only the top frame is running. The two below it wait, untouched.' },
    { line: 2, frames: [MAIN('?'), AVG('?'), ADD], note: '50 + 80 is 130. <code>return</code> hands that back and ends the call.' },
    { line: 6, frames: [MAIN('?'), AVG(130)], note: 'The top frame is popped. Its memory is free to reuse, and <code>a</code> and <code>b</code> are gone. The returned 130 lands in <code>sum</code>.' },
    { line: 7, frames: [MAIN('?'), AVG(130)], note: '130 / 2 is 65. This is integer division, as in <em>Math and Decisions</em>.' },
    { line: 11, frames: [MAIN(65)], note: '<code>average</code>\'s frame is popped, and 65 goes into <code>r</code>. <code>sum</code>, <code>x</code> and <code>y</code> no longer exist.' },
    { line: 12, frames: [], note: '<code>main</code> ends and its frame is popped too. The stack is empty again.' },
];

const STEP = 2.8;
const ROW = 24;
const HEAD = 28;
const FOOT = 26;
const FX = 410;
const FW = 250;
const BASE = 372;
const FRAME_HEIGHT = (f: Frame) => HEAD + f.rows.length * ROW + FOOT;
const NAMES = ['main', 'average', 'add'];

export default defineScene({
    label: 'The call stack. A program runs main, which calls average, which calls add. Each call pushes a frame holding its parameters, locals and return spot onto a stack, and each return pops the top frame off again.',
    duration: STATES.length * STEP,
    height: 400,
    beats: STATES.map((s, i) => ({ at: i * STEP, text: s.note })),
    build({ draw }) {
        const highlight = codePanel(draw, CODE, 36, 28);

        draw.text('the call stack', FX, 26, { size: 13, color: color.dim });
        draw.line(FX - 12, BASE + 8, FX + FW + 12, BASE + 8, { color: color.faint, width: 1.5 });

        // One slot per function, placed by the height of the frames beneath it
        const heights = [MAIN('?'), AVG('?'), ADD].map(FRAME_HEIGHT);
        const slots = NAMES.map((name, i) => {
            const below = heights.slice(0, i).reduce((a, b) => a + b, 0) + i * 6;
            const top = BASE - below - heights[i];
            const box = draw.rect(FX, top, FW, heights[i], { color: color.focus, width: 1.75 });
            const title = draw.text(name, FX + 12, top + 19, { mono: true, size: 14, color: color.focus });
            const rows = [0, 1, 2].map((r) => ({
                label: draw.text('', FX + 16, top + HEAD + 17 + r * ROW, { mono: true, size: 13, color: color.dim }),
                value: draw.text('', FX + FW - 16, top + HEAD + 17 + r * ROW, { mono: true, size: 14, anchor: 'end' }),
            }));
            const back = draw.text('', FX + 16, top + heights[i] - 9, { size: 12.5, color: color.dim });
            return { box, title, rows, back };
        });

        const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

        return ({ t }) => {
            const index = Math.min(STATES.length - 1, Math.floor(t / STEP));
            const s = STATES[index];
            const prev = STATES[Math.max(0, index - 1)];
            const within = Math.min(1, (t - index * STEP) / (STEP * 0.3));
            const k = 1 - Math.pow(1 - within, 3);

            highlight(s.line);

            slots.forEach((slot, i) => {
                // A frame that just left shows its last contents while it fades
                const now = s.frames[i];
                const was = prev.frames[i];
                const frame = now ?? was;
                const opacity = lerp(was ? 1 : 0, now ? 1 : 0, k);
                const isTop = now && i === s.frames.length - 1;

                slot.box.opacity(opacity).set({ stroke: isTop ? color.focus : color.dim });
                slot.title.opacity(opacity);
                slot.back.opacity(opacity);
                slot.rows.forEach((row, r) => {
                    const entry = frame?.rows[r];
                    row.label.text(entry ? entry[0] : '').opacity(opacity);
                    const value = entry ? entry[1] : '';
                    row.value.text(value).opacity(opacity).set({ fill: value === '?' ? color.faint : color.value });
                });
                if(frame) {
                    slot.back.text(frame.back);
                }
            });
        };
    },
});
