import { defineCodeScene } from '@kit/code-scene';

export default defineCodeScene({
    label: 'A for loop adding up an array, one line at a time, with each variable shown in its own box',
    code: `
int speeds[3] = {50, 80, 100};
int total = 0;

for(int i = 0; i < 3; i++) {
    total = total + speeds[i];
}
`,
    steps: [
        { line: 1, vars: { 'speeds[0]': 50, 'speeds[1]': 80, 'speeds[2]': 100 }, note: 'The array is three boxes side by side, numbered from 0.' },
        { line: 2, vars: { total: 0 }, note: '<code>total</code> starts at zero.' },
        { line: 4, vars: { i: 0 }, note: 'The loop creates <code>i</code> and sets it to 0. Is 0 less than 3? Yes, so the body runs.' },
        { line: 5, vars: { total: 50 }, note: '<code>speeds[0]</code> is 50, so <code>total</code> becomes 0 + 50.' },
        { line: 4, vars: { i: 1 }, note: 'Back to the top. <code>i++</code> makes <code>i</code> 1. Still less than 3.' },
        { line: 5, vars: { total: 130 }, note: 'The same line runs again, but now <code>speeds[i]</code> means <code>speeds[1]</code>.' },
        { line: 4, vars: { i: 2 }, note: '<code>i</code> becomes 2. Still less than 3.' },
        { line: 5, vars: { total: 230 }, note: '<code>total</code> becomes 130 + 100.' },
        { line: 4, vars: { i: 3 }, note: '<code>i</code> becomes 3. Is 3 less than 3? No, so the loop is over.' },
    ],
});
