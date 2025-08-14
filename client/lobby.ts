import { UI } from "./dom";
import { joinRoom } from "./room";

export const initLobby = () => {
    const dialog = document.getElementById('join-dialog') as HTMLDialogElement;
    const button = dialog.querySelector('button') as HTMLButtonElement;
    const room = document.getElementById('join-room') as HTMLInputElement;
    const name = document.getElementById('join-name') as HTMLInputElement;
    dialog.showModal();

    UI.disableIfEmpty(button, room, name);

    button.onclick = () => {
        joinRoom(room.value, name.value);

        dialog.close();
    }

}