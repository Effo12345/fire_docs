import { defineScene } from '@kit/scene';
import { robot } from '@kit/robot';
import { color } from '@kit/palette';
import { simulateBump, LENGTH, type BumpRun } from './lib/bump';

const DURATION = 3.2;
const LEFT = 40;
const PX = 5.5;

const lanes = [
    { y: 95, title: 'timed: runs its tuned 2.0 s', checking: false },
    { y: 275, title: 'checks itself: stops at 72 in', checking: true },
];

export default defineScene({
    label: 'Two robots drive 72 inches down a line and get bumped sideways partway. The top robot is timed and carries on in its new direction. The bottom robot keeps checking how far it is from the line and steers back. A slider sets the size of the bump.',
    duration: DURATION,
    width: 480,
    height: 380,
    params: [{ key: 'bump', label: 'bump (° of heading)', min: 0, max: 15, step: 1, value: 10, digits: 0 }],
    build({ draw }) {
        const px = (inches: number) => LEFT + inches * PX;

        const parts = lanes.map((lane) => {
            draw.text(lane.title, LEFT, lane.y - 56, { color: color.dim, size: 14 });
            draw.line(px(0), lane.y, px(LENGTH), lane.y, { color: color.target, width: 1.5, dash: '6 5' });
            draw.line(px(LENGTH), lane.y - 26, px(LENGTH), lane.y + 26, { color: color.target, width: 2 });
            const push = draw.arrow(px(30), lane.y - 40, px(30), lane.y - 14, { color: color.error, width: 2, head: 9 });
            const word = draw.text('bump', px(30) + 10, lane.y - 22, { color: color.error, size: 14 });

            const trail = draw.path('', { color: color.value, width: 2.5 });
            const bot = robot(draw, { size: 30 });
            const result = draw.text('', px(LENGTH), lane.y + 96, { color: color.error, size: 14, anchor: 'end' });
            return { lane, trail, bot, result, push, word };
        });
        draw.text('target', px(LENGTH), lanes[0].y - 34, { color: color.target, size: 14, anchor: 'middle' });

        let key = -1;
        let runs: BumpRun[] = [];

        return ({ t, p }) => {
            if(p.bump !== key) {
                key = p.bump;
                runs = lanes.map((lane) => simulateBump(p.bump, lane.checking, DURATION));
            }

            parts.forEach((part, n) => {
                const run = runs[n];
                part.push.show(p.bump > 0);
                part.word.show(p.bump > 0);
                const index = Math.min(run.t.length - 1, Math.round((t / DURATION) * (run.t.length - 1)));
                const sy = (y: number) => part.lane.y + y * PX;

                let d = '';
                for(let i = 0; i <= index; i++) {
                    d += `${i ? 'L' : 'M'}${px(run.x[i])} ${sy(run.y[i])} `;
                }
                part.trail.d(d);

                const back = Math.max(0, index - 4);
                const heading = index > back ? Math.atan2(run.y[index] - run.y[back], run.x[index] - run.x[back]) * 180 / Math.PI : 0;
                part.bot.move(px(run.x[index]), sy(run.y[index]), heading);

                const off = Math.hypot(LENGTH - run.x[index], run.y[index]);
                part.result.text(t >= run.done ? `ends ${off.toFixed(1)} in from the target` : '');
            });
        };
    },
});
