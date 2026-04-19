
const MEZOLIT_DICE_PATTERN = /\b(\d+)D\b/g;
const CLASSIC_DICE_PATTERN = /(?<count>\d+)?d(?<dice>\d+)(?<mod>[+-]\d+)?/g;

const rollSuccessDice = (num: number): string => {
    let total: number = 0;
    let rolls: Array<number> = [];
    for (let i = 0; i < num; i++) {
        const roll = Math.floor(Math.random() * 6) + 1;
        if (roll === 6) {
            total += 2;
        }
        if (roll === 5) {
            total += 1;
        }
        rolls.push(roll);
    }
    return rolls.map(roll => `${roll > 4 ? '[mark]' : ''}${roll}${roll > 4 ? '[/mark]' : ''}`).join(' ') + ' = ' + total;
}

const rollNormalDice = (count: string | undefined, dice: string, mod?: string) =>
    Array(Number(count ?? 1)).fill(undefined).reduce(((acc, curr) => acc + (Math.floor(Math.random() * Number(dice)) + 1)), Number(mod ?? 0));

export const Interpolation = {
    perform: (message: string): string => {
        let output = message.replaceAll(MEZOLIT_DICE_PATTERN, (match, num) => `[roll][i]${match}[/i] = ${rollSuccessDice(num)}[/roll]`);
        output = output.replaceAll(CLASSIC_DICE_PATTERN, (match, count, dice, mod) => `[roll][i]${match}[/i] = ${rollNormalDice(count, dice, mod)}[/roll]`);
        return output;
    }
}

