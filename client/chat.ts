import { UI } from "./dom";
import { random } from "./random";
import { MY_USER_ID, USERS } from "./room";
import { sendChatMessage, sendTypingMessage } from "./messages";
import { Interpolation } from "./interpolation";

const messages: Array<ChatMessage & { elem?: HTMLElement }> = [];
const typing: Set<number> = new Set();

export interface ChatMessage {
    id: number;
    sender: number;
    text: string;
}

export const initChat = () => {
    UI.chat.input.oninput = () => {
        const empty = !UI.chat.input.value;
        UI.chat.sendButton.disabled = empty;
        sendTypingMessage(empty ? 'end' : 'start');
    }

    UI.chat.sendButton.disabled = !UI.chat.input.value;

    UI.chat.input.onkeydown = e => {
        e.stopPropagation();
    }

    UI.chat.form.onsubmit = (event) => {
        const text = Interpolation.perform(UI.chat.input.value);
        const message = { id: random(), sender: MY_USER_ID, text };
        addChatMessage(message);
        sendChatMessage(message);
        UI.chat.input.value = '';
        UI.chat.input.dispatchEvent(new Event('input'));
        event.preventDefault();
    }
}

export const addChatMessage = async (message: ChatMessage) => {
    if (messages.some(m => m.id === message.id)) {
        return;
    }
    messages.push(message);
    drawChat();
}

export const startedTyping = (user: number) => {
    typing.add(user);
    drawChat();
}

export const stoppedTyping = (user: number) => {
    typing.delete(user);
    drawChat();
}

export const drawChat = () => {
    messages.forEach((message, idx) => {
        if (!message.elem) {
            message.elem = document.createElement('li');
            const userSpan = document.createElement('span');
            userSpan.className = 'sender';
            message.elem.appendChild(userSpan);
            const messageSpan = document.createElement('span');
            messageSpan.className = 'text';
            message.elem.appendChild(messageSpan);
            if (idx === 0) {
                UI.chat.box.prepend(message.elem);
            } else {
                messages[idx - 1].elem?.after(message.elem);
            }
        }
        const [userSpan, messageSpan] = [...message.elem.children] as Array<HTMLElement>;
        userSpan.innerText = (message.sender !== MY_USER_ID) ? USERS[message.sender] : '';
        messageSpan.innerText = message.text;
        const color = message.sender & 7;
        message.elem.className = (message.sender === MY_USER_ID) ? 'own' : `other c${color}`;
    });
    const typers = typing.size < 3 ? [...typing].map(user => USERS[user]).join(', ') : 'Several people';
    UI.chat.typing.innerText = typers.length > 0 ? `${typers} typing...` : '';
    UI.chat.box.scrollTo({
        top: UI.chat.box.scrollHeight,
        behavior: 'smooth'
    });
}


