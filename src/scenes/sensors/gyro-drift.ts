import { defineScene } from '@kit/scene';
import { Axes } from '@kit/axes';
import { robot } from '@kit/robot';
import { color } from '@kit/palette';
import { DRIFT_SECONDS, DRIFT_STEP, driftRun } from './lib/inertial';

const CX = 110;
const CY = 140;

export default defineScene({
    label: 'A robot sits perfectly still for 60 seconds, sped up. The gyroscope adds up its turn rate in slices, and a small rate error plus noise makes the added-up heading wander away from the true heading of zero. Sliders set the rate error and the noise.',
    duration: 10,
    height: 380,
    params: [
        { key: 'bias', label: 'rate error (degrees per second, made up)', min: -0.4, max: 0.4, step: 0.02, value: 0.1, digits: 2 },
        { key: 'noise', label: 'noise in each slice (degrees per second, made up)', min: 0, max: 4, step: 0.1, value: 1, digits: 1 },
    ],
    build({ draw }) {
        // Top-down robot, outline of where it really is plus the one that follows the sum
        const ghost = robot(draw, { size: 56, color: color.dim });
        ghost.move(CX, CY, -90);
        const bot = robot(draw, { size: 56 });
        draw.text('real heading: 0', CX, CY + 66, { color: color.dim, size: 13, anchor: 'middle' });
        const claim = draw.text('', CX, CY + 88, { color: color.value, size: 13, anchor: 'middle' });

        const axes = new Axes(draw, {
            box: { left: 300, right: 700, top: 40, bottom: 270 },
            x: [0, DRIFT_SECONDS],
            y: [-60, 60],
            xTicks: [15, 30, 45, 60],
            xUnit: ' s',
            yTicks: [-60, -30, 0, 30, 60],
            yLabel: 'degrees',
        });
        axes.hline(0, { color: color.dim, width: 1.5 });

        const line = draw.path('', { color: color.value, width: 2.5 });
        const now = draw.line(0, 40, 0, 270, { color: color.faint, width: 1, dash: '3 4' });
        draw.text('what the robot really did: nothing', 300, 318, { color: color.dim, size: 13 });
        draw.text('the added-up heading', 300, 340, { color: color.value, size: 13 });
        const read = draw.text('', 56, 368, { mono: true, size: 14, color: color.value });

        let key = '';
        let values = driftRun(0.1, 1);

        return ({ t, p }) => {
            const nextKey = `${p.bias}|${p.noise}`;
            if(nextKey !== key) {
                key = nextKey;
                values = driftRun(p.bias, p.noise);
            }

            // The run is sped up: scene seconds are 6 times real seconds
            const real = (t / 10) * DRIFT_SECONDS;
            const last = Math.min(values.length - 1, Math.floor(real / DRIFT_STEP));
            const clamp = (v: number) => Math.max(-60, Math.min(60, v));

            let d = '';
            for(let i = 0; i <= last; i++) {
                d += `${i ? 'L' : 'M'}${axes.sx(i * DRIFT_STEP).toFixed(1)} ${axes.sy(clamp(values[i])).toFixed(1)}`;
            }
            line.d(d);
            now.to(axes.sx(real), 40, axes.sx(real), 270);

            bot.move(CX, CY, values[last] - 90);
            claim.text(`reads ${values[last].toFixed(1)}`);
            read.text(`after ${Math.round(real)} s still: heading reads ${values[last].toFixed(1)} degrees`);
        };
    },
});
