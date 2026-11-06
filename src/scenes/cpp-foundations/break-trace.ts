import { defineCodeScene } from '@kit/code-scene';

export default defineCodeScene({
    label: 'A for loop searching an array for the first value above 80. It stops with break at index 2 and never looks at the last element',
    code: `
int speeds[4] = {40, 55, 90, 70};
int found = -1;

for(int i = 0; i < 4; i++) {
    if(speeds[i] > 80) {
        found = i;
        break;
    }
}
`,
    steps: [
        { line: 1, vars: { 'speeds[0]': 40, 'speeds[1]': 55, 'speeds[2]': 90, 'speeds[3]': 70 }, note: 'Looking for the first speed above 80.' },
        { line: 2, vars: { found: -1 }, note: '-1 means "not found yet". It is not a valid index, so it can\'t be mistaken for one.' },
        { line: 4, vars: { i: 0 } },
        { line: 5, note: 'Is 40 above 80? No.' },
        { line: 4, vars: { i: 1 } },
        { line: 5, note: 'Is 55 above 80? No.' },
        { line: 4, vars: { i: 2 } },
        { line: 5, note: 'Is 90 above 80? Yes.' },
        { line: 6, vars: { found: 2 } },
        { line: 7, note: '<code>break</code> leaves the loop immediately. The <code>i++</code> never runs, and <code>speeds[3]</code> is never looked at.' },
    ],
});
