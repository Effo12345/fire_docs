import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';

const LIMIT = 32768;
const X = 40;
const W = 640;
const TOP = 80;
const BAR = 54;
const SCALE = W / LIMIT;
const POOL = 150;

export default defineScene({
    label: 'A bar stands for the 32 kilobyte stack of a PROS task. Sliders set how many bytes each call uses and how deep the calls nest. The bar fills with one frame per call, and turns red when the frames no longer fit.',
    duration: 0,
    height: 270,
    params: [
        { key: 'size', label: 'bytes per frame', min: 16, max: 512, step: 16, value: 64 },
        { key: 'depth', label: 'nested calls', min: 1, max: 2200, step: 1, value: 300 },
    ],
    build({ draw }) {
        draw.text('the stack of one PROS task: 32 KB, filled one frame per call', X, TOP - 18, { size: 13, color: color.dim });
        const fill = draw.rect(X, TOP, 1, BAR, { fill: color.value });
        const dividers = Array.from({ length: POOL }, () => draw.line(X, TOP, X, TOP + BAR, { color: color.bg, width: 1 }));
        draw.rect(X, TOP, W, BAR, { color: color.dim, width: 1.5 });
        draw.text('0', X, TOP + BAR + 18, { size: 12, color: color.faint, anchor: 'start' });
        draw.text('32768 bytes', X + W, TOP + BAR + 18, { size: 12, color: color.faint, anchor: 'end' });

        const used = draw.text('', X, 188, { mono: true, size: 15 });
        const room = draw.text('', X, 218, { mono: true, size: 14, color: color.dim });
        const verdict = draw.text('', X, 248, { size: 15 });

        return ({ p }) => {
            const size = p.size;
            const depth = Math.round(p.depth);
            const total = size * depth;
            const fits = total <= LIMIT;
            const maxCalls = Math.floor(LIMIT / size);

            fill.set({ width: Math.min(total, LIMIT) * SCALE, fill: fits ? color.value : color.error });

            // Frame boundaries only when they're wide enough to see
            const gap = size * SCALE;
            dividers.forEach((line, i) => {
                const show = gap >= 4.5 && i + 1 < depth && (i + 1) * size < LIMIT;
                const x = X + (i + 1) * gap;
                line.set({ x1: x, x2: x }).opacity(show ? 1 : 0);
            });

            used.text(`${depth} calls x ${size} bytes = ${total} bytes`).set({ fill: fits ? color.ink : color.error });
            room.text(`at ${size} bytes a frame, ${maxCalls} calls fit`);
            verdict.text(fits ? 'It fits.' : `Call ${maxCalls + 1} has no room: stack overflow.`).set({ fill: fits ? color.target : color.error });
        };
    },
});
