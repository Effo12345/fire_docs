import { defineScene } from '@kit/scene';
import { MemoryRow } from '@kit/memory';
import { fadeIn, fadeOut, slide, textAt, timeline } from '@kit/timeline';
import { color } from '@kit/palette';

const PROGRAM = ['load  r0, [2]', 'load  r1, [5]', 'add   r2, r0, r1', 'store r2, [6]'];
const FETCH = [2.5, 9, 13.5, 18];

export default defineScene({
    label: 'A CPU runs a four-instruction program: for each instruction it fetches it from memory, decodes it, and executes it, adding two numbers and storing the result',
    height: 390,
    beats: [
        { at: 0, text: 'A program sits in memory as a list of <em>instructions</em>. The <em>program counter</em> (PC) holds the address of the next one to run. This one is written in a readable form, but in memory each instruction is just a number.' },
        { at: 2.5, text: '<strong>Fetch.</strong> The CPU copies the instruction at the PC\'s address into its <em>instruction register</em>, and the PC moves on to the next address.' },
        { at: 5, text: '<strong>Decode.</strong> Circuits read the instruction\'s number and work out what it asks for: load the byte at address 2 into register r0.' },
        { at: 6.8, text: '<strong>Execute.</strong> The value is copied from memory into r0. Memory still has its copy, because reading never changes a byte.' },
        { at: 9, text: 'Same cycle, next instruction: fetch, decode, execute. Now r1 holds the 5.' },
        { at: 13.5, text: 'This instruction never touches memory. It sends two registers through the <em>ALU</em>, the CPU\'s math circuit, and puts the answer in r2.' },
        { at: 18, text: 'Last one: store r2 at address 6. The 2 that used to be there is gone for good.' },
        { at: 22, text: 'Four instructions to add two numbers. The V5 Brain can run over a billion of them every second.' },
    ],
    build({ draw }) {
        const tl = timeline();

        // Program in memory
        const rowY = (i: number) => 66 + i * 30;
        draw.text('program in memory', 16, 32, { color: color.dim, size: 14 });
        const band = draw.rect(14, 0, 200, 28, { fill: 'rgba(244, 211, 94, 0.12)' });
        PROGRAM.forEach((line, i) => {
            draw.text(100 + i, 20, rowY(i), { mono: true, size: 11, color: color.faint });
            draw.text(line, 54, rowY(i), { mono: true, size: 12.5 });
        });

        // CPU
        draw.rect(240, 16, 464, 222, { color: color.value, width: 2 });
        draw.text('CPU', 256, 42, { color: color.value, size: 16 });
        const phase = draw.text('', 690, 42, { color: color.focus, size: 15, anchor: 'end', italic: true });

        const box = (x: number, y: number, w: number, label: string) => {
            draw.rect(x, y, w, 40, { color: color.dim, width: 1.25 });
            draw.text(label, x + w / 2, y + 58, { color: color.dim, size: 12.5, anchor: 'middle' });
        };
        box(258, 62, 72, 'PC');
        box(350, 62, 180, 'instruction register');
        box(258, 150, 62, 'r0');
        box(334, 150, 62, 'r1');
        box(410, 150, 62, 'r2');
        box(516, 150, 168, 'ALU');
        const pc = draw.text('', 294, 88, { mono: true, size: 16, anchor: 'middle', color: color.focus });

        const REG = { r0: [289, 176], r1: [365, 176], r2: [441, 176] } as const;
        const IR: [number, number] = [440, 86];

        // Data memory
        const memoryY = 280;
        const memory = new MemoryRow(draw, { x: 136, y: memoryY, count: 8, values: [3, 9, 7, 1, 4, 5, 2, 8] });
        draw.text('data in memory', 136, memoryY - 10, { color: color.dim, size: 14 });
        const cellAt = (i: number): [number, number] => [memory.centerX(i), memoryY + 28];

        const token = (value: string | number, colorName: string, mono = true, size = 17) => {
            const group = draw.group();
            draw.text(value, 0, 0, { mono, size, anchor: 'middle', color: colorName, parent: group.el });
            return group;
        };
        const highlight = (i: number) => draw.rect(136 + i * 56, memoryY, 56, 44, { color: color.focus, width: 2.5 });

        // Each instruction arrives in the instruction register, then is replaced by the next
        PROGRAM.forEach((line, i) => {
            const fetched = token(line, color.ink, true, 12.5);
            fadeIn(tl, fetched, FETCH[i], 0.15);
            slide(tl, fetched, [100, rowY(i) - 1], IR, FETCH[i], 1);
            const next = FETCH[i + 1];
            fadeOut(tl, fetched, next ?? 22, 0.15);
        });

        // load r0, [2]
        const high2 = highlight(2);
        fadeIn(tl, high2, 6.8, 0.2);
        const a = token(7, color.value);
        fadeIn(tl, a, 7, 0.15);
        slide(tl, a, cellAt(2), [...REG.r0], 7, 1.1);
        fadeOut(tl, high2, 8.4, 0.2);

        // load r1, [5]
        const high5 = highlight(5);
        fadeIn(tl, high5, 11.2, 0.2);
        const b = token(5, color.value);
        fadeIn(tl, b, 11.4, 0.15);
        slide(tl, b, cellAt(5), [...REG.r1], 11.4, 1.1);
        fadeOut(tl, high5, 12.8, 0.2);

        // add r2, r0, r1
        const sum = token('7 + 5 = 12', color.focus, true, 15);
        sum.move(600, 175);
        fadeIn(tl, sum, 15.2, 0.4);
        const result = token(12, color.focus);
        fadeIn(tl, result, 16.2, 0.15);
        slide(tl, result, [600, 176], [...REG.r2], 16.2, 0.9);

        // store r2, [6]
        const high6 = highlight(6);
        fadeIn(tl, high6, 20, 0.2);
        const stored = token(12, color.focus);
        fadeIn(tl, stored, 20.1, 0.15);
        slide(tl, stored, [...REG.r2], cellAt(6), 20.1, 1.1);
        tl.to(memory.values[6].el, { opacity: 0, duration: 0.2 }, 20.9);
        fadeOut(tl, high6, 21.5, 0.3);
        tl.to({}, { duration: 0.1 }, 25.4);

        const rowFor = (t: number) => {
            if(t < FETCH[1]) return 0;
            if(t < FETCH[2]) return 1;
            if(t < FETCH[3]) return 2;
            return 3;
        };

        return {
            timeline: tl,
            update: ({ t }) => {
                band.set({ y: rowY(rowFor(t)) - 18 }).show(t < 22);
                pc.text(textAt(t, [[0, 100], [3.6, 101], [10.1, 102], [14.6, 103], [19.1, 104]]));
                phase.text(textAt(t, [
                    [2.5, 'fetch'], [5, 'decode'], [6.8, 'execute'],
                    [9, 'fetch'], [10.3, 'decode'], [11.2, 'execute'],
                    [13.5, 'fetch'], [14.7, 'decode'], [15.2, 'execute'],
                    [18, 'fetch'], [19.2, 'decode'], [20, 'execute'],
                    [22, ''],
                ]));
            },
        };
    },
});
