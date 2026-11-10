import { defineScene } from '@kit/scene';
import { robot } from '@kit/robot';
import { v5Drive } from '@kit/sim/drive';
import { simulateBangBang, simulateTimed } from './lib/bang-bang';
import { color } from '@kit/palette';

const TARGET = 24;
const BAND = 1;
const LOOK = 0.1;
const ON = 0.44;
const HEAVY = { ...v5Drive, accelPerVolt: 24 };

// Scene seconds per second of robot time while the open loop runs
const SLOW = 2;
const OPEN_A = 0.5;
const OPEN_B = 5.5;
const CLOSED = 9.3;

const tuned = simulateTimed(ON, 1.6, 400);
const heavy = simulateTimed(ON, 1.6, 400, HEAVY);
const closed = simulateBangBang(TARGET, { band: BAND, period: LOOK }, 1, 500, HEAVY);

// Each pass around the loop, with how long it stays on screen. The first ones are slow
const TICKS = 9;
const SLOW_TICK = 2.6;
const FAST_TICK = 1.1;
const tickStart: number[] = [];
let clock = CLOSED + 0.5;
for(let k = 0; k < TICKS; k++) {
    tickStart.push(clock);
    clock += k < 3 ? SLOW_TICK : FAST_TICK;
}
const END = clock + 3;

const at = (list: number[], f: number) => {
    const x = Math.max(0, Math.min(1, f)) * (list.length - 1);
    const i = Math.min(Math.floor(x), list.length - 2);
    return list[i] + (list[i + 1] - list[i]) * (x - i);
};

const measuredAt = (k: number) => at(closed.position, (k * LOOK) / 1);

