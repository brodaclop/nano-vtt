
const DICE_PATTERN = /\b(\d+)D\b/g;
const CLASSIC_DICE_PATTERN = /(?<count>\d+)?d(?<dice>\d+)(?<mod>[+-]\d+)?/g;

const rollSuccessDice = (num: number): number => {
    let total: number = 0;
    for (let i = 0; i < num; i++) {
        const roll = Math.floor(Math.random() * 6) + 1;
        if (roll === 6) {
            total += 2;
        }
        if (roll === 5) {
            total += 1;
        }
    }
    return total;
}

const rollNormalDice = (count: string | undefined, dice: string, mod?: string) =>
    Array(Number(count ?? 1)).fill(undefined).reduce(((acc, curr) => acc + (Math.floor(Math.random() * Number(dice)) + 1)), Number(mod ?? 0));

export const Interpolation = {

    perform: (message: string): string => {
        let output = message.replaceAll(DICE_PATTERN, (match, num) => `${match} = ${rollSuccessDice(num)}`);
        output = output.replaceAll(CLASSIC_DICE_PATTERN, (match, count, dice, mod) => `${match} = ${rollNormalDice(count, dice, mod)}`);
        return output;
    }
}

