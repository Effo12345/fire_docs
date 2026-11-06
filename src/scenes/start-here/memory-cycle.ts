import { defineScene } from '@kit/scene';
import { MemoryRow } from '@kit/memory';
import { create, fadeIn, fadeOut, slide, textAt, timeline } from '@kit/timeline';
import { color } from '@kit/palette';

export default defineScene({
    label: 'A CPU reads two numbers from memory, adds them, and writes the result back to memory',
    height: 370,
    beats: [
        { at: 0, text: 'Memory is a long row of numbered boxes. Each box holds one number, and the box\'s own number is its <em>address</em>.' },
        { at: 2.5, text: 'The CPU can\'t do math on memory directly. First it copies the number at address 2 into a small slot of its own.' },
        { at: 5, text: 'Next, it copies the number at address 5 into a second slot.' },
        { at: 7.5, text: 'With both numbers in hand, the CPU does the one thing it\'s good at: arithmetic.' },
        { at: 10, text: 'Finally, it writes the answer to address 6. Whatever that box held before is gone.' },
    ],
    build({ draw }) {
        const tl = timeline();
        const values = [3, 9, 7, 1, 4, 5, 2, 8];
        const memory = new MemoryRow(draw, { x: 136, y: 270, count: 8, values });
        const cellY = memory.centerY() + 6;
        draw.text('memory', 136, 258, { color: color.dim, size: 14 });

        // The CPU
        draw.rect(190, 18, 340, 170, { color: color.value, width: 2 });
        draw.text('CPU', 206, 44, { color: color.value, size: 16 });
        const instruction = draw.text('', 514, 44, { color: color.focus, size: 15, anchor: 'end', italic: true });
        const slotA = [238, 88] as const;
        const slotB = [346, 88] as const;
        const slotSum = [454, 88] as const;
        for (const [x, y] of [slotA, slotB, slotSum]) {
            draw.rect(x - 34, y, 68, 44, { color: color.dim, width: 1.25 });
        }
        draw.text('slot A', slotA[0], 152, { color: color.dim, size: 13, anchor: 'middle' });
        draw.text('slot B', slotB[0], 152, { color: color.dim, size: 13, anchor: 'middle' });
        draw.text('answer', slotSum[0], 152, { color: color.dim, size: 13, anchor: 'middle' });
        const plus = draw.text('+', (slotA[0] + slotB[0]) / 2, 116, { size: 22, anchor: 'middle', color: color.focus });
        const equals = draw.text('=', (slotB[0] + slotSum[0]) / 2, 116, { size: 22, anchor: 'middle', color: color.focus });

        // A highlight box for the memory cell in use
        const makeHighlight = (i: number) => draw.rect(136 + i * 56, 270, 56, 44, { color: color.focus, width: 2.5 });
        const highA = makeHighlight(2);
        const highB = makeHighlight(5);
        const highC = makeHighlight(6);

        // Moving copies of the numbers
        const makeToken = (value: number, colorName: string) => {
            const group = draw.group();
            draw.text(value, 0, 0, { mono: true, size: 18, anchor: 'middle', color: colorName, parent: group.el });
            return group;
        };
        const tokenA = makeToken(7, color.value);
        const tokenB = makeToken(5, color.value);
        const tokenSum = makeToken(12, color.focus);
        const slotText = 116;

        fadeIn(tl, highA, 2.6, 0.3);
        fadeIn(tl, tokenA, 3, 0.2);
        slide(tl, tokenA, [memory.centerX(2), cellY], [slotA[0], slotText], 3, 1);
        fadeOut(tl, highA, 4.3, 0.3);

        fadeIn(tl, highB, 5.1, 0.3);
        fadeIn(tl, tokenB, 5.5, 0.2);
        slide(tl, tokenB, [memory.centerX(5), cellY], [slotB[0], slotText], 5.5, 1);
        fadeOut(tl, highB, 6.8, 0.3);

        fadeIn(tl, plus, 7.6, 0.3);
        fadeIn(tl, equals, 8.1, 0.3);
        fadeIn(tl, tokenSum, 8.5, 0.5);

        fadeIn(tl, highC, 10.1, 0.3);
        const trip = draw.group();
        draw.text(12, 0, 0, { mono: true, size: 18, anchor: 'middle', color: color.focus, parent: trip.el });
        fadeIn(tl, trip, 10.5, 0.15);
        slide(tl, trip, [slotSum[0], slotText], [memory.centerX(6), cellY], 10.5, 1);
        tl.to(memory.values[6].el, { opacity: 0, duration: 0.2 }, 11.3);
        fadeOut(tl, highC, 12, 0.3);
        tl.to({}, { duration: 0.1 }, 12.9);

        // tokenSum sits in its slot from the start of its fade
        tokenSum.move(slotSum[0], slotText);

        return {
            timeline: tl,
            update: ({ t }) => {
                instruction.text(textAt(t, [
                    [2.5, 'read address 2'],
                    [5, 'read address 5'],
                    [7.5, 'add'],
                    [10, 'write address 6'],
                    [12.3, ''],
                ]));
            },
        };
    },
});