export default defineScene({
    label: 'A robot drives toward a 24 inch target. First an open loop version that only follows a clock, then a closed loop version that goes around measure, compare and act, with the numbers shown at each step.',
    duration: END,
    width: 560,
    height: 410,
    beats: [
        { at: 0, text: 'An <strong>open loop</strong> routine. The program picks one command ahead of time: full power for 440 milliseconds. It never looks at where the robot is, so only the last box of the cycle below is in use.' },
        { at: OPEN_A + SLOW * 1.6, text: 'On tuning day, the robot carries nothing and the times were tuned to it. It ends 24.1 inches out. Close enough.' },
        { at: OPEN_B - 0.7, text: 'Next day, the robot carries something heavy. Same program, same command.' },
        { at: OPEN_B + SLOW * 1.6, text: 'It ends 19.3 inches out, and the program has no idea. Nothing in it ever looked.' },
        { at: CLOSED, text: 'Now <strong>close the loop</strong>. The same heavy robot, but each pass around the cycle starts by reading the sensor. Measure.' },
        { at: tickStart[0] + 0.8, text: '<strong>Compare.</strong> Subtract the measurement from the target. The answer, 24 inches, is the <em>error</em>.' },
        { at: tickStart[0] + 1.45, text: '<strong>Act.</strong> This is the whole rule: more than 1 inch short, push forward at full power. Then wait 100 ms and go around again.' },
        { at: tickStart[1], text: 'Second pass. The measurement is not 0 anymore, so the error is smaller. The robot got to 1.1 inches while the loop was waiting.' },
        { at: tickStart[2], text: 'Same three steps again. The error shrinks each pass, and the answer stays full power.' },
        { at: tickStart[7], text: 'Within 1 inch, so the rule says stop. But the robot is moving at 43 inches per second, and cutting the power does not stop it.' },
        { at: tickStart[8], text: 'It coasted to 26.9 inches. The error is now negative, so the rule says push backward. The loop caught the overshoot, which the open loop never could, and it will keep correcting.' },
    ],
    build({ draw }) {
        const fx = (inches: number) => 40 + (inches / 32) * 480;
        const trackY = 92;

        draw.line(fx(0), trackY + 28, fx(32), trackY + 28, { color: color.rule, width: 1 });
        draw.line(fx(TARGET), trackY - 34, fx(TARGET), trackY + 34, { color: color.target });
        draw.text('target', fx(TARGET), trackY - 48, { color: color.target, size: 14, anchor: 'middle' });
        const bot = robot(draw);
        const where = draw.text('', 0, 0, { color: color.value, size: 14, anchor: 'middle' });
        const day = draw.text('', 20, 28, { color: color.dim, size: 14 });
        const landed = draw.text('', fx(TARGET), trackY + 74, { color: color.error, size: 14, anchor: 'middle' });

        // The cycle
        const names = ['measure', 'compare', 'act'];
        const bx = [24, 199, 374];
        const boxY = 190;
        const boxes = names.map((name, i) => {
            const rect = draw.rect(bx[i], boxY, 150, 46, { color: color.dim, width: 1.5 });
            const label = draw.text(name, bx[i] + 75, boxY + 30, { size: 17, anchor: 'middle' });
            return { rect, label };
        });
        const arrows = [0, 1].map((i) => draw.arrow(bx[i] + 154, boxY + 23, bx[i + 1] - 4, boxY + 23, { color: color.dim, width: 1.5, head: 9 }));
        const back = draw.path(`M${bx[2] + 150} ${boxY + 23} L${bx[2] + 164} ${boxY + 23} L${bx[2] + 164} ${boxY + 150} L${bx[0] - 14} ${boxY + 150} L${bx[0] - 14} ${boxY + 23}`, { color: color.dim, width: 1.5 });
        const backHead = draw.arrow(bx[0] - 14, boxY + 23, bx[0] - 2, boxY + 23, { color: color.dim, width: 1.5, head: 9 });
        const backLabel = draw.text('the new measurement feeds back', 280, boxY + 172, { color: color.dim, size: 14, anchor: 'middle' });

        const line1 = bx.map((x) => draw.text('', x + 75, boxY + 74, { size: 14, anchor: 'middle', mono: true }));
        const line2 = bx.map((x) => draw.text('', x + 75, boxY + 96, { size: 13, anchor: 'middle', color: color.dim }));

        return ({ t }) => {
            const isClosed = t >= CLOSED;
            let x = 0;
            let heading = '';
            let a = '';
            let b = '';
            let c = '';
            let active = -1;
            let status = '';

            // Open loop: one run on tuning day, one on a heavier day
            if(!isClosed) {
                const second = t >= OPEN_B - 0.7;
                const start = second ? OPEN_B : OPEN_A;
                const run = second ? heavy : tuned;
                const f = (t - start) / (SLOW * tuned.duration);
                x = t < start ? 0 : at(run.position, f);
                heading = second ? 'next day, carrying a heavier load' : 'tuning day';
                active = t < start ? -1 : 2;
                a = '(not done)';
                b = '(not done)';
                const driving = f < ON / tuned.duration;
                c = driving ? '+12000 mV' : '0 mV';
                status = t < start ? '' : driving ? 'until 440 ms pass' : 'the timer ran out';
                const finished = t >= start + SLOW * tuned.duration;
                landed.text(finished ? `ended ${second ? '19.3' : '24.1'} in` : '');
                if(finished) {
                    active = -1;
                    status = '';
                }
            }
            else {
                landed.text('');
                heading = 'heavier load, closed loop';
                let k = -1;
                for(let i = 0; i < TICKS; i++) {
                    if(t >= tickStart[i]) {
                        k = i;
                    }
                }
                const into = k < 0 ? 0 : t - tickStart[k];
                const length = k < 3 ? SLOW_TICK : FAST_TICK;
                const measured = measuredAt(Math.max(k, 0));
                const error = TARGET - measured;
                const nextX = k >= 0 && k + 1 < TICKS ? measuredAt(k + 1) : measured;

                // The robot drifts to the next measurement while the loop waits
                const frac = Math.max(0, Math.min(1, (into / length - 0.7) / 0.3));
                x = measured + (nextX - measured) * frac;

                const phase = k < 0 ? -1 : into / length < 0.3 ? 0 : into / length < 0.55 ? 1 : 2;
                active = phase;
                if(phase >= 0) {
                    a = `${measured.toFixed(1)} in`;
                }
                if(phase >= 1) {
                    b = `${TARGET} - ${measured.toFixed(1)} = ${error.toFixed(1)}`;
                }
                if(phase >= 2) {
                    const volts = error > BAND ? 12000 : error < -BAND ? -12000 : 0;
                    c = `${volts > 0 ? '+' : ''}${volts} mV`;
                    status = error > BAND ? 'more than 1 in short' : error < -BAND ? 'more than 1 in past' : 'within 1 in: stop';
                }
            }

            bot.move(fx(x) - 19, trackY + 0);
            where.at(fx(x), trackY + 52).text(`${x.toFixed(1)} in`);
            day.text(heading);

            boxes.forEach((box, i) => {
                const on = i === active;
                box.rect.set({ stroke: on ? color.focus : color.dim, 'stroke-width': on ? 3 : 1.5 });
                const dimmed = !isClosed && i < 2;
                box.rect.opacity(dimmed ? 0.35 : 1);
                box.label.opacity(dimmed ? 0.35 : 1);
            });
            arrows.forEach((arrow) => arrow.opacity(isClosed ? 1 : 0.25));
            back.opacity(isClosed ? 1 : 0.15);
            backHead.opacity(isClosed ? 1 : 0.15);
            backLabel.opacity(isClosed ? 1 : 0.15);

            line1[0].text(a);
            line1[1].text(b);
            line1[2].text(c);
            line2[0].text('');
            line2[1].text('');
            line2[2].text(status);
        };
    },
});
