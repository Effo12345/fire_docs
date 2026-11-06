import { defineScene } from '@kit/scene';
import { Axes } from '@kit/axes';
import { color } from '@kit/palette';
import { SLICE_SPAN, turnRate, sliceSum, exactAngle } from './lib/inertial';

export default defineScene({
    label: 'A gyroscope reports how fast the robot is turning. The scene cuts that turn rate into slices of time, multiplies each rate by its slice width, and adds the results up to get the angle turned. A slider changes the slice width.',
    duration: SLICE_SPAN,
    height: 380,
    params: [{ key: 'width', label: 'slice width (s)', min: 0.05, max: 1.5, step: 0.05, value: 1, digits: 2 }],
    build({ draw }) {
        const axes = new Axes(draw, {
            box: { left: 56, right: 700, top: 40, bottom: 250 },
            x: [0, SLICE_SPAN],
            y: [0, 100],
            xTicks: [1, 2, 3, 4, 5, 6],
            xUnit: ' s',
            yTicks: [0, 50, 100],
            yLabel: 'turn rate (degrees per second)',
        });

        const truth = axes.curve({ color: color.dim, width: 1.5 });
        const bars = draw.path('', { color: color.value, width: 1.5 });
        const now = draw.line(0, 40, 0, 250, { color: color.faint, width: 1, dash: '3 4' });

        const sumText = draw.text('', 56, 300, { mono: true, size: 14, color: color.value });
        const trueText = draw.text('', 56, 324, { mono: true, size: 14, color: color.dim });
        const gapText = draw.text('', 56, 348, { mono: true, size: 14, color: color.error });

        return ({ t, p }) => {
            let curve = '';
            for(let i = 0; i <= 200; i++) {
                const x = (i / 200) * SLICE_SPAN;
                curve += `${i ? 'L' : 'M'}${axes.sx(x).toFixed(1)} ${axes.sy(turnRate(x)).toFixed(1)}`;
            }
            truth.d(curve);

            // One rectangle per slice that has started, as tall as the rate at its start
            let d = '';
            for(let k = 0; k * p.width <= t + 1e-9 && k * p.width < SLICE_SPAN; k++) {
                const x0 = k * p.width;
                const x1 = Math.min(x0 + p.width, SLICE_SPAN);
                const y = axes.sy(turnRate(x0));
                d += `M${axes.sx(x0).toFixed(1)} ${axes.sy(0).toFixed(1)}L${axes.sx(x0).toFixed(1)} ${y.toFixed(1)}L${axes.sx(x1).toFixed(1)} ${y.toFixed(1)}L${axes.sx(x1).toFixed(1)} ${axes.sy(0).toFixed(1)}`;
            }
            bars.d(d);
            now.to(axes.sx(t), 40, axes.sx(t), 250);

            const sum = sliceSum(p.width, t);
            const exact = exactAngle(t);
            sumText.text(`slices added up so far: ${sum.toFixed(1)} degrees`);
            trueText.text(`thin-slice answer:       ${exact.toFixed(1)} degrees`);
            gapText.text(`off by:                  ${Math.abs(sum - exact).toFixed(1)} degrees`);
        };
    },
});
