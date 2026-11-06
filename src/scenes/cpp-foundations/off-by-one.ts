import { defineCodeScene } from '@kit/code-scene';

export default defineCodeScene({
    label: 'A for loop that uses i <= 3 on an array with three elements. On its fourth pass it reads speeds[3], which is not part of the array, and the total comes out wrong',
    code: `
int speeds[3] = {50, 80, 100};
int total = 0;

for(int i = 0; i <= 3; i++) {
    total += speeds[i];
}
`,
    steps: [
        { line: 1, vars: { 'speeds[0]': 50, 'speeds[1]': 80, 'speeds[2]': 100 }, note: 'Three elements, so the valid indexes are 0, 1 and 2.' },
        { line: 2, vars: { total: 0 }, note: '<code>total</code> starts at zero.' },
        { line: 4, vars: { i: 0 }, note: 'This time the test is <code>i &lt;= 3</code>. 0 is less than or equal to 3, so the body runs.' },
        { line: 5, vars: { total: 50 }, note: '<code>speeds[0]</code> is added.' },
        { line: 4, vars: { i: 1 }, note: '1 is less than or equal to 3.' },
        { line: 5, vars: { total: 130 }, note: '<code>speeds[1]</code> is added.' },
        { line: 4, vars: { i: 2 }, note: '2 is less than or equal to 3.' },
        { line: 5, vars: { total: 230 }, note: 'All three elements are added, and 230 is already the right answer.' },
        { line: 4, vars: { i: 3 }, note: 'Is 3 less than or equal to 3? Yes. The loop runs a fourth time.' },
        { line: 5, vars: { 'speeds[3]': '?', total: '?' }, wrong: ['speeds[3]', 'total'], note: '<code>speeds[3]</code> is past the end. It is whatever bytes sit there, so <code>total</code> is now garbage.' },
        { line: 4, vars: { i: 4 }, note: 'Nothing complained. Now 4 is not less than or equal to 3, and the loop ends with a wrong total.' },
    ],
});
