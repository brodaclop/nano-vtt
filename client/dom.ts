
export const UI = {
    canvasContainer: document.querySelector('.canvas')!,
    canvas: document.querySelector('.canvas canvas')! as HTMLCanvasElement,
    sidebar: document.querySelector('#sidebar')! as HTMLElement,
    plugin: {
        main: document.querySelector('#plugin')! as HTMLElement,
        close: document.querySelector('#plugin .close')! as HTMLButtonElement,
    },
    chat: {
        main: document.querySelector('#chat')! as HTMLElement,
        close: document.querySelector('#chat .close')! as HTMLButtonElement,
        container: document.querySelector('#chat .container')! as HTMLElement,
        box: document.querySelector('#chat .messages')! as HTMLElement,
        input: document.querySelector('#chat input')! as HTMLInputElement,
        form: document.querySelector('#chat form')! as HTMLFormElement,
        sendButton: document.querySelector('#chat .send')! as HTMLButtonElement,
        typing: document.querySelector('#chat #typing')! as HTMLElement,
        userList: document.querySelector('#chat .participants .list')! as HTMLElement,
    },
    menu: {
        container: document.querySelector('.menu')! as HTMLElement,
        room: document.querySelector('.menu .room')! as HTMLElement,
        name: document.querySelector('.menu .name')! as HTMLElement,
        openchat: document.querySelector('.menu #openchat')! as HTMLElement,
        openplugin: document.querySelector('.menu #openplugin')! as HTMLButtonElement,
        connection: document.querySelector('.menu .connection')! as HTMLElement,
        connected: document.querySelector('.menu .connected')! as HTMLElement,
        syncButton: document.querySelector('.menu button.sync')! as HTMLButtonElement,
        gridSize: document.querySelector('.menu #grid-size')! as HTMLInputElement,
        gridStrength: document.querySelector('.menu #grid-strength')! as HTMLInputElement,
        editFog: document.querySelector('.menu #edit-fog')! as HTMLButtonElement,
        fogControls: document.querySelector('.menu #fog-controls')! as HTMLInputElement,
        fogSize: document.querySelector('.menu #fog-size')! as HTMLInputElement,
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
        inputs.forEach(input => input.addEventListener('input', fn));
        fn();
    },
    stopEvent: (e: Event) => e.stopPropagation(),
    bindInputValue: <T extends string | number>(input: HTMLInputElement, initialValue: T): { value: T } => {
        let _value = initialValue;
        input.value = String(_value);
        const ret = {
            set value(v: T) {
                _value = v;
                input.value = String(v);
            },
            get value() {
                return _value;
            }
        }
        input.oninput = e => {
            _value = (typeof initialValue === 'number' ? Number(input.value) : input.value) as T;
        }
        return ret;
    }
} as const;
