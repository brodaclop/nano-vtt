export const UI = {
    canvas: document.getElementById('canvas')!,
    chat: {
        box: document.getElementById('chat-messages')!,
        input: document.getElementById('message-input')! as HTMLInputElement,
        sendButton: document.getElementById('send-message')! as HTMLButtonElement,
    },
    connection: document.getElementById('connection')!,
    disableIfEmpty: (button: HTMLButtonElement, ...inputs: Array<HTMLInputElement>) => {
        const fn = () => button.disabled = inputs.some(input => !input.value)
        inputs.forEach(input => input.oninput = fn);
        fn();
    }
} as const;

