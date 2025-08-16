import { UI } from "./dom";
import { joinRoom } from "./room";

export const initLobby = () => {
    UI.lobby.dialog.showModal();

    UI.disableIfEmpty(UI.lobby.button, UI.lobby.room, UI.lobby.name);

    UI.lobby.button.onclick = () => {
        joinRoom(UI.lobby.room.value, UI.lobby.name.value);

        UI.lobby.dialog.close();
    }

}