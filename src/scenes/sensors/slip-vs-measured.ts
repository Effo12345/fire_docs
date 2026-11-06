import { defineScene } from '@kit/scene';
import { robot } from '@kit/robot';
import { Axes } from '@kit/axes';
import { color } from '@kit/palette';
import { simulate, DURATION, WALL, CUT_TIME, type Run } from './lib/slip';

const LEFT = 50;
const RIGHT = 680;
const FIELD_INCHES = 72;
const STRIP_Y = 100;
const sx = (inches: number) => LEFT + (inches / FIELD_INCHES) * (RIGHT - LEFT);

export default defineScene({
    label: 'A robot drives forward with its wheels spinning at a set speed. The encoder counts every wheel turn, so its distance keeps growing, but a slider for grip and a wall switch show the real position falling behind it.',
    height: 390,
    duration: DURATION,
    params: [
        { key: 'grip', label: 'grip (illustrative)', min: 0.15, max: 1, step: 0.05, value: 0.4, digits: 2 },
        { key: 'wall', label: 'wall in the way (0 = no, 1 = yes)', min: 0, max: 1, step: 1, value: 1, digits: 0 },
    ],
    build({ draw }) {
        draw.line(sx(0), STRIP_Y + 28, sx(FIELD_INCHES), STRIP_Y + 28, { color: color.rule, width: 1 });
        for(let inches = 0; inches <= FIELD_INCHES; inches += 12) {
            draw.line(sx(inches), STRIP_Y + 28, sx(inches), STRIP_Y + 34, { color: color.rule, width: 1 });
            draw.text(inches, sx(inches), STRIP_Y + 50, { color: color.dim, size: 13, anchor: 'middle' });
        }

        const wallLine = draw.line(sx(WALL) + 22, STRIP_Y - 30, sx(WALL) + 22, STRIP_Y + 28, { color: color.ink, width: 4 });
        const believed = draw.line(0, STRIP_Y - 34, 0, STRIP_Y + 28, { color: color.error, width: 2, dash: '4 4' });
        const believedLabel = draw.text('encoder says', 0, STRIP_Y - 40, { color: color.error, size: 13, anchor: 'middle' });
        const bot = robot(draw, { size: 34 });

        const axes = new Axes(draw, {
            box: { left: LEFT, right: RIGHT, top: 200, bottom: 340 },
            x: [0, DURATION],
            y: [0, 72],
            xTicks: [0, 1, 2, 3, 4, 5],
            xUnit: ' s',
            yTicks: [0, 24, 48, 72],
            yLabel: 'inches',
        });
        const encoderCurve = axes.curve({ color: color.error, width: 2.5 });
        const truthCurve = axes.curve({ color: color.value, width: 2.5 });
        const now = draw.line(0, 200, 0, 340, { color: color.focus, width: 1.5 });
        const gap = draw.line(0, 0, 0, 0, { color: color.error, width: 2 });

        draw.text('encoder distance', axes.sx(0) + 12, 214, { color: color.error, size: 13 });
        draw.text('true position', axes.sx(0) + 12, 232, { color: color.value, size: 13 });
        draw.line(axes.sx(CUT_TIME), 198, axes.sx(CUT_TIME), 340, { color: color.rule, width: 1, dash: '3 3' });
        draw.text('motors cut', axes.sx(CUT_TIME), 192, { color: color.dim, size: 13, anchor: 'middle' });
        const readout = draw.text('', LEFT, 22, { size: 14 });

        let key = '';
        let run: Run = simulate(0.4, true);

        return ({ t, p }) => {
            const nextKey = `${p.grip}|${p.wall}`;
            if(nextKey !== key) {
                key = nextKey;
                run = simulate(p.grip, p.wall > 0.5);
            }

            const last = Math.min(Math.round(t / 0.01), run.times.length - 1);
            const truth = run.truth[last];
            const counted = run.encoder[last];

            wallLine.show(p.wall > 0.5);
            bot.move(sx(Math.min(truth, FIELD_INCHES)), STRIP_Y, 0);
            believed.to(sx(Math.min(counted, FIELD_INCHES)), STRIP_Y - 34, sx(Math.min(counted, FIELD_INCHES)), STRIP_Y + 28);
            believedLabel.at(sx(Math.min(counted, FIELD_INCHES)), STRIP_Y - 40);

            encoderCurve.d(axes.trace(run.encoder, DURATION, last + 1));
            truthCurve.d(axes.trace(run.truth, DURATION, last + 1));
            now.to(axes.sx(t), 200, axes.sx(t), 340);
            gap.to(axes.sx(t), axes.sy(truth), axes.sx(t), axes.sy(counted));

            readout.text(`encoder ${counted.toFixed(1)}   truth ${truth.toFixed(1)}   off by ${(counted - truth).toFixed(1)} in`);
        };
    },
});
