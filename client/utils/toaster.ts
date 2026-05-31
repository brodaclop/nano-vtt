import { UI } from "../dom"

const container = UI.toasterContainer;

const displayToast = (type: 'warning' | 'error', message: string, delay: number) => {
    const elem = document.createElement('li');
    elem.innerText = message;
    container.appendChild(elem);
    requestAnimationFrame(() => {
        elem.className = type;
    });
    setTimeout(() => {
        elem.classList.add('fadeOut');
        setTimeout(() => elem.remove(), 1000);
    }, delay);
}

export const Toaster = {
    warn: (message: string) => displayToast('warning', message, 5000),
    error: (message: string) => displayToast('error', message, 5000),
}