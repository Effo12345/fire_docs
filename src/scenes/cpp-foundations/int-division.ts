import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';

const MAX = 20;
const STEP = 24;
const GAP = 8;
const LEFT = 52;

export default defineScene({
    label: 'A row of a dots is split into groups of b. The number of full groups is a divided by b, the dots left over are a modulo b, and the true decimal answer is shown for comparison',
    height: 300,
    duration: 0,
    params: [
        { key: 'a', label: '<em>a</em>', min: 0, max: MAX, step: 1, value: 7 },
        { key: 'b', label: '<em>b</em>', min: 1, max: 6, step: 1, value: 2 },
    ],
    build({ draw }) {
        const dots = Array.from({ length: MAX }, () => draw.circle(0, 0, 8, { fill: color.value }));
        const braces = Array.from({ length: MAX }, () => draw.path('', { color: color.dim, width: 1.5 }));
        const counts = Array.from({ length: MAX }, () => draw.text('', 0, 0, { color: color.dim, size: 13, anchor: 'middle' }));

        const rowY = 70;
        const q = draw.text('', 52, 186, { mono: true, size: 17 });
        const r = draw.text('', 52, 216, { mono: true, size: 17 });
        const real = draw.text('', 52, 246, { mono: true, size: 17 });
        const note = draw.text('', 52, 280, { color: color.dim, size: 14 });

        return ({ p }) => {
            const a = Math.round(p.a);
            const b = Math.round(p.b);
            const groups = Math.floor(a / b);
            const left = a % b;

            const xOf = (i: number) => LEFT + i * STEP + Math.floor(i / b) * GAP;
            dots.forEach((dot, i) => {
                dot.show(i < a);
                const full = i < groups * b;
                dot.set({ cx: xOf(i), cy: rowY, fill: full ? color.value : color.error });
            });

            braces.forEach((brace, g) => {
                const visible = g < groups;
                brace.show(visible);
                counts[g].show(visible);
                if(visible) {
                    const x1 = xOf(g * b) - 11;
                    const x2 = xOf(g * b + b - 1) + 11;
                    brace.d(`M${x1} ${rowY + 20} v6 h${x2 - x1} v-6`);
                    counts[g].at((x1 + x2) / 2, rowY + 44).text(g + 1);
                }
            });

            q.text(`${a} / ${b} = ${groups}`).set({ fill: color.value });
            r.text(`${a} % ${b} = ${left}`).set({ fill: left ? color.error : color.dim });
            real.text(`static_cast<double>(${a}) / ${b} = ${(a / b).toFixed(2)}`).set({ fill: color.focus });
            note.text(left ? `The ${left} left over can't fill another group of ${b}, so ${a} / ${b} drops ${left === 1 ? 'it' : 'them'}.` : `Nothing is left over, so the division is exact.`);
        };
    },
});
