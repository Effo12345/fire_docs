import { defineScene } from '@kit/scene';
import { Axes } from '@kit/axes';
import { robot } from '@kit/robot';
import { simulateDrive, type DriveRun } from '@kit/sim/drive';
import { color } from '@kit/palette';

const TARGET = 24;
const DURATION = 3;

export default defineScene({
    label: 'A simulated robot drives toward a 24 inch target while a graph traces its position over time. One slider sets the gain. A low gain stops short, a middle gain lands on the target, and a high gain overshoots and rattles around it.',
    duration: DURATION,
    height: 410,
    params: [{ key: 'gain', label: 'gain', min: 0.1, max: 10, step: 0.05, value: 0.3 }],
    beats: [
        { at: 0, text: 'The same drive code runs every time. The only thing that changes is <em>gain</em>, the number a template asks you to pick: volts of push for each inch still to go. Start low, then raise it.' },
    ],
    build({ draw }) {
        const fx = (inches: number) => 40 + (inches / 30) * 560;
        const fieldY = 56;

        draw.line(fx(0), fieldY, fx(30), fieldY, { color: color.rule, width: 1 });
        draw.line(fx(TARGET), fieldY - 26, fx(TARGET), fieldY + 26, { color: color.target });
        draw.text('target', fx(TARGET) + 8, fieldY - 14, { color: color.target, size: 14 });
        const bot = robot(draw);
        const errorSpan = draw.span(0, 0, 0, 0, { color: color.error });
        const errorText = draw.text('', 0, fieldY + 52, { color: color.error, size: 14, anchor: 'middle' });

        const axes = new Axes(draw, {
            box: { left: 56, right: 600, top: 130, bottom: 336 },
            x: [0, DURATION],
            y: [0, 36],
            xTicks: [1, 2, 3],
            xUnit: ' s',
            yTicks: [0, 12, 24, 36],
            yLabel: 'position (in)',
        });
        axes.hline(TARGET, { color: color.target, width: 1.5, dash: '5 5' });
        const curve = axes.curve({ color: color.value });
        const gap = draw.line(0, 0, 0, 0, { color: color.error });
        const dot = draw.circle(0, 0, 5, { fill: color.focus });
        const verdict = draw.text('', 56, 386, { size: 15 });

        let run: DriveRun;
        let key = '';

        return ({ t, p }) => {
            const nextKey = `${p.gain}`;
            if(nextKey !== key) {
                key = nextKey;
                run = simulateDrive(TARGET, { kP: p.gain, kI: 0, kD: 0 }, DURATION);
            }

            const last = run.position.length - 1;
            const index = Math.round((t / DURATION) * last);
            const x = run.position[index];
            curve.d(axes.trace(run.position, DURATION, index + 1));
            dot.set({ cx: axes.sx(t), cy: axes.sy(x) });
            gap.to(axes.sx(t), axes.sy(x), axes.sx(t), axes.sy(TARGET));

            bot.move(fx(x) - 19, fieldY);
            errorSpan.to(fx(x), fieldY + 34, fx(TARGET), fieldY + 34);
            errorText.at((fx(x) + fx(TARGET)) / 2, fieldY + 52).text(`error = ${(TARGET - x).toFixed(1)} in`);

            // Summary of the whole run, so the reader reads results while dragging
            const peak = Math.max(...run.position);
            const end = run.position[last];
            const over = peak - TARGET;
            const short = TARGET - end;
            const parts: string[] = [];
            parts.push(over > 0.3 ? `passes the target by ${over.toFixed(1)} in` : 'never passes the target');
            parts.push(Math.abs(short) < 0.5 ? 'ends on it' : short > 0 ? `ends ${short.toFixed(1)} in short` : `ends ${(-short).toFixed(1)} in past`);
            verdict.text(`gain ${p.gain.toFixed(2)}: ${parts.join(', ')}`);
        };
    },
});
