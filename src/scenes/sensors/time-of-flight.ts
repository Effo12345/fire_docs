import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';
import { MM_PER_NS, SCREEN_SECONDS_PER_MM, roundTripNs } from './lib/distance';

const SENSOR_X = 70;
const PX_PER_MM = 0.27;
const Y = 200;

export default defineScene({
    label: 'A pulse of light leaves a distance sensor, hits a wall and comes back, enormously slowed down. A stopwatch in nanoseconds counts the round trip, and the distance is worked out as the speed of light times the time, divided by two. A slider sets how far away the wall is.',
    height: 300,
    duration: 6,
    params: [
        { key: 'wall', label: 'wall distance (mm)', min: 100, max: 2000, step: 50, value: 600, digits: 0 },
    ],
    build({ draw }) {
        draw.text('slowed down about 300 million times', 20, 26, { size: 15 });
        const stopwatch = draw.text('', 20, 54, { mono: true, size: 14, color: color.value });
        const result = draw.text('', 20, 80, { mono: true, size: 14, color: color.target });
        const result2 = draw.text('', 20, 102, { mono: true, size: 14, color: color.target });

        // Sensor on the left
        draw.rect(SENSOR_X - 28, Y - 22, 28, 44, { color: color.ink, width: 2, fill: color.bg });
        draw.text('sensor', SENSOR_X - 14, Y + 44, { size: 13, color: color.dim, anchor: 'middle' });

        const wall = draw.line(0, Y - 60, 0, Y + 60, { color: color.ink, width: 4 });
        const wallLabel = draw.text('', 0, Y + 82, { size: 13, color: color.dim, anchor: 'middle' });

        // Out along one line, back along another so the two legs don't overlap
        const outLeg = draw.line(SENSOR_X, Y - 8, SENSOR_X, Y - 8, { color: color.rule, width: 1, dash: '3 4' });
        const backLeg = draw.line(SENSOR_X, Y + 8, SENSOR_X, Y + 8, { color: color.rule, width: 1, dash: '3 4' });
        const pulse = draw.line(SENSOR_X, Y, SENSOR_X, Y, { color: color.focus, width: 6 });

        return ({ t, p }) => {
            const d = p.wall;
            const wallX = SENSOR_X + d * PX_PER_MM;
            const out = d * SCREEN_SECONDS_PER_MM;
            const total = 2 * out;

            wall.to(wallX, Y - 60, wallX, Y + 60);
            wallLabel.at(wallX, Y + 82);
            wallLabel.text(`${Math.round(d)} mm away`);
            outLeg.to(SENSOR_X, Y - 8, wallX, Y - 8);
            backLeg.to(SENSOR_X, Y + 8, wallX, Y + 8);

            // Pulse position along its path, in mm of travel. A short bar, 25 mm long on screen
            const traveled = Math.min(t, total) / SCREEN_SECONDS_PER_MM;
            const goingOut = traveled <= d;
            const head = goingOut ? traveled : 2 * d - traveled;
            const tail = Math.max(0, goingOut ? head - 40 : head);
            const lane = goingOut ? Y - 8 : Y + 8;
            const done = t >= total;

            if(done) {
                pulse.show(false);
            } else {
                pulse.show(true);
                const a = goingOut ? tail : head;
                const b = goingOut ? head : Math.min(d, head + 40);
                pulse.to(SENSOR_X + a * PX_PER_MM, lane, SENSOR_X + b * PX_PER_MM, lane);
            }

            const ns = traveled / MM_PER_NS;
            stopwatch.text(`stopwatch: ${ns.toFixed(2)} ns`);

            if(done) {
                const rt = roundTripNs(d);
                result.text(`round trip ${rt.toFixed(2)} ns`);
                result2.text(`distance = ${MM_PER_NS.toFixed(1)} x ${rt.toFixed(2)} / 2 = ${Math.round((MM_PER_NS * rt) / 2)} mm`);
            } else {
                result.text('');
                result2.text('');
            }
        };
    },
});
