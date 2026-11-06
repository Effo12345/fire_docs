import { defineScene } from '@kit/scene';
import { Axes } from '@kit/axes';
import { simulateDrive } from '@kit/sim/drive';
import { color } from '@kit/palette';

const TARGET = 24;
const DURATION = 5;
const GAINS = { kP: 0.4, kI: 0.05, kD: 0.1 };
const run = simulateDrive(TARGET, GAINS, DURATION);

export default defineScene({
    label: 'The error over time, with the height, the slope, and the area under the curve feeding the three PID terms',
    duration: DURATION,
    height: 410,
    beats: [
        { at: 0, text: '<strong>P</strong> looks at the present: the <em>height</em> of the error curve right now.' },
        { at: 0.5, text: '<strong>D</strong> looks at the future: the <em>slope</em> of the curve. A steep drop means the error is about to vanish, so D pushes back.' },
        { at: 2, text: '<strong>I</strong> looks at the past: the <em>area</em> under the curve. As the robot crawls to a stop just short of the target, the leftover error keeps adding up, and I supplies the last push.' },
    ],
    build({ draw }) {
        const axes = new Axes(draw, {
            box: { left: 56, right: 700, top: 34, bottom: 230 },
            x: [0, DURATION],
            y: [0, 24],
            xTicks: [1, 2, 3, 4, 5],
            xUnit: ' s',
            yTicks: [0, 12, 24],
            yLabel: 'error (in)',
        });
        const area = draw.path('', { color: 'none', fill: 'rgba(244, 211, 94, 0.22)' });
        const curve = axes.curve({ color: color.error });
        const slope = draw.line(0, 0, 0, 0, { color: color.ink, width: 2 });
        const height = draw.line(0, 0, 0, 0, { color: color.value, width: 2.5 });
        const dot = draw.circle(0, 0, 5, { fill: color.ink });

        // One bar per term, showing how many volts it asks for
        const zeroX = 330;
        const voltScale = 26;
        const rows = [
            { name: 'P', y: 276, tone: color.value },
            { name: 'I', y: 310, tone: color.focus },
            { name: 'D', y: 344, tone: color.ink },
        ].map(({ name, y, tone }) => {
            draw.text(name, 56, y + 5, { color: tone, size: 16, weight: 600 });
            const bar = draw.rect(zeroX, y - 8, 0, 16, { fill: tone });
            const label = draw.text('', 700, y + 5, { color: tone, mono: true, size: 13, anchor: 'end' });
            return { bar, label };
        });
        draw.line(zeroX, 262, zeroX, 388, { color: color.rule, width: 1 });
        draw.text('total', 56, 383, { size: 16, weight: 600 });
        const totalBar = draw.rect(zeroX, 370, 0, 16, { color: color.focus, width: 0, fill: 'rgba(230, 228, 221, 0.32)' });
        const totalLabel = draw.text('', 700, 383, { mono: true, size: 13, anchor: 'end' });

        const placeBar = (bar: typeof totalBar, volts: number) => {
            const width = Math.min(340, Math.abs(volts) * voltScale);
            bar.set({ x: volts >= 0 ? zeroX : zeroX - width, width });
        };

        return ({ t }) => {
            const n = run.error.length - 1;
            const i = Math.round((t / DURATION) * n);
            const error = run.error[i];
            const rate = run.errorRate[i];

            curve.d(axes.trace(run.error, DURATION, i + 1));
            area.d(`${axes.trace(run.error, DURATION, i + 1)}L${axes.sx(t)} ${axes.sy(0)}L${axes.sx(0)} ${axes.sy(0)}Z`);
            dot.set({ cx: axes.sx(t), cy: axes.sy(error) });
            height.to(axes.sx(t), axes.sy(0), axes.sx(t), axes.sy(error));

            const span = 0.35;
            slope.to(axes.sx(t - span), axes.sy(error - rate * span), axes.sx(t + span), axes.sy(error + rate * span));

            const terms = [GAINS.kP * error, GAINS.kI * run.errorSum[i], GAINS.kD * rate];
            rows.forEach(({ bar, label }, row) => {
                placeBar(bar, terms[row]);
                label.text(`${terms[row].toFixed(1)} V`);
            });
            const total = terms[0] + terms[1] + terms[2];
            placeBar(totalBar, total);
            totalLabel.text(`${total.toFixed(1)} V`);
        };
    },
});
