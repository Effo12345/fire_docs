import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';
import { headingAverage, naiveAverage } from './lib/frames';

const CX = 240;
const CY = 150;
const R = 110;

const point = (deg: number, radius: number) => {
    const rad = (deg * Math.PI) / 180;

    return [CX + radius * Math.sin(rad), CY - radius * Math.cos(rad)];
};

export default defineScene({
    label: 'A compass dial with two headings and their average. Adding the two numbers and halving can land on the opposite side of the dial, while averaging the short way between them lands between the two hands.',
    duration: 0,
    width: 480,
    height: 400,
    params: [
        { key: 'a', label: 'first heading (degrees)', min: 0, max: 359, step: 1, value: 350, digits: 0 },
        { key: 'b', label: 'second heading (degrees)', min: 0, max: 359, step: 1, value: 10, digits: 0 },
    ],
    build({ draw }) {
        draw.circle(CX, CY, R, { color: color.rule, width: 1.5 });
        for(const [label, deg] of [['0', 0], ['90', 90], ['180', 180], ['270', 270]] as const) {
            const [x, y] = point(deg, R + 22);
            draw.text(label, x, y + 5, { color: color.dim, size: 13, anchor: 'middle' });
        }

        const handA = draw.line(CX, CY, CX, CY, { color: color.value, width: 3 });
        const handB = draw.line(CX, CY, CX, CY, { color: color.value, width: 3 });
        const naive = draw.line(CX, CY, CX, CY, { color: color.error, width: 3, dash: '6 5' });
        const good = draw.line(CX, CY, CX, CY, { color: color.target, width: 4 });
        draw.circle(CX, CY, 4, { fill: color.ink });

        draw.text('blue: the two headings', 40, 300, { size: 14, color: color.value });
        const naiveText = draw.text('', 40, 330, { mono: true, size: 14, color: color.error });
        const goodText = draw.text('', 40, 360, { mono: true, size: 14, color: color.target });

        return ({ p }) => {
            const [ax, ay] = point(p.a, R);
            const [bx, by] = point(p.b, R);
            const n = naiveAverage(p.a, p.b);
            const g = headingAverage(p.a, p.b);
            const [nx, ny] = point(n, R - 18);
            const [gx, gy] = point(g, R - 34);

            handA.to(CX, CY, ax, ay);
            handB.to(CX, CY, bx, by);
            naive.to(CX, CY, nx, ny);
            good.to(CX, CY, gx, gy);

            naiveText.text(`plain average: ${n.toFixed(0)}`);
            goodText.text(`short-way average: ${g.toFixed(0)}`);
        };
    },
});
