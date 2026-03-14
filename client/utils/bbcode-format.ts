type Token = {
    type: 'text' | 'markup',
    content: string;
}

const TAGS = ['b', 'i'];

const ELEMENTS = {
    b: 'strong',
    i: 'em'
} as Record<string, string>;

const tokenize = (text: string): Array<Token> => {
    let currentToken: Token = { type: 'text', content: '' };
    const ret: Array<Token> = [];
    [...text].forEach(char => {
        if (currentToken.type === 'text') {
            if (char === '[') {
                if (currentToken.content.length > 0) {
                    ret.push(currentToken);
                }
                currentToken = { type: 'markup', content: '' };
            } else {
                currentToken.content += char
            }
        } else {
            if (char === ']') {
                ret.push(currentToken);
                currentToken = { type: 'text', content: '' };
            } else {
                currentToken.content += char
            }
        }
    });
    ret.push(currentToken);
    return ret;
}

export const formatTokens = (tokens: Array<Token>, parent: HTMLElement): void => {
    let currentElement: HTMLElement = parent;
    while (tokens.length > 0) {
        const token = tokens.shift()!;
        if (token.type === 'text') {
            currentElement.appendChild(document.createTextNode(token.content));
        } else {
            if (TAGS.includes(token.content)) {
                const end = tokens.findIndex(t => t.type === 'markup' && t.content === `/${token.content}`);
                if (end === -1) {
                    currentElement.appendChild(new Text(`[${token.content}]`));
                } else {
                    let nested = tokens.slice(0, end); // we skip the end token
                    tokens = tokens.slice(end + 1);
                    const elem = document.createElement(ELEMENTS[token.content])
                    currentElement.appendChild(elem);
                    formatTokens(nested, elem);
                }
            } else {
                currentElement.appendChild(new Text(`[${token.content}]`));
            }
        }
    }
}

export const bbCodeFormat = (text: string, parent: HTMLElement): void => {
    let tokens = tokenize(text);
    formatTokens(tokenize(text), parent);
}