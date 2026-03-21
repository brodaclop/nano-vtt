import { UI } from "./dom";
import { random } from "./utils/random";
import { Interpolation } from "./utils/interpolation";
import { ChatMessage } from "./types/map-objects";
import { Room } from "./room";
import { Send } from "./messages";
import { Events } from "./events";
import { bbCodeFormat } from "./utils/bbcode-format";

const messages: Array<ChatMessage & { elem?: HTMLElement }> = [];
const typing: Set<number> = new Set();

UI.disableIfEmpty(UI.chat.sendButton, UI.chat.input);

UI.chat.input.addEventListener('input', () => {
    Send.typing(UI.chat.input.value ? 'start' : 'end', Room.me);
});


UI.chat.input.addEventListener('keydown', UI.stopEvent);

UI.chat.form.addEventListener('submit', (event) => {
    const text = Interpolation.perform(UI.chat.input.value);
    const message = { id: random(), sender: Room.me, text };
    addChatMessage(message);
    Send.chat(message);
    UI.chat.input.value = '';
    UI.chat.input.dispatchEvent(new Event('input'));
    event.preventDefault();
});


const draw = () => {
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
            userSpan.innerText = (message.sender !== Room.me) ? Room.userName(message.sender) : '';
            bbCodeFormat(message.text, messageSpan);
            const color = message.sender & 7;
            message.elem.className = (message.sender === Room.me) ? 'own' : `other c${color}`;
        }
    });
    const typers = typing.size < 3 ? [...typing].map(user => Room.userName(user)).join(', ') : 'Several people';
    UI.chat.typing.innerText = typers.length > 0 ? `${typers} typing...` : '';
    UI.chat.box.scrollTo({
        top: UI.chat.box.scrollHeight,
        behavior: 'smooth'
    });
}

const addChatMessage = async (message: ChatMessage) => {
    if (messages.some(m => m.id === message.id)) {
        return;
    }
    messages.push(message);
    draw();
}

Events.register('room-changed', users => {
    UI.chat.userList.innerText = users.map(u => `${Room.userName(u)}${u === Room.me ? ' (you)' : ''}`).join(', ')
});

Events.register('chat-received', addChatMessage);
Events.register('typing-received', ({ user, action }: { user: number, action: 'start' | 'end' }) => {
    if (action === 'start') {
        typing.add(user);
    } else {
        typing.delete(user);
    }
    draw();
});

console.log('Listening to messages');

window.addEventListener("message", (event) => {
    console.log('CHAT FROM IFRAME', event);
    const text = Interpolation.perform(String(event.data));
    const message = { id: random(), sender: Room.me, text };
    addChatMessage(message);

});


