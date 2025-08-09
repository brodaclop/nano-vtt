import { random } from "./random";
import { CHAT_USER_ID, USERS } from "./room";
import { sendChatMessage } from "./websocket";

const messageBox = document.getElementById('chat-messages')!;
const input = document.getElementById('message-input')! as HTMLInputElement;
const sendButton = document.getElementById('send-message')! as HTMLButtonElement;



const messages: Array<ChatMessage & { elem?: HTMLElement }> = [];

export interface ChatMessage {
    id: number;
    sender: number;
    text: string;
}

export const initChat = () => {
    input.oninput = () => {
        sendButton.disabled = !input.value;
    }

    sendButton.disabled = !input.value;

    input.onkeydown = e => {
        e.stopPropagation();
    }

    sendButton.onclick = () => {
        const text = input.value;
        const message = { id: random(), sender: CHAT_USER_ID, text };
        addChatMessage(message);
        sendChatMessage(message);
        input.value = '';
        input.dispatchEvent(new Event('input'));
    }
}

export const addChatMessage = async (message: ChatMessage) => {
    if (messages.some(m => m.id === message.id)) {
        return;
    }
    messages.push(message);
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
                messageBox.prepend(message.elem);
            } else {
                messages[idx - 1].elem?.after(message.elem);
            }
        }
        const [userSpan, messageSpan] = [...message.elem.children] as Array<HTMLElement>;
        userSpan.innerText = (message.sender !== CHAT_USER_ID) ? USERS[message.sender] : '';
        messageSpan.innerText = message.text;
        message.elem.className = (message.sender === CHAT_USER_ID) ? 'own' : 'other';
    });
}


