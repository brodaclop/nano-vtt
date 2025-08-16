
const DICE_PATTERN = /\b(\d+)D\b/g;

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

export const Interpolation = {

    perform: (message: string): string => {
        const output = message.replaceAll(DICE_PATTERN, (match, num) => `${match} = ${rollSuccessDice(num)}`);
        return output;
    }
}

