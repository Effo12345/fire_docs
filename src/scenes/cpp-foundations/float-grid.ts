import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';

// Doubles near 0.3 are spaced 2^-54 apart. The double nearest 0.3 is M * 2^-54,
// and 0.1 + 0.2 lands exactly one step above it.
const M = 5404319552844595n;
const ULP = 2 ** -54;
const HALF_RANGE = 35;

const exact = (k: number) => {
    const digits = ((M + BigInt(k)) * 5n ** 54n).toString().padStart(54, '0');
    return `0.${digits.slice(0, 20)}`;
};

const LEFT = 60;
const RIGHT = 660;
const AXIS_Y = 150;

export default defineScene({
    label: 'A number line zoomed in around 0.3. Doubles are separate dots with gaps between them. The double for 0.3 and the double that 0.1 + 0.2 produces are neighbors, one dot apart',
    height: 330,
    duration: 0,
    params: [{ key: 'zoom', label: 'zoom', min: 0, max: 1, step: 0.005, value: 0, digits: 2 }],
    build({ draw }) {
        draw.line(LEFT, AXIS_Y, RIGHT, AXIS_Y, { color: color.rule, width: 1 });
        const dots = Array.from({ length: HALF_RANGE * 2 + 1 }, () => draw.circle(0, AXIS_Y, 3.5, { fill: color.dim }));

        const tickA = draw.line(0, 0, 0, 0, { color: color.target, width: 2 });
        const tickB = draw.line(0, 0, 0, 0, { color: color.error, width: 2 });
        const nameA = draw.text('0.3', 0, 0, { color: color.target, size: 15, anchor: 'middle' });
        const nameB = draw.text('0.1 + 0.2', 0, 0, { color: color.error, size: 15, anchor: 'middle' });

        const width = draw.text('', 60, 36, { color: color.dim, size: 14 });
        const hint = draw.text('', 60, 62, { color: color.dim, size: 14 });
        draw.text(`0.3 is stored as      ${exact(0)}`, 60, 250, { mono: true, size: 13, color: color.target });
        draw.text(`0.1 + 0.2 comes out   ${exact(1)}`, 60, 276, { mono: true, size: 13, color: color.error });
        draw.text('0.1 + 0.2 == 0.3  is  false', 60, 308, { mono: true, size: 14, color: color.focus });

        return ({ p }) => {
            // Window width in steps, from the whole 0.2 down to 8 steps
            const widest = 0.2 / ULP;
            const steps = Math.exp(Math.log(widest) + (Math.log(8) - Math.log(widest)) * p.zoom);
            const px = (RIGHT - LEFT) / steps;
            const mid = (LEFT + RIGHT) / 2;
            const xOf = (k: number) => mid + (k - 0.5) * px;

            const separate = px >= 10;
            dots.forEach((dot, i) => {
                const k = i - HALF_RANGE;
                dot.show(separate && Math.abs(xOf(k) - mid) < 330);
                dot.set({ cx: xOf(k), fill: k === 0 ? color.target : k === 1 ? color.error : color.dim });
            });

            const xa = xOf(0);
            const xb = xOf(1);
            tickA.to(xa, AXIS_Y - 22, xa, AXIS_Y);
            tickB.to(xb, AXIS_Y + 22, xb, AXIS_Y);
            nameA.at(xa, AXIS_Y - 30);
            nameB.at(xb, AXIS_Y + 44);

            width.text(`window: ${(steps * ULP).toExponential(1).replace('e-', ' x 10^-')} wide`);
            hint.text(separate ? 'Each dot is one double. Nothing between the dots can be stored.' : 'Zoom in. The doubles are too close to tell apart at this scale.');
        };
    },
});
