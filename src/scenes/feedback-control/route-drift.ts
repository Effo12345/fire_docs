import { defineScene } from '@kit/scene';
import { robot, Field } from '@kit/robot';
import { color } from '@kit/palette';
import { LEGS, missDistance, runRoute } from './lib/route';

// Scene seconds per inch driven, per turn, and the pause at the end
const PER_INCH = 1 / 45;
const TURN_TIME = 0.6;
const HOLD = 1.5;

const total = LEGS.reduce((sum, leg) => sum + leg, 0) * PER_INCH + (LEGS.length - 1) * TURN_TIME;

export default defineScene({
    label: 'A robot drives a four leg route on a field. A dashed green line shows the plan and a blue line shows the run, where every turn comes out a few degrees off and every leg comes up a little short. Sliders set both errors, and the scene reports how far the end of the run misses the end of the plan.',
    duration: total + HOLD,
    width: 540,
    height: 400,
    params: [
        { key: 'turn', label: 'error in each turn (°)', min: 0, max: 6, step: 0.5, value: 3, digits: 1 },
        { key: 'short', label: 'each leg short (%)', min: 0, max: 5, step: 0.5, value: 0, digits: 1 },
    ],
    build({ draw }) {
        const field = new Field(draw, 12, 40, 330);
        const planned = runRoute(0, 0);

        const plannedPath = planned.points.map((p, i) => `${i ? 'L' : 'M'}${field.sx(p.x)} ${field.sy(p.y)}`).join(' ');
        draw.path(plannedPath, { color: color.target, width: 2, dash: '6 5' });
        const plannedEnd = draw.circle(field.sx(planned.end.x), field.sy(planned.end.y), 6, { color: color.target, width: 2 });

        const trail = draw.path('', { color: color.value, width: 2.5 });
        const bot = robot(draw);
        const gap = draw.line(0, 0, 0, 0, { color: color.error, width: 2 });

        draw.text('heading off by', 360, 62, { color: color.dim, size: 14 });
        const rows = LEGS.map((_, i) => draw.text('', 360, 90 + i * 26, { size: 14, mono: true }));
        const shortText = draw.text('', 360, 214, { color: color.dim, size: 14 });
        draw.text('end of the run is', 360, 280, { color: color.dim, size: 14 });
        draw.text('from the plan', 360, 336, { color: color.dim, size: 14 });
        const miss = draw.text('', 360, 316, { color: color.error, size: 30, weight: 600 });

        let key = '';
        let route = planned;
        let timeline: { start: number; end: number; leg: number }[] = [];

        return ({ t, p }) => {
            const nextKey = `${p.turn}|${p.short}`;
            if(nextKey !== key) {
                key = nextKey;
                route = runRoute(p.turn, p.short);

                // When each leg starts and ends, with a turn between legs
                timeline = [];
                let clock = 0;
                LEGS.forEach((leg, i) => {
                    const end = clock + leg * (1 - p.short / 100) * PER_INCH;
                    timeline.push({ start: clock, end, leg: i });
                    clock = end + TURN_TIME;
                });
            }

            // Where the robot is: on a leg, or turning at a corner
            let x = route.points[0].x;
            let y = route.points[0].y;
            let heading = 0;
            let leg = 0;
            const trailPoints: string[] = [`M${field.sx(x)} ${field.sy(y)}`];

            for(const seg of timeline) {
                const a = route.points[seg.leg];
                const b = route.points[seg.leg + 1];
                heading = a.heading;
                leg = seg.leg;

                if(t < seg.start) {
                    break;
                }

                const f = Math.max(0, Math.min(1, (t - seg.start) / (seg.end - seg.start)));
                x = a.x + (b.x - a.x) * f;
                y = a.y + (b.y - a.y) * f;
                trailPoints.push(`L${field.sx(x)} ${field.sy(y)}`);

                if(f < 1) {
                    break;
                }

                // Turning toward the next leg
                if(seg.leg + 1 < LEGS.length) {
                    const turnF = Math.max(0, Math.min(1, (t - seg.end) / TURN_TIME));
                    heading = a.heading + (b.heading - a.heading) * turnF;
                    leg = turnF >= 1 ? seg.leg + 1 : seg.leg;
                    if(turnF < 1) {
                        break;
                    }
                }
            }

            trail.d(trailPoints.join(' '));
            bot.move(field.sx(x), field.sy(y), heading - 90);

            const finished = t >= total - 1e-6;
            const end = route.end;
            gap.to(field.sx(end.x), field.sy(end.y), field.sx(planned.end.x), field.sy(planned.end.y));
            gap.show(finished);
            plannedEnd.show(true);

            rows.forEach((row, i) => {
                const off = i * p.turn;
                row.text(`leg ${i + 1}   ${off.toFixed(1)}°`);
                row.set({ fill: i === leg ? color.ink : color.faint });
            });
            shortText.text(p.short > 0 ? `each leg ${p.short.toFixed(1)}% short` : 'every leg full length');
            miss.text(finished ? `${missDistance(p.turn, p.short).toFixed(1)} in` : '...');
        };
    },
});
