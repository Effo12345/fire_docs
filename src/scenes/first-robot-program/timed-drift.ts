import { defineScene } from '@kit/scene';
import { robot } from '@kit/robot';
import { color } from '@kit/palette';
import { BASELINE, ROUTINE_SECONDS, TOP_SPEED, otherRuns, poseAt, simulate, type Conditions, type Pose } from './lib/timed-moves';

const DURATION = ROUTINE_SECONDS + 1;

// A 80 in by 80 in window of the field, in screen units
const BOX = { x: 20, y: 20, size: 360 };
const SCALE = BOX.size / 80;
const START = { x: 20, y: 10 };

const sx = (inches: number) => BOX.x + (START.x + inches) * SCALE;
const sy = (inches: number) => BOX.y + BOX.size - (START.y + inches) * SCALE;

const PANEL = 410;

const trace = (path: Pose[], t: number) => {
    const last = Math.round(Math.min(t, ROUTINE_SECONDS) / 0.01);
    let d = '';
    for(let i = 0; i <= last; i += 2) {
        d += `${i === 0 ? 'M' : 'L'}${sx(path[i].x).toFixed(1)} ${sy(path[i].y).toFixed(1)}`;
    }
    return d;
};

export default defineScene({
    label: 'A top-down view of a robot running the same timed routine: drive forward, turn right, drive forward. A dashed green path shows where the routine landed on the day its times were tuned. A blue path shows a run under conditions set by sliders for lost speed, floor grip and starting angle error, and five faint paths show the same program on other days. The distance between the tuned landing spot and the blue run is printed. This is a simplified model with illustrative numbers.',
    width: 720,
    height: 400,
    duration: DURATION,
    params: [
        { key: 'shortfall', label: 'speed lost (%)', min: 0, max: 30, step: 1, value: 0, digits: 0 },
        { key: 'grip', label: 'floor grip', min: 0.3, max: 1, step: 0.05, value: 0.7, digits: 2 },
        { key: 'angle', label: 'starting angle error (deg)', min: -6, max: 6, step: 0.5, value: 0, digits: 1 },
        { key: 'variation', label: 'day-to-day variation', min: 0, max: 1, step: 0.1, value: 0.5, digits: 1 },
    ],
    build({ draw }) {
        // A faint grid, 24 in squares
        for(let inches = 0; inches <= 72; inches += 24) {
            const gx = BOX.x + (inches / 80) * BOX.size;
            const gy = BOX.y + BOX.size - (inches / 80) * BOX.size;
            draw.line(gx, BOX.y, gx, BOX.y + BOX.size, { color: color.rule, width: 1 });
            draw.line(BOX.x, gy, BOX.x + BOX.size, gy, { color: color.rule, width: 1 });
        }
        draw.rect(BOX.x, BOX.y, BOX.size, BOX.size, { color: color.dim, width: 1.5 });
        draw.line(BOX.x + 8, BOX.y + BOX.size - 14, BOX.x + 8 + 24 * SCALE, BOX.y + BOX.size - 14, { color: color.dim, width: 1.5 });
        draw.text('24 in', BOX.x + 8 + 12 * SCALE, BOX.y + BOX.size - 20, { color: color.dim, size: 13, anchor: 'middle' });

        // The tuned run, always there
        const tuned = simulate(BASELINE);
        const tunedEnd = tuned[tuned.length - 1];
        draw.path(trace(tuned, ROUTINE_SECONDS), { color: color.target, width: 2, dash: '6 5' });
        const tunedDot = draw.circle(sx(tunedEnd.x), sy(tunedEnd.y), 5, { color: color.target, width: 2 });

        // Five other days
        const others = Array.from({ length: 5 }, () => ({
            path: draw.path('', { color: color.value, width: 1.25 }).opacity(0.4),
            dot: draw.circle(0, 0, 3, { fill: color.value }).opacity(0.5),
        }));

        // This run
        const mine = draw.path('', { color: color.value, width: 2.5 });
        const gap = draw.line(0, 0, 0, 0, { color: color.error, width: 2 });
        const gapText = draw.text('', 0, 0, { color: color.error, size: 14 });
        const bot = robot(draw, { size: 46 });

        // Side panel
        draw.text('simplified model, illustrative numbers', PANEL, 36, { color: color.dim, size: 13 });
        draw.line(PANEL, 74, PANEL + 36, 74, { color: color.target, width: 2, dash: '6 5' });
        draw.text('where it landed on tuning day', PANEL + 46, 79, { size: 14 });
        draw.line(PANEL, 100, PANEL + 36, 100, { color: color.value, width: 2.5 });
        draw.text('this run', PANEL + 46, 105, { size: 14 });
        draw.line(PANEL, 126, PANEL + 36, 126, { color: color.value, width: 1.25 }).opacity(0.4);
        draw.text('five other days, same program', PANEL + 46, 131, { size: 14 });

        const readFree = draw.text('', PANEL, 192, { mono: true, size: 14 });
        const readMine = draw.text('', PANEL, 244, { mono: true, size: 14 });
        const readHeading = draw.text('', PANEL, 270, { mono: true, size: 14 });
        const readSpread = draw.text('', PANEL, 322, { mono: true, size: 14 });
        draw.text('programmed:', PANEL, 166, { color: color.dim, size: 14 });
        draw.text('this run:', PANEL, 218, { color: color.dim, size: 14 });
        draw.text('all six runs:', PANEL, 296, { color: color.dim, size: 14 });
        const readSpread2 = draw.text('', PANEL, 348, { color: color.dim, size: 13 });

        let key = '';
        let main: Pose[] = [];
        let paths: Pose[][] = [];
        let spread = 0;

        return ({ t, p }) => {
            const next = `${p.shortfall}|${p.grip}|${p.angle}|${p.variation}`;
            if(next !== key) {
                key = next;
                const c: Conditions = { shortfall: p.shortfall / 100, grip: p.grip, angle: p.angle };
                main = simulate(c);
                paths = otherRuns(c, p.variation).map(simulate);

                const ends = [main, ...paths].map((path) => path[path.length - 1]);
                spread = 0;
                for(const a of ends) {
                    for(const b of ends) {
                        spread = Math.max(spread, Math.hypot(a.x - b.x, a.y - b.y));
                    }
                }
            }

            paths.forEach((path, i) => {
                others[i].path.d(trace(path, t));
                const pose = poseAt(path, Math.min(t, ROUTINE_SECONDS));
                others[i].dot.set({ cx: sx(pose.x), cy: sy(pose.y) });
                others[i].dot.show(t >= ROUTINE_SECONDS);
            });

            mine.d(trace(main, t));
            const pose = poseAt(main, Math.min(t, ROUTINE_SECONDS));
            bot.move(sx(pose.x), sy(pose.y), pose.heading - 90);

            const end = main[main.length - 1];
            const off = Math.hypot(end.x - tunedEnd.x, end.y - tunedEnd.y);
            const done = t >= ROUTINE_SECONDS;
            gap.show(done && off > 0.3);
            gapText.show(done && off > 0.3);
            if(done) {
                gap.to(sx(tunedEnd.x), sy(tunedEnd.y), sx(end.x), sy(end.y));
                const right = sx(end.x) < BOX.x + BOX.size - 70;
                gapText.at(right ? sx(end.x) + 14 : sx(end.x) - 14, sy(end.y) - 28).text(`${off.toFixed(1)} in off`);
                gapText.set({ 'text-anchor': right ? 'start' : 'end' });
            }

            const tunedHeading = tunedEnd.heading;
            readFree.text(`drive 6000 mV: ${(TOP_SPEED / 2).toFixed(1)} in/s`);
            readMine.text(`lands ${off.toFixed(1)} in away`);
            readHeading.text(`heading ${(end.heading - tunedHeading).toFixed(1)} deg off`);
            readSpread.text(`widest gap ${spread.toFixed(1)} in`);
            readSpread2.text('between any two of their end points');
        };
    },
});
