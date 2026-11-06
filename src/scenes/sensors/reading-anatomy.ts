import { defineScene } from '@kit/scene';
import { Axes } from '@kit/axes';
import { color } from '@kit/palette';
import { SPAN, world, sampleWorld, latestIndex } from './lib/reading';

const CURVE_POINTS = 400;

export default defineScene({
    label: 'A true signal over four seconds with a slow rise and one short spike, and the stepped, noisy samples a program would read from it. Sliders change the sample interval, resolution step and noise.',
    duration: SPAN,
    height: 380,
    params: [
        { key: 'interval', label: 'time between samples (s)', min: 0.02, max: 0.8, step: 0.02, value: 0.1, digits: 2 },
        { key: 'step', label: 'resolution step', min: 0.05, max: 2, step: 0.05, value: 0.25, digits: 2 },
        { key: 'noise', label: 'noise', min: 0, max: 1, step: 0.05, value: 0.1, digits: 2 },
    ],
    build({ draw }) {
        const axes = new Axes(draw, {
            box: { left: 56, right: 700, top: 40, bottom: 300 },
            x: [0, SPAN],
            y: [0, 9],
            xTicks: [1, 2, 3, 4],
            xUnit: ' s',
            yTicks: [0, 3, 6, 9],
            yLabel: 'value (made-up units)',
        });

        const truth = axes.curve({ color: color.dim, width: 1.5 });
        const held = axes.curve({ color: color.value, width: 2 });
        const dots = draw.path('', { color: color.value, width: 6 });
        const now = draw.line(0, 0, 0, 0, { color: color.faint, width: 1, dash: '3 4' });
        const gap = draw.line(0, 0, 0, 0, { color: color.error, width: 2.5 });
        const worldDot = draw.circle(0, 0, 5, { fill: color.focus });

        draw.line(66, 336, 90, 336, { color: color.dim, width: 1.5 });
        draw.text('what is really happening', 98, 341, { color: color.dim, size: 13 });
        draw.line(300, 336, 324, 336, { color: color.value, width: 2 });
        draw.text('what your program holds', 332, 341, { color: color.value, size: 13 });
        draw.line(510, 336, 534, 336, { color: color.error, width: 2.5 });
        draw.text('out of date by', 542, 341, { color: color.error, size: 13 });

        const readout = draw.text('', 700, 28, { size: 14, anchor: 'end' });

        let key = '';
        let samples = sampleWorld(0.1, 0.25, 0);

        return ({ t, p }) => {
            const nextKey = `${p.interval}|${p.step}|${p.noise}`;
            if(nextKey !== key) {
                key = nextKey;
                samples = sampleWorld(p.interval, p.step, p.noise);
            }

            const last = latestIndex(samples, t);

            let curve = '';
            for(let i = 0; i <= CURVE_POINTS; i++) {
                const time = (i / CURVE_POINTS) * t;
                curve += `${i ? 'L' : 'M'}${axes.sx(time).toFixed(1)} ${axes.sy(world(time)).toFixed(1)}`;
            }
            truth.d(curve);

            // Each reading holds until the next sample replaces it
            let steps = '';
            let points = '';
            for(let i = 0; i <= last; i++) {
                const x = axes.sx(samples.times[i]);
                const y = axes.sy(samples.values[i]);
                steps += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
                points += `M${x.toFixed(1)} ${y.toFixed(1)}l0 0`;
                if(i < last) {
                    steps += `L${axes.sx(samples.times[i + 1]).toFixed(1)} ${y.toFixed(1)}`;
                }
            }
            steps += `L${axes.sx(t).toFixed(1)} ${axes.sy(samples.values[last]).toFixed(1)}`;
            held.d(steps);
            dots.d(points);

            const real = world(t);
            const read = samples.values[last];
            now.to(axes.sx(t), 40, axes.sx(t), 300);
            gap.to(axes.sx(t), axes.sy(real), axes.sx(t), axes.sy(read));
            worldDot.set({ cx: axes.sx(t), cy: axes.sy(real) });
            readout.text(`world ${real.toFixed(2)}   program ${read.toFixed(2)}`);
        };
    },
});
