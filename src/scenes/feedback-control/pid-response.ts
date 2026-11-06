import { defineScene } from '@kit/scene';
import { Axes } from '@kit/axes';
import { robot } from '@kit/robot';
import { simulateDrive, type DriveRun } from '@kit/sim/drive';
import { color } from '@kit/palette';

const TARGET = 24;
const DURATION = 4;

export default defineScene({
    label: 'A robot drives toward a target while a graph traces its position over time. Sliders change the PID gains.',
    duration: DURATION,
    height: 390,
    params: [
        { key: 'kP', label: '<em>k</em><sub>P</sub>', min: 0.1, max: 4, step: 0.05, value: 0.6 },
        { key: 'kI', label: '<em>k</em><sub>I</sub>', min: 0, max: 1, step: 0.01, value: 0 },
        { key: 'kD', label: '<em>k</em><sub>D</sub>', min: 0, max: 0.5, step: 0.01, value: 0 },
    ],
    build({ draw }) {
        const fx = (inches: number) => 40 + (inches / 30) * 620;
        const fieldY = 50;

        draw.line(fx(0), fieldY, fx(30), fieldY, { color: color.rule, width: 1 });
        draw.line(fx(TARGET), fieldY - 26, fx(TARGET), fieldY + 26, { color: color.target });
        draw.text('target', fx(TARGET) + 8, fieldY - 14, { color: color.target, size: 14 });
        const bot = robot(draw);
        const errorSpan = draw.span(0, 0, 0, 0, { color: color.error });
        const errorText = draw.text('', 0, fieldY + 52, { color: color.error, size: 14, anchor: 'middle' });

        const axes = new Axes(draw, {
            box: { left: 56, right: 700, top: 124, bottom: 354 },
            x: [0, DURATION],
            y: [0, 36],
            xTicks: [1, 2, 3, 4],
            xUnit: ' s',
            yTicks: [0, 12, 24, 36],
            yLabel: 'position (in)',
        });
        axes.hline(TARGET, { color: color.target, width: 1.5, dash: '5 5' });
        const curve = axes.curve({ color: color.value });
        const gap = draw.line(0, 0, 0, 0, { color: color.error });
        const dot = draw.circle(0, 0, 5, { fill: color.focus });

        let run: DriveRun;
        let key = '';

        return ({ t, p }) => {
            const nextKey = `${p.kP}|${p.kI}|${p.kD}`;
            if(nextKey !== key) {
                key = nextKey;
                run = simulateDrive(TARGET, { kP: p.kP, kI: p.kI, kD: p.kD, iZone: 6 }, DURATION);
            }

            const index = Math.round((t / DURATION) * (run.position.length - 1));
            const x = run.position[index];
            curve.d(axes.trace(run.position, DURATION, index + 1));
            dot.set({ cx: axes.sx(t), cy: axes.sy(x) });
            gap.to(axes.sx(t), axes.sy(x), axes.sx(t), axes.sy(TARGET));

            bot.move(fx(x) - 19, fieldY);
            errorSpan.to(fx(x), fieldY + 34, fx(TARGET), fieldY + 34);
            errorText.at((fx(x) + fx(TARGET)) / 2, fieldY + 52).text(`error = ${(TARGET - x).toFixed(1)} in`);
        };
    },
});
