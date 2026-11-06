import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';

const ROWS = 3;
const COLS = 4;
const CELL = 64;
const GX = 410;
const GY = 80;

// Inner loop runs fully for each pass of the outer one
export default defineScene({
    label: 'A grid of 3 rows and 4 columns. A slider steps through the 12 passes of an inner loop nested inside an outer loop, lighting each cell as it is visited and showing the row and col counters',
    height: 330,
    duration: 0,
    params: [{ key: 'step', label: 'pass', min: 1, max: ROWS * COLS, step: 1, value: 1 }],
    build({ draw }) {
        const lines = [
            'for(int row = 0; row < 3; row++) {',
            '    for(int col = 0; col < 4; col++) {',
            '        // visit (row, col)',
            '    }',
            '}',
        ];
        const keepSpaces = (node: { el: SVGElement }) => {
            node.el.setAttribute('xml:space', 'preserve');
            node.el.style.whiteSpace = 'pre';
        };
        lines.forEach((line, i) => keepSpaces(draw.text(line, 24, 90 + i * 26, { mono: true, size: 13 })));
        const band = draw.rect(14, 0, 340, 26, { fill: 'rgba(244, 211, 94, 0.11)' });

        const cells = Array.from({ length: ROWS * COLS }, (_, k) => {
            const r = Math.floor(k / COLS);
            const c = k % COLS;
            const box = draw.rect(GX + c * CELL, GY + r * CELL, CELL, CELL, { color: color.dim, width: 1.25 });
            const label = draw.text(k + 1, GX + c * CELL + CELL / 2, GY + r * CELL + CELL / 2 + 6, { mono: true, size: 15, anchor: 'middle', color: color.faint });
            return { box, label };
        });
        for(let c = 0; c < COLS; c++) {
            draw.text(`col ${c}`, GX + c * CELL + CELL / 2, GY - 12, { size: 12.5, anchor: 'middle', color: color.dim });
        }
        for(let r = 0; r < ROWS; r++) {
            draw.text(`row ${r}`, GX - 10, GY + r * CELL + CELL / 2 + 5, { size: 12.5, anchor: 'end', color: color.dim });
        }

        const counters = draw.text('', 24, 256, { mono: true, size: 16 });
        keepSpaces(counters);
        const runs = draw.text('', 24, 286, { size: 14, color: color.dim });

        return ({ p }) => {
            const step = Math.max(1, Math.min(ROWS * COLS, Math.round(p.step)));
            const row = Math.floor((step - 1) / COLS);
            const col = (step - 1) % COLS;

            cells.forEach(({ box, label }, k) => {
                const now = k === step - 1;
                const done = k < step - 1;
                box.set({ stroke: now ? color.focus : done ? color.value : color.dim, 'stroke-width': now ? 2.5 : 1.25 });
                label.set({ fill: now ? color.focus : done ? color.value : color.faint });
            });

            band.set({ y: 90 + 2 * 26 - 19 });
            counters.text(`row = ${row}   col = ${col}`).set({ fill: color.ink });
            runs.text(step === ROWS * COLS
                ? `That was pass ${step}: ${ROWS} rows x ${COLS} columns.`
                : col === COLS - 1
                    ? 'End of this row. The inner loop is over, and the outer loop moves down one row.'
                    : `Inner loop is on pass ${col + 1} of ${COLS} for this row.`);
        };
    },
});
