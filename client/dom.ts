export const UI = {
    canvas: document.querySelector('.canvas')!,
    chat: {
        box: document.querySelector('.chat .messages')!,
        input: document.querySelector('.chat input')! as HTMLInputElement,
        form: document.querySelector('.chat form')! as HTMLFormElement,
        sendButton: document.querySelector('.chat .send')! as HTMLButtonElement,
    },
    menu: {
        room: document.querySelector('.menu .room')! as HTMLElement,
        name: document.querySelector('.menu .name')! as HTMLElement,
        connection: document.querySelector('.menu .connection')! as HTMLElement,
        syncButton: document.querySelector('.menu button.sync')! as HTMLButtonElement,
    },
    lobby: {
        dialog: document.querySelector('.join')! as HTMLDialogElement,
        form: document.querySelector('.join form')! as HTMLFormElement,
        button: document.querySelector('.join button')! as HTMLButtonElement,
        room: document.querySelector('.join .room input') as HTMLInputElement,
        name: document.querySelector('.join .name input') as HTMLInputElement,
    },
    disableIfEmpty: (button: HTMLButtonElement, ...inputs: Array<HTMLInputElement>) => {
        const fn = () => button.disabled = inputs.some(input => !input.value)
        inputs.forEach(input => input.oninput = fn);
        fn();
    }
} as const;

