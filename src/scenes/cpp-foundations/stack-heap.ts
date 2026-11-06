import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';
import { codePanel } from './lib/code-panel';
import { curvedArrow } from './lib/curved-arrow';
import { lerp, stepAt } from './lib/steps';

const CODE = [
    'int* make(int v) {',
    '    return new int(v);',
    '}',
    '',
    'int main() {',
    '    int* p = make(5);',
    '    int* q = make(8);',
    '    q = p;',
    '    delete p;',
    '}',
];

// Block status: 0 not there, 1 in use, 2 leaked (nothing points at it), 3 freed
// Pointer target: -1 none, 0 block A, 1 block B
interface State {
    line: number;
    main: number;
    make: number;
    a: number;
    b: number;
    p: string;
    q: string;
    pt: number;
    qt: number;
    note: string;
}

const STATES: State[] = [
    { line: 5, main: 1, make: 0, a: 0, b: 0, p: '?', q: '?', pt: -1, qt: -1, note: '<code>main</code> has a frame on the stack. <code>p</code> and <code>q</code> hold junk until assigned. The heap, on the right, is empty.' },
    { line: 2, main: 1, make: 1, a: 1, b: 0, p: '?', q: '?', pt: -1, qt: -1, note: '<code>make(5)</code> gets a frame. <code>new int(v)</code> asks the heap for a box and puts 5 in it. The box lands at address 9000.' },
    { line: 6, main: 1, make: 0, a: 1, b: 0, p: '9000', q: '?', pt: 0, qt: -1, note: 'The return hands back the address, and the frame is popped. The box on the heap is still there, and now <code>p</code> is the only thing that knows where it is.' },
    { line: 7, main: 1, make: 0, a: 1, b: 1, p: '9000', q: '9040', pt: 0, qt: 1, note: 'The same again for <code>make(8)</code>, which lands at 9040.' },
    { line: 8, main: 1, make: 0, a: 1, b: 2, p: '9000', q: '9000', pt: 0, qt: 0, note: '<code>q = p;</code> overwrites the only copy of 9040. The 8 is still in memory, but nothing can reach it and nothing will ever free it. That is a <em>leak</em>.' },
    { line: 9, main: 1, make: 0, a: 3, b: 2, p: '9000', q: '9000', pt: 0, qt: 0, note: '<code>delete p;</code> gives the first box back. <code>p</code> and <code>q</code> still hold 9000, so both now point at memory that is no longer theirs. These are <em>dangling</em> pointers.' },
    { line: 10, main: 0, make: 0, a: 3, b: 2, p: '9000', q: '9000', pt: 0, qt: 0, note: 'When <code>main</code> ends, its frame pops and <code>p</code> and <code>q</code> disappear on their own. The leaked box stays until the program stops. The stack cleaned up after itself; the heap did not.' },
];

const STEP = 3.4;
const SX = 370;
const SW = 130;
const BASE = 322;
const ROW = 26;
const HX = 580;
const HW = 110;
const HH = 44;

const HEAP_Y = [92, 186];
const BLOCK_ADDR = [9000, 9040];

