import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';
import { inBand, naiveCheck, orCheck } from './lib/hue';

const CX = 100;
const CY = 108;
const R = 62;
const BAND_R = 78;

// 0 at the top, clockwise, like the dial on the inertial sensor page
const point = (deg: number, radius: number) => {
    const rad = (deg * Math.PI) / 180;
    return [CX + radius * Math.sin(rad), CY - radius * Math.cos(rad)];
};

function arc(from: number, to: number, radius: number) {
    const sweep = (((to - from) % 360) + 360) % 360;
    const [x0, y0] = point(from, radius);
    const [x1, y1] = point(from + sweep, radius);

    return `M${x0.toFixed(1)} ${y0.toFixed(1)}A${radius} ${radius} 0 ${sweep > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}

// Number line: 0.7 px per degree, so it stays in view on a narrow screen
const LX = 110;
const K = 0.7;
const rows = { truth: 316, above: 338, below: 360, and: 384, or: 406 };

export default defineScene({
    label: 'A color wheel with a band of hues marked on it and a marker for the hue the sensor reports. Below it, number lines show hue greater than the low end, hue less than the high end, and what the AND check and the OR check accept. When the band crosses 0, the AND check accepts nothing.',
    width: 520,
    height: 440,
    duration: 0,
    params: [
        { key: 'low', label: 'band starts at (degrees)', min: 0, max: 359, step: 1, value: 340, digits: 0 },
        { key: 'high', label: 'band ends at (degrees)', min: 0, max: 359, step: 1, value: 20, digits: 0 },
        { key: 'hue', label: 'hue the sensor reads (degrees)', min: 0, max: 359, step: 1, value: 5, digits: 0 },
    ],
    build({ draw }) {
        // The wheel's colors come from the hue number itself. That is the lesson, so these are the only non-palette colors
        for(let h = 0; h < 360; h += 4) {
            draw.path(arc(h, h + 4.6, R), { color: `hsl(${h + 2}, 100%, 50%)`, width: 12 });
        }
        draw.circle(CX, CY, R + 6.5, { color: color.rule, width: 1 });
        draw.circle(CX, CY, R - 6.5, { color: color.rule, width: 1 });
        for(const [label, deg] of [['0', 0], ['90', 90], ['180', 180], ['270', 270]] as const) {
            const [x, y] = point(deg, BAND_R + 16);
            draw.text(label, x, y + 5, { color: color.dim, size: 13, anchor: 'middle' });
        }

        const bandArc = draw.path('', { color: color.target, width: 5 });
        const hand = draw.line(CX, CY, CX, CY - R, { color: color.focus, width: 3 });
        const swatch = draw.circle(CX, CY, 16, { color: color.ink, width: 1 });

        // Readouts
        const info = draw.text('', 225, 36, { size: 14, color: color.dim });
        const hueText = draw.text('', 225, 62, { mono: true, size: 13, color: color.focus });
        draw.text('naive, with &&', 225, 100, { mono: true, size: 13, color: color.dim });
        const andA = draw.text('', 225, 122, { mono: true, size: 13 });
        const andB = draw.text('', 225, 142, { mono: true, size: 13 });
        const andR = draw.text('', 225, 162, { mono: true, size: 13 });
        draw.text('fixed, with ||', 225, 196, { mono: true, size: 13, color: color.dim });
        const orR = draw.text('', 225, 218, { mono: true, size: 13 });
        const truthText = draw.text('', 20, 262, { size: 14, color: color.target });

        // Number lines
        const ticks = [0, 90, 180, 270, 360];
        for(const t of ticks) {
            draw.line(LX + t * K, 294, LX + t * K, 300, { color: color.faint, width: 1 });
            draw.text(String(t), LX + t * K, 290, { color: color.dim, size: 12, anchor: 'middle' });
        }
        const labels = {
            truth: draw.text('the band', LX - 10, rows.truth + 4, { color: color.target, size: 13, anchor: 'end' }),
            above: draw.text('', LX - 10, rows.above + 4, { mono: true, color: color.value, size: 12, anchor: 'end' }),
            below: draw.text('', LX - 10, rows.below + 4, { mono: true, color: color.value, size: 12, anchor: 'end' }),
            and: draw.text('both (&&)', LX - 10, rows.and + 4, { color: color.dim, size: 13, anchor: 'end' }),
            or: draw.text('either (||)', LX - 10, rows.or + 4, { color: color.dim, size: 13, anchor: 'end' }),
        };
        const bars = {
            truth: draw.path('', { color: color.target, width: 6 }),
            above: draw.path('', { color: color.value, width: 6 }),
            below: draw.path('', { color: color.value, width: 6 }),
            and: draw.path('', { color: color.ink, width: 6 }),
            or: draw.path('', { color: color.ink, width: 6 }),
        };
        const marker = draw.line(0, 300, 0, 416, { color: color.focus, width: 2 });
        const noneText = draw.text('nothing: never both at once', LX + 30, rows.and + 4, { color: color.error, size: 12 });

        // Segments on the line, from a to b degrees (a <= b)
        const seg = (row: number, spans: number[][]) =>
            spans.filter(([a, b]) => b > a).map(([a, b]) => `M${LX + a * K} ${row}L${LX + b * K} ${row}`).join('');

        return ({ p }) => {
            const { low, high, hue } = p;
            const crosses = low > high;

            bandArc.d(arc(low, high, BAND_R));
            const [hx, hy] = point(hue, R);
            hand.to(CX, CY, hx, hy);
            swatch.set({ fill: `hsl(${hue}, 100%, 50%)` });

            info.text(crosses ? 'The band wraps past 0.' : 'The band does not wrap.');
            hueText.text(`hue = ${hue.toFixed(0)}`);

            const a = hue > low;
            const b = hue < high;
            andA.text(`hue > ${low}: ${a}`);
            andB.text(`hue < ${high}: ${b}`);
            andR.text(`&& gives ${naiveCheck(hue, low, high)}`);
            orR.text(`|| gives ${orCheck(hue, low, high)}`);

            const truth = inBand(hue, low, high);
            const goodAnd = naiveCheck(hue, low, high) === truth;
            const goodOr = orCheck(hue, low, high) === truth;
            andR.set({ fill: goodAnd ? color.target : color.error });
            orR.set({ fill: goodOr ? color.target : color.error });
            truthText.text(truth ? 'The hue is inside the band.' : 'The hue is outside the band.');

            labels.above.text(`hue > ${low}`);
            labels.below.text(`hue < ${high}`);

            bars.truth.d(crosses ? seg(rows.truth, [[low, 360], [0, high]]) : seg(rows.truth, [[low, high]]));
            bars.above.d(seg(rows.above, [[low, 360]]));
            bars.below.d(seg(rows.below, [[0, high]]));
            bars.and.d(crosses ? '' : seg(rows.and, [[low, high]]));
            bars.or.d(seg(rows.or, [[0, high], [low, 360]]));
            noneText.opacity(crosses ? 1 : 0);

            marker.to(LX + hue * K, 300, LX + hue * K, 416);
        };
    },
});
