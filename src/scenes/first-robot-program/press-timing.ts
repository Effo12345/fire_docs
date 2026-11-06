import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';

const SPAN = 250; // ms shown
const DURATION = 5;
const LEFT = 206;
const RIGHT = 726;
const PX = (RIGHT - LEFT) / SPAN;
const MAX_TICKS = 26;

const X = (ms: number) => LEFT + ms * PX;
const ROWS = { button: 62, ticks: 108, digital: 154, press: 198, wrong: 276, right: 322 };

export default defineScene({
    label: 'A button press is shown on a time axis with the program\'s loop ticks below it. For each tick, get_digital reports whether the button is down, and get_digital_new_press reports only the first tick that sees it down. Two toggles for the intake are compared: one that flips on every tick where get_digital is true, and one that flips only on a new press. Sliders change how long the button is held, when it goes down, and how long the loop delay is.',
    width: 760,
    height: 400,
    duration: DURATION,
    params: [
        { key: 'hold', label: 'hold time (ms)', min: 10, max: 200, step: 5, value: 105, digits: 0 },
        { key: 'start', label: 'press starts at (ms)', min: 0, max: 100, step: 5, value: 25, digits: 0 },
        { key: 'delay', label: 'loop delay (ms)', min: 10, max: 100, step: 10, value: 10, digits: 0 },
    ],
    build({ draw }) {
        // Row labels
        const label = (text: string, y: number, c: string = color.ink) => draw.text(text, 16, y + 5, { mono: true, size: 13, color: c });
        label('button', ROWS.button);
        label('loop ticks', ROWS.ticks);
        label('get_digital', ROWS.digital);
        label('get_digital_new_press', ROWS.press, color.ink);
        draw.text('the intake, toggled on:', 16, ROWS.wrong - 30, { color: color.dim, size: 14 });
        label('get_digital', ROWS.wrong);
        label('new press', ROWS.right);
        const wrongCount = draw.text('', 16, ROWS.wrong + 22, { size: 13, color: color.dim });
        const rightCount = draw.text('', 16, ROWS.right + 22, { size: 13, color: color.dim });

        // Time axis
        for (let ms = 0; ms <= SPAN; ms += 50) {
            draw.line(X(ms), 346, X(ms), 352, { color: color.rule, width: 1 });
            draw.text(`${ms} ms`, X(ms), 368, { color: color.dim, size: 13, anchor: 'middle' });
        }
        draw.line(X(0), 346, X(SPAN), 346, { color: color.rule, width: 1 });

        // Raw button: a pulse
        draw.line(X(0), ROWS.button + 11, X(SPAN), ROWS.button + 11, { color: color.rule, width: 1 });
        const pulse = draw.path('', { color: color.value, width: 2.5 });

        // Pools of marks, one per possible tick
        const tickLines = [];
        const digitalCells = [];
        const pressCells = [];
        const wrongBars = [];
        const rightBars = [];
        for (let i = 0; i < MAX_TICKS; i++) {
            tickLines.push(draw.line(0, ROWS.ticks - 10, 0, ROWS.ticks + 10, { color: color.dim, width: 1.5 }));
            digitalCells.push(draw.text('', 0, ROWS.digital + 5, { mono: true, size: 14, anchor: 'middle' }));
            pressCells.push(draw.text('', 0, ROWS.press + 5, { mono: true, size: 14, anchor: 'middle' }));
            wrongBars.push(draw.rect(0, ROWS.wrong - 10, 0, 20, { fill: 'rgba(122, 200, 120, 0.55)' }));
            rightBars.push(draw.rect(0, ROWS.right - 10, 0, 20, { fill: 'rgba(122, 200, 120, 0.55)' }));
        }
        // Outlines for the intake rows
        for (const y of [ROWS.wrong, ROWS.right]) {
            draw.rect(X(0), y - 10, RIGHT - LEFT, 20, { color: color.rule, width: 1 });
        }

        const playhead = draw.line(0, 40, 0, 336, { color: color.focus, width: 1.5 });
        const note = draw.text('', 16, 392, { size: 14, color: color.dim });

        return ({ t, p }) => {
            const hold = Math.round(p.hold / 5) * 5;
            const start = Math.round(p.start / 5) * 5;
            const delay = Math.max(10, Math.round(p.delay / 10) * 10);
            const now = (t / DURATION) * SPAN;
            const end = Math.min(SPAN, start + hold);

            // The pulse
            pulse.d(`M${X(0)} ${ROWS.button + 11} L${X(start)} ${ROWS.button + 11} L${X(start)} ${ROWS.button - 11} L${X(end)} ${ROWS.button - 11} L${X(end)} ${ROWS.button + 11} L${X(SPAN)} ${ROWS.button + 11}`);

            let wrongState = false;
            let rightState = false;
            let wrongFlips = 0;
            let rightFlips = 0;
            let total = 0;
            let prevHeld = false;
            let missed = true;

            for (let i = 0; i < MAX_TICKS; i++) {
                const ms = i * delay;
                const exists = ms < SPAN;
                const shown = exists && ms <= now + 1e-6;
                tickLines[i].show(exists);
                if(!exists) {
                    digitalCells[i].show(false);
                    pressCells[i].show(false);
                    wrongBars[i].show(false);
                    rightBars[i].show(false);
                    continue;
                }
                tickLines[i].to(X(ms), ROWS.ticks - 10, X(ms), ROWS.ticks + 10);
                tickLines[i].set({ stroke: shown ? color.ink : color.faint });

                const held = ms >= start && ms < end;
                const newPress = held && !prevHeld;
                prevHeld = held;
                if(held) {
                    missed = false;
                    total++;
                }

                if(shown) {
                    if(held) {
                        wrongState = !wrongState;
                        wrongFlips++;
                    }
                    if(newPress) {
                        rightState = !rightState;
                        rightFlips++;
                    }
                }

                const cellX = X(ms);
                digitalCells[i].show(shown).at(cellX, ROWS.digital + 5).text(held ? 1 : 0).set({ fill: held ? color.value : color.faint });
                pressCells[i].show(shown).at(cellX, ROWS.press + 5).text(newPress ? 1 : 0).set({ fill: newPress ? color.focus : color.faint });

                // The state lasts until the next tick, or until the playhead
                const nextMs = Math.min(SPAN, (i + 1) * delay);
                const stop = Math.min(nextMs, now);
                const width = Math.max(0, stop - ms) * PX;
                wrongBars[i].show(shown && wrongState).set({ x: cellX, width });
                rightBars[i].show(shown && rightState).set({ x: cellX, width });
            }

            playhead.to(X(now), 40, X(now), 336);

            const plural = (n: number) => (n === 1 ? 'time' : 'times');
            wrongCount.text(`flipped ${wrongFlips} ${plural(wrongFlips)}`);
            rightCount.text(`flipped ${rightFlips} ${plural(rightFlips)}`);

            if(missed) {
                note.text('No tick landed while the button was down, so the program never saw the press.');
                note.set({ fill: color.error });
            } else {
                note.text(`get_digital saw the button down on ${total} tick${total === 1 ? '' : 's'}. get_digital_new_press said yes once.`);
                note.set({ fill: color.dim });
            }
        };
    },
});