export default defineScene({
    label: 'The stack on the left and the heap on the right. A function make asks the heap for a box with new and returns its address. The box survives the function returning. Overwriting the only pointer to a second box leaks it, and deleting the first box leaves two dangling pointers.',
    duration: STATES.length * STEP,
    height: 360,
    beats: STATES.map((s, i) => ({ at: i * STEP, text: s.note })),
    build({ draw }) {
        const highlight = codePanel(draw, CODE);

        draw.text('stack', SX, 26, { size: 13, color: color.dim });
        draw.text('heap', HX, 26, { size: 13, color: color.dim });
        draw.line(SX - 12, BASE + 8, SX + SW + 12, BASE + 8, { color: color.faint, width: 1.5 });
        draw.line(556, 36, 556, 340, { color: color.rule, width: 1 });

        const MAIN_H = 30 + ROW * 2 + 6;
        const MAKE_H = 30 + ROW + 6;
        const mainTop = BASE - MAIN_H;
        const makeTop = mainTop - 6 - MAKE_H;

        const frame = (top: number, height: number, name: string) => ({
            box: draw.rect(SX, top, SW, height, { color: color.focus, width: 1.75 }),
            title: draw.text(name, SX + 10, top + 19, { mono: true, size: 14, color: color.focus }),
        });
        const cell = (top: number, row: number, name: string) => ({
            name: draw.text(name, SX + 14, top + 30 + row * ROW + 17, { mono: true, size: 13, color: color.dim }),
            value: draw.text('', SX + SW - 14, top + 30 + row * ROW + 17, { mono: true, size: 14, anchor: 'end', color: color.value }),
            y: top + 30 + row * ROW + 12,
        });

        const mainFrame = frame(mainTop, MAIN_H, 'main');
        const pCell = cell(mainTop, 0, 'p');
        const qCell = cell(mainTop, 1, 'q');
        const makeFrame = frame(makeTop, MAKE_H, 'make');
        const vCell = cell(makeTop, 0, 'v');
        vCell.value.text(5);

        const blocks = HEAP_Y.map((y, i) => ({
            box: draw.rect(HX, y, HW, HH, { color: color.focus, width: 1.5 }),
            value: draw.text(i === 0 ? 5 : 8, HX + HW / 2, y + 29, { mono: true, size: 17, anchor: 'middle', color: color.value }),
            address: draw.text(BLOCK_ADDR[i], HX, y - 8, { mono: true, size: 11, color: color.faint }),
            tag: draw.text('', HX + HW / 2, y + HH + 18, { size: 12.5, anchor: 'middle', color: color.error }),
        }));

        const pArrow = curvedArrow(draw, 0);
        const qArrow = curvedArrow(draw, 0);

        const status = (b: number, v: number) => (b === v ? 1 : 0);

        return ({ t }) => {
            const { s, prev, k } = stepAt(STATES, STEP, t);

            highlight(s.line);

            const mainOn = lerp(prev.main, s.main, k);
            [mainFrame.box, mainFrame.title, pCell.name, pCell.value, qCell.name, qCell.value].forEach((n) => n.opacity(mainOn));
            const makeOn = lerp(prev.make, s.make, k);
            [makeFrame.box, makeFrame.title, vCell.name, vCell.value].forEach((n) => n.opacity(makeOn));

            // A popped frame keeps its last values while it fades
            const mainState = s.main ? s : prev;
            pCell.value.text(mainState.p).set({ fill: mainState.p === '?' ? color.faint : color.focus });
            qCell.value.text(mainState.q).set({ fill: mainState.q === '?' ? color.faint : color.focus });

            const wasStatus = [prev.a, prev.b];
            const nowStatus = [s.a, s.b];
            blocks.forEach((b, i) => {
                const st = nowStatus[i];
                const present = lerp(wasStatus[i] ? 1 : 0, st ? 1 : 0, k);
                const freed = st === 3;
                const leaked = st === 2;
                b.box.opacity(present).set({ stroke: leaked ? color.error : freed ? color.faint : color.focus, 'stroke-dasharray': freed ? '5 4' : '' });
                b.value.opacity(freed ? lerp(present, 0.35, k) : present);
                b.address.opacity(present);
                b.tag.text(leaked ? 'leaked' : freed ? 'freed' : '').opacity(present).set({ fill: leaked ? color.error : color.dim });
            });

            // Arrows from p and q to their blocks, red once the target is freed
            const arrowFor = (draw: typeof pArrow, cellY: number, target: number, wasTarget: number, afterDelete: boolean) => {
                const t1 = target >= 0 ? target : wasTarget;
                const t0 = wasTarget >= 0 ? wasTarget : target;
                const on = target >= 0 ? lerp(wasTarget >= 0 ? 1 : 0, 1, k) : 0;
                const aim = lerp(HEAP_Y[t0 < 0 ? 0 : t0] + HH / 2, HEAP_Y[t1 < 0 ? 0 : t1] + HH / 2, k);
                draw(SX + SW, cellY, HX - 4, aim, mainOn * on, afterDelete ? color.error : color.focus);
            };
            const dangling = s.a === 3;
            arrowFor(pArrow, pCell.y, s.main ? s.pt : prev.pt, prev.pt, dangling);
            arrowFor(qArrow, qCell.y, s.main ? s.qt : prev.qt, prev.qt, dangling);
        };
    },
});
