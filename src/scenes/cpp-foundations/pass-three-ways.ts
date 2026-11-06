import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';
import { curvedArrow } from './lib/curved-arrow';
import { lerp, stepAt } from './lib/steps';

const COLS = [
    { title: 'by value', lines: ['void addPoints(int points) {', '    points = points + 5;', '}', 'addPoints(score);'] },
    { title: 'by pointer', lines: ['void addPoints(int* points) {', '    *points = *points + 5;', '}', 'addPoints(&score);'] },
    { title: 'by reference', lines: ['void addPoints(int& points) {', '    points = points + 5;', '}', 'addPoints(score);'] },
];

// score after each step, and what the parameter holds, per column. A null parameter means no box.
interface State {
    score: number[];
    param: (string | number | null)[];
    note: string;
}

const STATES: State[] = [
    { score: [10, 10, 10], param: [null, null, null], note: 'The same call three ways, starting with <code>score</code> at 10 in the caller.' },
    { score: [10, 10, 10], param: [10, 100, 'alias'], note: 'The call. By value copies the 10 into a new box. By pointer, the new box holds the <em>address</em> of <code>score</code>. By reference there is no new box: <code>points</code> is another name for <code>score</code>.' },
    { score: [10, 15, 15], param: [15, 100, 'alias'], note: 'The function adds 5. The copy went to 15 and <code>score</code> stayed put. The other two reached the real box and <code>score</code> is 15.' },
    { score: [10, 15, 15], param: [null, null, null], note: 'The call ends and the parameter is gone. Only the two that reached the caller\'s box left a change behind.' },
];

const STEP = 3.4;
const COL_W = 236;
const LEFT = 8;
const SCORE_Y = 156;
const PARAM_Y = 240;

export default defineScene({
    label: 'Three columns call the same addPoints function on a score of 10. With pass by value the function changes only a copy, so score stays 10. With pass by pointer the function receives the address of score and writes through it, so score becomes 15. With pass by reference the parameter is another name for score, so score becomes 15.',
    duration: STATES.length * STEP,
    width: 720,
    height: 320,
    beats: STATES.map((s, i) => ({ at: i * STEP, text: s.note })),
    build({ draw }) {
        const cols = COLS.map((col, c) => {
            const x = LEFT + c * COL_W;
            draw.text(col.title, x, 24, { size: 14, color: color.focus });
            col.lines.forEach((line, i) => {
                const row = draw.text(line, x, 50 + i * 20, { mono: true, size: 11.5, color: i === 3 ? color.ink : color.dim });
                row.el.setAttribute('xml:space', 'preserve');
                row.el.style.whiteSpace = 'pre';
            });

            const bx = x + 60;
            draw.text('score', bx - 8, SCORE_Y + 29, { mono: true, size: 12.5, anchor: 'end', color: color.dim });
            const score = draw.rect(bx, SCORE_Y, 90, 42, { color: color.dim, width: 1.5 });
            draw.text('100', bx - 8, SCORE_Y + 43, { mono: true, size: 10.5, anchor: 'end', color: color.faint });
            const scoreValue = draw.text('', bx + 45, SCORE_Y + 28, { mono: true, size: 17, anchor: 'middle', color: color.value });

            // A parameter box for the copy and the pointer, a label hung under score for the reference
            const box = draw.rect(bx, PARAM_Y, 90, 42, { color: color.dim, width: 1.5 });
            const boxName = draw.text('points', bx - 8, PARAM_Y + 27, { mono: true, size: 12.5, anchor: 'end', color: color.dim });
            const boxValue = draw.text('', bx + 45, PARAM_Y + 28, { mono: true, size: 17, anchor: 'middle', color: color.value });
            const arrow = curvedArrow(draw, 52);
            const tie = draw.line(bx + 45, SCORE_Y + 42, bx + 45, SCORE_Y + 56, { color: color.focus, width: 1.5 });
            const aliasName = draw.text('points', bx + 45, SCORE_Y + 72, { mono: true, size: 12.5, anchor: 'middle', color: color.focus });

            return { x: bx, score, scoreValue, box, boxName, boxValue, arrow, tie, aliasName };
        });

        return ({ t }) => {
            const { s, prev, k } = stepAt(STATES, STEP, t);

            cols.forEach((col, c) => {
                const was = prev.param[c];
                const now = s.param[c];
                const isAlias = c === 2;
                const boxOn = !isAlias ? lerp(was === null ? 0 : 1, now === null ? 0 : 1, k) : 0;
                const aliasOn = isAlias ? lerp(was === null ? 0 : 1, now === null ? 0 : 1, k) : 0;
                const shown = now ?? was;

                col.scoreValue.text(s.score[c]);
                col.score.set({ stroke: c > 0 && s.score[c] !== prev.score[c] && k < 1 ? color.focus : color.dim });

                col.box.opacity(boxOn);
                col.boxName.opacity(boxOn);
                col.boxValue.text(shown ?? '').opacity(boxOn);

                col.tie.opacity(aliasOn);
                col.aliasName.opacity(aliasOn);

                // Only the pointer column draws an arrow
                const arrowOn = c === 1 ? boxOn : 0;
                col.arrow(col.x + 90, PARAM_Y + 21, col.x + 90, SCORE_Y + 21, arrowOn);
            });
        };
    },
});
