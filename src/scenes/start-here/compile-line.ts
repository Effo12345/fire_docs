import { defineScene } from '@kit/scene';
import { MemoryRow } from '@kit/memory';
import { fadeIn, fadeOut, textAt, timeline } from '@kit/timeline';
import { color } from '@kit/palette';

const ASM = ['load  r0, [2]', 'load  r1, [5]', 'add   r2, r0, r1', 'store r2, [6]'];
const WORDS = ['e5903008', 'e5902014', 'e0833002', 'e5803018'];
const ARM = ['ldr r3, [r0, #8]', 'ldr r2, [r0, #20]', 'add r3, r3, r2', 'str r3, [r0, #24]'];

export default defineScene({
    label: 'The C++ line total = first + second is compiled: its names become memory addresses, it splits into four assembly instructions, those become numbers stored at addresses 100 to 103, and running them puts 12 into address 6',
    height: 400,
    beats: [
        { at: 0, text: 'One line of C++. It says: add the number called <em>first</em> to the number called <em>second</em>, and keep the answer in <em>total</em>. A CPU has no idea what any of that means.' },
        { at: 3, text: 'First job for the <em>compiler</em>: give every name a place in memory. Here <em>first</em> gets address 2, <em>second</em> gets 5, and <em>total</em> gets 6. From now on the names are gone and only addresses are left.' },
        { at: 9.5, text: 'Second job: break the line into steps the CPU can do. Read two values, add them, write the answer. These are the four instructions from the last page.' },
        { at: 15.5, text: 'Last job: turn each instruction into a number, and put the numbers in memory. These are the real ones a compiler for this CPU wrote for this line. The ARM notation on the right is the same four steps, spelled the way ARM spells them.' },
        { at: 22.5, text: 'Now the CPU can run them. It loads 7, loads 5, adds, and stores 12 over the 2 that was in address 6.' },
        { at: 27, text: 'One line of source code became four instructions and a change to one box of memory. That change is all the line ever did.' },
    ],
    build({ draw }) {
        const tl = timeline();
        const CHAR = 12;

        // The source line, one text node per name so each can be colored later
        const lineX = 222;
        const lineY = 38;
        const at = (i: number) => lineX + i * CHAR;
        draw.text('source code', 16, lineY, { color: color.dim, size: 13 });
        const pieces: [string, number, string][] = [
            ['total', 0, color.ink], ['=', 6, color.ink], ['first', 8, color.ink], ['+', 14, color.ink], ['second', 16, color.ink], [';', 22, color.ink],
        ];
        const tokens = pieces.map(([s, i, c]) => draw.text(s, at(i), lineY, { mono: true, size: 20, color: c }));
        const nameColor = [color.target, color.value, color.value];
        const nameTokens = [tokens[0], tokens[2], tokens[4]];

        // Data memory, with labels for where each name lives
        const memoryY = 290;
        const memory = new MemoryRow(draw, { x: 136, y: memoryY, count: 8, values: [3, 9, 7, 1, 4, 5, 2, 8] });
        draw.text('data memory', 16, memoryY + 28, { color: color.dim, size: 13 });
        const homes: [number, string, 'start' | 'end'][] = [[6, 'total', 'start'], [2, 'first', 'middle'], [5, 'second', 'end']];
        homes.forEach(([cell, name, anchor], k) => {
            const cx = memory.centerX(cell);
            const shift = anchor === 'start' ? -22 : anchor === 'end' ? 22 : 0;
            const label = draw.text(name, cx + shift, memoryY - 12, { mono: true, size: 14, anchor, color: nameColor[k] });
            const outline = draw.rect(136 + cell * 56, memoryY, 56, 44, { color: nameColor[k], width: 2.5 });
            fadeIn(tl, label, 4 + k * 1.4, 0.4);
            fadeIn(tl, outline, 4 + k * 1.4, 0.4);
            fadeOut(tl, outline, 9, 0.4);
        });

        // Column headings and the four instructions
        const rows = [104, 134, 164, 194];
        const headings = [
            draw.text('assembly', 70, 76, { color: color.dim, size: 13 }),
            draw.text('machine code', 330, 76, { color: color.dim, size: 13 }),
            draw.text('same steps in ARM notation', 470, 76, { color: color.dim, size: 13 }),
        ];
        fadeIn(tl, headings[0], 9.5, 0.4);
        fadeIn(tl, headings[1], 15.5, 0.4);
        fadeIn(tl, headings[2], 17.5, 0.4);

        ASM.forEach((line, i) => {
            const y = rows[i];
            const start = 10.2 + i * 1.2;
            const operand = line.indexOf('[');
            const prefix = operand < 0 ? line : line.slice(0, operand);
            const memPart = operand < 0 ? '' : line.slice(operand);
            const a = draw.text(prefix, 70, y, { mono: true, size: 15 });
            a.el.style.whiteSpace = 'pre';
            fadeIn(tl, a, start, 0.5);
            if(memPart) {
                const m = draw.text(memPart, 70 + prefix.length * 9, y, { mono: true, size: 15, color: i === 3 ? color.target : color.value });
                fadeIn(tl, m, start, 0.5);
            }
            fadeIn(tl, draw.text(100 + i, 24, y, { mono: true, size: 12, color: color.faint }), 16 + i * 0.5, 0.4);
            const word = draw.text(WORDS[i], 330, y, { mono: true, size: 15, color: color.focus });
            fadeIn(tl, word, 16 + i * 0.5, 0.5);
            const arm = draw.text(ARM[i], 470, y, { mono: true, size: 13, color: color.dim });
            fadeIn(tl, arm, 18 + i * 0.5, 0.5);
        });

        // Running it
        const cell = (i: number) => draw.rect(136 + i * 56, memoryY, 56, 44, { color: color.focus, width: 2.5 });
        [[2, 23.2], [5, 24.4], [6, 25.6]].forEach(([i, time]) => {
            const box = cell(i);
            fadeIn(tl, box, time, 0.2);
            fadeOut(tl, box, time + 1.0, 0.3);
        });
        const final = cell(6);
        fadeIn(tl, final, 26.9, 0.3);
        tl.to(memory.values[6].el, { opacity: 0, duration: 0.2 }, 25.8);
        const twelve = draw.text(12, memory.centerX(6), memoryY + 28, { mono: true, size: 16, anchor: 'middle', color: color.focus });
        fadeIn(tl, twelve, 25.9, 0.3);
        tl.to({}, { duration: 0.1 }, 30);

        return {
            timeline: tl,
            update: ({ t }) => {
                nameTokens.forEach((token, k) => {
                    const lit = t >= 4 + k * 1.4 && t < 9;
                    token.set({ fill: lit ? nameColor[k] : color.ink });
                });
            },
        };
    },
});
