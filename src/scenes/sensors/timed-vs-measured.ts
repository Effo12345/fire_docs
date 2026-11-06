import { defineScene } from '@kit/scene';
import { robot } from '@kit/robot';
import { color } from '@kit/palette';
import { runBoth, TARGET, DURATION, DT, TIMED_SECONDS } from './lib/timed-measured';

const LEFT = 50;
const RIGHT = 680;
const FIELD_INCHES = 60;
const sx = (inches: number) => LEFT + (inches / FIELD_INCHES) * (RIGHT - LEFT);

export default defineScene({
    label: 'Two robots start together and drive toward a 48 inch line. One stops after a fixed time, the other stops when its wheels have measured 48 inches. A slider adds load.',
    duration: DURATION,
    height: 345,
    params: [
        { key: 'load', label: 'extra load', min: 0, max: 1, step: 0.05, value: 0.35, digits: 2 },
    ],
    build({ draw }) {
        const lanes = [
            { y: 90, name: 'Stops after a set time', key: 'timed' as const },
            { y: 230, name: 'Stops when the wheels have measured 48 in', key: 'measured' as const },
        ];

        const bots: ReturnType<typeof robot>[] = [];
        const landing: ReturnType<typeof draw.line>[] = [];
        const results: ReturnType<typeof draw.text>[] = [];

        for(const lane of lanes) {
            draw.text(lane.name, LEFT, lane.y - 52, { size: 15 });
            draw.line(sx(0), lane.y + 24, sx(FIELD_INCHES), lane.y + 24, { color: color.rule, width: 1 });
            for(const inches of [0, 12, 24, 36, 48, 60]) {
                draw.line(sx(inches), lane.y + 24, sx(inches), lane.y + 30, { color: color.rule, width: 1 });
                draw.text(inches, sx(inches), lane.y + 46, { color: color.dim, size: 13, anchor: 'middle' });
            }
            draw.line(sx(TARGET), lane.y - 34, sx(TARGET), lane.y + 24, { color: color.target });

            landing.push(draw.line(0, 0, 0, 0, { color: color.error, width: 1.5, dash: '3 4' }));
            bots.push(robot(draw, { size: 34 }));
            results.push(draw.text('', RIGHT, lane.y + 66, { size: 14, anchor: 'end', color: color.error }));
        }

        draw.text('target', sx(TARGET) + 6, 62, { color: color.target, size: 13 });
        draw.text('inches', RIGHT, 336, { color: color.dim, size: 13, anchor: 'end' });
        draw.text('Simplified model with made-up numbers', LEFT, 336, { color: color.dim, size: 13 });

        let key = -1;
        let runs = runBoth(0);

        return ({ t, p }) => {
            const nextKey = Math.round(p.load * 1000);
            if(nextKey !== key) {
                key = nextKey;
                runs = runBoth(p.load);
            }

            lanes.forEach((lane, i) => {
                const run = runs[lane.key];
                const index = Math.min(run.position.length - 1, Math.round(t / DT));
                const x = run.position[index];

                bots[i].move(sx(x) - 17, lane.y - 4);
                landing[i].to(sx(run.final), lane.y - 34, sx(run.final), lane.y + 24);

                const miss = run.final - TARGET;
                const word = Math.abs(miss) < 0.05 ? 'on the line' : miss < 0 ? `${(-miss).toFixed(1)} in short` : `${miss.toFixed(1)} in past`;
                results[i].text(`lands ${run.final.toFixed(1)} in, ${word}`);
            });
        };
    },
});
