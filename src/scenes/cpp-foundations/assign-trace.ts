import { defineCodeScene } from '@kit/code-scene';

export default defineCodeScene({
    label: 'Seven lines of C++ declaring, assigning and copying int variables, with each variable shown in its own box as the lines run',
    code: `
int score = 10;
int bonus = 5;

score = score + bonus;
bonus = 0;
int saved = score;
score = 99;
`,
    steps: [
        { line: 1, vars: { score: 10 }, note: 'A declaration creates a box named <code>score</code>. The <code>= 10</code> fills it at that moment, which is initialization.' },
        { line: 2, vars: { bonus: 5 }, note: 'A second box, a second name.' },
        { line: 4, vars: { score: 15 }, note: 'No type this time, so no new box. The right side runs first: read both boxes, add, and write the answer into <code>score</code>. The 10 is gone.' },
        { line: 5, vars: { bonus: 0 }, note: 'Assignment overwrites. <code>bonus</code> had a 5, and now it does not.' },
        { line: 6, vars: { saved: 15 }, note: '<code>saved</code> is declared and filled with a copy of what <code>score</code> holds right now.' },
        { line: 7, vars: { score: 99 }, note: '<code>score</code> changes, and <code>saved</code> does not. Copying a value never links two boxes.' },
    ],
});
