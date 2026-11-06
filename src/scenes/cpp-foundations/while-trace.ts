import { defineCodeScene } from '@kit/code-scene';

export default defineCodeScene({
    label: 'A while loop halving a value until it is 10 or less, one line at a time, with each variable shown in its own box and a count of how many times the body ran',
    code: `
int value = 100;
int count = 0;

while(value > 10) {
    value = value / 2;
    count++;
}
`,
    steps: [
        { line: 1, vars: { value: 100 }, note: 'Start with 100.' },
        { line: 2, vars: { count: 0 }, note: '<code>count</code> will track how many times the body runs.' },
        { line: 4, note: 'Is 100 greater than 10? Yes, so the body runs.' },
        { line: 5, vars: { value: 50 } },
        { line: 6, vars: { count: 1 }, note: 'Last line of the body. The CPU jumps back up to the test.' },
        { line: 4, note: 'Is 50 greater than 10? Yes.' },
        { line: 5, vars: { value: 25 } },
        { line: 6, vars: { count: 2 } },
        { line: 4, note: 'Is 25 greater than 10? Yes.' },
        { line: 5, vars: { value: 12 }, note: '25 / 2 is 12, because both are integers. Integer division drops the half.' },
        { line: 6, vars: { count: 3 } },
        { line: 4, note: 'Is 12 greater than 10? Yes, one more time.' },
        { line: 5, vars: { value: 6 } },
        { line: 6, vars: { count: 4 } },
        { line: 4, note: 'Is 6 greater than 10? No. The loop ends, and nothing in the code said "4 times" ahead of time.' },
    ],
});
