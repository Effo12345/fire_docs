import { defineScene } from '@kit/scene';
import { textAt } from '@kit/timeline';
import { color } from '@kit/palette';

// Each stage is the expression so far, and the part about to be worked out
const STAGES: { at: number; text: string; start: number; len: number }[] = [
    { at: 0, text: '10 + 4 * 3 - 8 / 2', start: 5, len: 5 },
    { at: 3, text: '10 + 12 - 8 / 2', start: 10, len: 5 },
    { at: 6, text: '10 + 12 - 4', start: 0, len: 7 },
    { at: 9, text: '22 - 4', start: 0, len: 6 },
    { at: 12, text: '18', start: 0, len: 0 },
];

export default defineScene({
    label: 'An arithmetic expression is worked out step by step: multiplication and division first, then addition and subtraction from left to right, ending at 18',
    height: 250,
    duration: 15,
    beats: [
        { at: 0, text: 'Here is an <em>expression</em>. Reading left to right would start with 10 + 4, but <code>*</code> and <code>/</code> rank higher than <code>+</code> and <code>-</code>. The first one up is <code>4 * 3</code>.' },
        { at: 3, text: '<code>4 * 3</code> became 12. Next in rank is <code>8 / 2</code>.' },
        { at: 6, text: 'Only <code>+</code> and <code>-</code> are left, and they have equal rank, so they run left to right. 10 + 12 first.' },
        { at: 9, text: 'Then 22 - 4.' },
        { at: 12, text: 'Every expression ends as one value. Add parentheses, like <code>(10 + 4) * 3</code>, and the order changes completely.' },
    ],
    build({ draw }) {
        const mid = 360;
        const y = 110;
        const band = draw.rect(0, y - 34, 10, 50, { fill: 'rgba(244, 211, 94, 0.14)' });
        const line = draw.text('', mid, y, { mono: true, size: 30, anchor: 'start' });
        const label = draw.text('', mid, y + 62, { color: color.dim, size: 14, anchor: 'middle' });

        return ({ t }) => {
            const stage = [...STAGES].reverse().find((s) => s.at <= t + 1e-6) ?? STAGES[0];
            line.text(stage.text);
            const total = line.el.getComputedTextLength();
            const x0 = mid - total / 2;
            line.at(x0, y);

            const done = stage.len === 0;
            line.set({ fill: done ? color.target : color.ink });
            band.show(!done);
            if(!done) {
                const left = line.el.getStartPositionOfChar(stage.start).x;
                const width = line.el.getSubStringLength(stage.start, stage.len);
                band.set({ x: left - 4, width: width + 8 });
            }

            label.at(mid, y + 62).text(textAt(t, [[0, 'work out the highlighted part next'], [12, 'the value of the expression']]));
        };
    },
});
