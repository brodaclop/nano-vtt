
type State = 'text' | 'star' | 'double-star';

export const markdownFormat = (text: string): Array<Node> => {
    let bold = false;
    let italic = false;
    let state: State = 'text';
    const ret: Array<Node> = [];
    let buffer: string = '';
    [...text].forEach(char => {
        if (char === '*') {
            switch (state) {
                case 'text': {
                    state = 'star';
                    if (buffer.length > 0) {
                        ret.push(new Text(buffer));
                        buffer = '';
                    }
                    break;
                }
                case 'star': state = 'double-star'; break;
                case 'double-star': {
                }
            }
        }
    }
    );
    return ret;
}