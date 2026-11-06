import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';
import { codePanel } from './lib/code-panel';

const CODE = [
    'void addPoints(int points) {',
    '    points = points + 5;',
    '}',
    '',
    'int score = 10;',
    'addPoints(score);',
    'std::cout << score << "\\n";',
];

// What exists after each step: 1 means visible, 0 means gone
interface State {
    line: number;
    score: number;
    frame: number;
    points: number;
    copy: number;
    out: number;
    note: string;
}

const STATES: State[] = [
    { line: 5, score: 10, frame: 0, points: 10, copy: 0, out: 0, note: 'The caller has a box named <code>score</code> holding 10.' },
    { line: 6, score: 10, frame: 1, points: 10, copy: 1, out: 0, note: 'The call. <code>addPoints</code> gets its own box, <code>points</code>, and the argument\'s value is <em>copied</em> into it. Nothing connects the two boxes.' },
    { line: 2, score: 10, frame: 1, points: 15, copy: 0, out: 0, note: 'The function adds 5 to its own box. <code>score</code> is not in reach, and it has no idea this happened.' },
    { line: 3, score: 10, frame: 0, points: 15, copy: 0, out: 0, note: 'The function ends. Its box, with the 15 in it, is thrown away.' },
    { line: 7, score: 10, frame: 0, points: 15, copy: 0, out: 1, note: 'Back in the caller, <code>score</code> is still 10. The 5 points went into a box that no longer exists.' },
];

const STEP = 2.6;

export default defineScene({
    label: 'A function called addPoints receives a copy of the variable score. It adds 5 to its own copy, 10 becomes 15, and when the function ends the copy is discarded. The original score is still 10.',
    duration: STATES.length * STEP,
    height: 300,
    beats: STATES.map((s, i) => ({ at: i * STEP, text: s.note })),
    build({ draw }) {
        const highlight = codePanel(draw, CODE);

        const bucket = (x: number, y: number, label: string, tint: string, below = false) => {
            const tag = draw.text(label, x + 40, below ? y + 62 : y - 9, { mono: true, size: 13, color: color.dim, anchor: 'middle' });
            const box = draw.rect(x, y, 80, 44, { color: tint, width: 1.5 });
            const value = draw.text('', x + 40, y + 29, { mono: true, size: 18, anchor: 'middle', color: color.value });
            return { box, value, tag };
        };

        draw.text('the caller', 400, 44, { size: 13, color: color.dim });
        const score = bucket(400, 76, 'score', color.dim);

        const frame = draw.rect(376, 148, 200, 140, { color: color.focus, width: 1.5, dash: '6 5' });
        const frameLabel = draw.text('inside addPoints', 388, 276, { size: 13, color: color.focus });
        const points = bucket(400, 184, 'points', color.dim, true);

        const copy = draw.arrow(440, 124, 440, 180, { color: color.focus, width: 1.75 });
        const copyLabel = draw.text('copy', 452, 142, { size: 13, color: color.focus });

        const out = draw.text('prints 10, not 15', 500, 106, { size: 14, color: color.error });

        const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

        return ({ t }) => {
            const index = Math.min(STATES.length - 1, Math.floor(t / STEP));
            const s = STATES[index];
            const prev = STATES[Math.max(0, index - 1)];
            const within = Math.min(1, (t - index * STEP) / (STEP * 0.3));
            const k = 1 - Math.pow(1 - within, 3);

            highlight(s.line);
            score.value.text(s.score);

            // A box that just left shows its last value while it fades
            const frameOn = lerp(prev.frame, s.frame, k);
            frame.opacity(frameOn);
            frameLabel.opacity(frameOn);
            points.box.opacity(frameOn);
            points.tag.opacity(frameOn);
            points.value.text(s.frame ? s.points : prev.points).opacity(frameOn);

            const copyOn = lerp(prev.copy, s.copy, k);
            copy.opacity(copyOn);
            copyLabel.opacity(copyOn);
            out.opacity(lerp(prev.out, s.out, k));
        };
    },
});
