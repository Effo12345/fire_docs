import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';
import { shortestTurn } from './lib/inertial';

const CX = 160;
const CY = 180;
const R = 100;

const point = (deg: number, radius: number) => {
    const rad = (deg * Math.PI) / 180;
    return [CX + radius * Math.sin(rad), CY - radius * Math.cos(rad)];
};

// An arc along the dial from one heading, `sweep` degrees clockwise (negative is counterclockwise)
function arc(from: number, sweep: number, radius: number) {
    const [x0, y0] = point(from, radius);
    const [x1, y1] = point(from + sweep, radius);
    const large = Math.abs(sweep) > 180 ? 1 : 0;
    const dir = sweep >= 0 ? 1 : 0;

    return `M${x0.toFixed(1)} ${y0.toFixed(1)}A${radius} ${radius} 0 ${large} ${dir} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}

export default defineScene({
    label: 'A compass dial with the robot heading and a target heading. The scene shows the naive error, target minus heading, which can ask for a nearly full turn the long way, and the wrapped error, which always takes the shorter way and stays between minus 180 and 180.',
    duration: 0,
    height: 380,
    params: [
        { key: 'heading', label: 'robot heading (degrees)', min: 0, max: 359, step: 1, value: 350, digits: 0 },
        { key: 'target', label: 'target heading (degrees)', min: 0, max: 359, step: 1, value: 10, digits: 0 },
    ],
    build({ draw }) {
        draw.circle(CX, CY, R, { color: color.rule, width: 1.5 });
        for(const [label, deg] of [['0', 0], ['90', 90], ['180', 180], ['270', 270]] as const) {
            const [x, y] = point(deg, R + 20);
            draw.text(label, x, y + 5, { color: color.dim, size: 13, anchor: 'middle' });
        }

        const naiveArc = draw.path('', { color: color.error, width: 2, dash: '5 5' });
        const wrappedArc = draw.path('', { color: color.target, width: 4 });
        const headingHand = draw.line(CX, CY, CX, CY - R, { color: color.value, width: 3 });
        const targetHand = draw.line(CX, CY, CX, CY - R, { color: color.target, width: 3 });
        draw.circle(CX, CY, 4, { fill: color.ink });

        const naiveText = draw.text('', 340, 120, { mono: true, size: 14, color: color.error });
        const naiveNote = draw.text('', 340, 144, { size: 14, color: color.dim });
        const wrappedText = draw.text('', 340, 210, { mono: true, size: 14, color: color.target });
        const wrappedNote = draw.text('', 340, 234, { size: 14, color: color.dim });
        draw.text('robot heading', 340, 300, { size: 14, color: color.value });
        draw.text('target heading', 340, 324, { size: 14, color: color.target });

        return ({ p }) => {
            const heading = p.heading;
            const target = p.target;
            const naive = target - heading;
            const wrapped = shortestTurn(target, heading);

            const [hx, hy] = point(heading, R);
            const [tx, ty] = point(target, R);
            headingHand.to(CX, CY, hx, hy);
            targetHand.to(CX, CY, tx, ty);

            naiveArc.d(Math.abs(naive) < 0.5 ? '' : arc(heading, naive, R - 14));
            wrappedArc.d(Math.abs(wrapped) < 0.5 ? '' : arc(heading, wrapped, R - 28));

            const way = (v: number) => {
                const n = Math.abs(v);
                const degrees = `${n.toFixed(0)} degree${n === 1 ? '' : 's'}`;

                return v > 0 ? `turn clockwise, ${degrees}` : v < 0 ? `turn counterclockwise, ${degrees}` : 'already there';
            };
            naiveText.text(`target - heading = ${naive.toFixed(0)}`);
            naiveNote.text(way(naive));
            wrappedText.text(`wrapped error      = ${wrapped.toFixed(0)}`);
            wrappedNote.text(way(wrapped));
        };
    },
});
