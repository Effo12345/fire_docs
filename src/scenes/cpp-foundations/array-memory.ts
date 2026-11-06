import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';

const BASE = 100;
const SIZE = 4;
const LEFT = 60;
const CELL = 100;
const TOP = 112;

// Slots for index -1 through 4. Only the first three belong to speeds.
const SLOTS = [
    { name: '', value: '?' },
    { name: 'speeds[0]', value: '50' },
    { name: 'speeds[1]', value: '80' },
    { name: 'speeds[2]', value: '100' },
    { name: 'total', value: '230' },
    { name: '', value: '?' },
];

export default defineScene({
    label: 'Six int-sized boxes in a row, with addresses 96 to 116. The first three belong to the array speeds. A slider picks an index, and the address of that element is worked out as 100 plus 4 times the index. Indexes 3 and 4 and minus 1 land outside the array.',
    height: 310,
    duration: 0,
    params: [{ key: 'index', label: 'index', min: -1, max: 4, step: 1, value: 0 }],
    build({ draw }) {
        const cellX = (slot: number) => LEFT + slot * CELL;

        const boxes = SLOTS.map((slot, i) => {
            const box = draw.rect(cellX(i), TOP, CELL, 50, { color: color.dim, width: 1.25 });
            draw.text(slot.name, cellX(i) + CELL / 2, TOP - 12, { mono: true, size: 12.5, anchor: 'middle', color: i >= 1 && i <= 3 ? color.value : color.dim });
            draw.text(slot.value, cellX(i) + CELL / 2, TOP + 31, { mono: true, size: 16, anchor: 'middle', color: i >= 1 && i <= 3 ? color.ink : color.faint });
            draw.text(BASE + (i - 1) * SIZE, cellX(i) + 4, TOP + 68, { mono: true, size: 11, color: color.faint });
            return box;
        });

        draw.span(cellX(1) + 2, TOP - 40, cellX(4) - 2, TOP - 40, { color: color.value, width: 1.5, tick: 5 });
        draw.text('speeds, 12 bytes', cellX(2) + CELL / 2, TOP - 54, { size: 13, anchor: 'middle', color: color.value });

        const formula = draw.text('', LEFT, 236, { mono: true, size: 16 });
        const result = draw.text('', LEFT, 266, { mono: true, size: 16 });
        const note = draw.text('', LEFT, 296, { size: 14, color: color.dim });

        return ({ p }) => {
            const index = Math.max(-1, Math.min(4, Math.round(p.index)));
            const inside = index >= 0 && index <= 2;
            const slot = SLOTS[index + 1];
            const address = BASE + index * SIZE;
            const mark = inside ? color.focus : color.error;

            boxes.forEach((box, i) => {
                const on = i === index + 1;
                box.set({ stroke: on ? mark : color.dim, 'stroke-width': on ? 2.5 : 1.25 });
            });

            formula.text(`address = ${BASE} + ${SIZE} x ${index} = ${address}`).set({ fill: color.ink });
            result.text(`speeds[${index}] reads ${slot.value}`).set({ fill: mark });
            note.text(inside
                ? 'Inside the array. The address is the start of the array plus whole elements.'
                : index === 3
                    ? 'One past the end. The formula still works, and lands on total. Writing here would overwrite it.'
                    : 'Outside the array. The formula still works, and lands on something that is not ours.');
        };
    },
});
