import { defineScene } from '@kit/scene';
import { MemoryRow } from '@kit/memory';
import { fadeIn, timeline } from '@kit/timeline';
import { color } from '@kit/palette';

const FIRST = 96;
const X = 40;
const ROW_Y = 214;
const CELL = 40;

// Leftover bytes from whatever used this memory before
const JUNK = [183, 92, 14, 240, 7, 66, 129, 31, 250, 3, 118, 77, 201, 45, 9, 162];

// Each variable: first cell, its bytes, the moment it is stored
const VARS = [
    { type: 'int', name: 'speed', start: 0, bytes: [50, 0, 0, 0], at: 2.4 },
    { type: 'char', name: 'grade', start: 4, bytes: [65], at: 6.4 },
    { type: 'bool', name: 'ready', start: 5, bytes: [1], at: 8.6, lift: 30 },
    { type: 'double', name: 'diameter', start: 8, bytes: [0, 0, 0, 0, 0, 0, 10, 64], at: 11.2 },
];

export default defineScene({
    label: 'A row of 16 memory bytes with addresses 96 to 111. An int takes four bytes, a char and a bool take one each, and a double takes eight. The name of each variable labels its first byte.',
    duration: 22,
    height: 330,
    beats: [
        { at: 0, text: 'This is memory from <em>Inside a Computer</em>: numbered bytes. Every byte already holds something left over from earlier.' },
        { at: 2.4, text: '<code>int speed = 50;</code> The compiler claims four bytes in a row, addresses 96 to 99, and stores 50 across them. The low part comes first, so 50 sits in 96.' },
        { at: 6.4, text: '<code>char grade = \'A\';</code> One byte. The letter A is stored as its code, 65.' },
        { at: 8.6, text: '<code>bool ready = true;</code> Also one byte. True is stored as 1.' },
        { at: 11.2, text: '<code>double diameter = 3.25;</code> Eight bytes. They hold an encoding of the number, not its digits. You never read them directly.' },
        { at: 15, text: 'Addresses 102 and 103 stayed unused. Compilers like each variable to start at an address that is a multiple of its size, so gaps appear.' },
        { at: 18, text: 'The name is only a label on the first byte. The type tells the compiler how many bytes to read from there.' },
    ],
    build({ draw }) {
        const tl = timeline();

        const memory = new MemoryRow(draw, { x: X, y: ROW_Y, count: 16, cellWidth: CELL, firstAddress: FIRST, values: JUNK });

        const cellX = (i: number) => X + i * CELL;
        for (const v of VARS) {
            const left = cellX(v.start) + 2;
            const right = cellX(v.start + v.bytes.length) - 2;
            const span = draw.span(left, ROW_Y - 14, right, ROW_Y - 14, { color: color.value, width: 1.5, tick: 5 });
            const lift = v.lift ?? 0;
            const name = draw.text(v.name, left, ROW_Y - 48 - lift, { mono: true, size: 12.5, color: color.ink });
            const type = draw.text(v.type, left, ROW_Y - 32 - lift, { mono: true, size: 11, color: color.value });
            const nodes = [span, name, type];
            if (lift) nodes.push(draw.line(left + 6, ROW_Y - 14 - lift + 4, left + 6, ROW_Y - 14, { color: color.faint, width: 1 }));
            for (const node of nodes) fadeIn(tl, node, v.at, 0.4);
        }

        // Cells hold junk until their variable is stored
        const script = memory.values.map((_, i) => {
            const v = VARS.find((item) => i >= item.start && i < item.start + item.bytes.length);
            return v ? { at: v.at + 0.6, value: v.bytes[i - v.start] } : null;
        });

        const gap = draw.text('unused', cellX(6) + CELL, ROW_Y - 22, { size: 12.5, color: color.dim, anchor: 'middle' });
        fadeIn(tl, gap, 15, 0.4);
        const first = draw.rect(cellX(0) + 1, ROW_Y + 1, CELL - 2, memory.cellHeight - 2, { color: color.focus, width: 2.5 });
        fadeIn(tl, first, 18, 0.4);
        tl.to({}, { duration: 0.1 }, 21.9);

        return {
            timeline: tl,
            update: ({ t }) => {
                memory.values.forEach((node, i) => {
                    const item = script[i];
                    const stored = item && t >= item.at;
                    node.text(stored ? item.value : JUNK[i]).set({ fill: stored ? color.value : color.faint });
                });
            },
        };
    },
});
