import { UI } from "./dom";
import { random } from "./random";
import { Interpolation } from "./interpolation";
import { ChatMessage } from "./types/map-objects";
import { Room } from "./room";
import { Send } from "./messages";

const messages: Array<ChatMessage & { elem?: HTMLElement }> = [];
const typing: Set<number> = new Set();



export const initChat = () => {
    UI.chat.input.oninput = () => {
        const empty = !UI.chat.input.value;
        UI.chat.sendButton.disabled = empty;
        Send.typing(empty ? 'end' : 'start', Room.me);
    }

    UI.chat.sendButton.disabled = !UI.chat.input.value;

    UI.chat.input.onkeydown = e => {
        e.stopPropagation();
    }

    UI.chat.form.onsubmit = (event) => {
        const text = Interpolation.perform(UI.chat.input.value);
        const message = { id: random(), sender: Room.me, text };
        addChatMessage(message);
        Send.chat(message);
        UI.chat.input.value = '';
        UI.chat.input.dispatchEvent(new Event('input'));
        event.preventDefault();
    }
}

const addChatMessage = async (message: ChatMessage) => {
    if (messages.some(m => m.id === message.id)) {
        return;
    }
    messages.push(message);
    drawChat();
}


export const Chat = {
    incomingTyping: ({ user, action }: { user: number, action: 'start' | 'end' }) => {
        if (action === 'start') {
            typing.add(user);
        } else {
            typing.delete(user);
        }
        drawChat();
    },
    incomingChatMessage: addChatMessage
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
        userSpan.innerText = (message.sender !== Room.me) ? Room.userName(message.sender) : '';
        messageSpan.innerText = message.text;
        const color = message.sender & 7;
        message.elem.className = (message.sender === Room.me) ? 'own' : `other c${color}`;
    });
    const typers = typing.size < 3 ? [...typing].map(user => Room.userName(user)).join(', ') : 'Several people';
    UI.chat.typing.innerText = typers.length > 0 ? `${typers} typing...` : '';
    UI.chat.box.scrollTo({
        top: UI.chat.box.scrollHeight,
        behavior: 'smooth'
    });
}


