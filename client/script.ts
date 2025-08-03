import { MapObject } from "./types/map-objects";
import { Message } from "./types/messages";

interface ScreenElement {
    node: HTMLElement;
    selected: boolean;
}

(() => {
    const canvas = document.getElementById('canvas')!;

    let objects: Array<MapObject> = [
        {
            id: 'bmp-1',
            type: 'bitmap',
            url: '/assets/hands.jpg',
            x: 400,
            y: 400,
            zoom: 1,
            angle: 0
        }
    ];



    const screenObjects: Record<string, ScreenElement> = {};

    const ensureElement = (id: string): ScreenElement => {
        if (!screenObjects[id]) {
            const node = document.createElement("img");
            canvas?.appendChild(node);
            screenObjects[id] = {
                selected: false,
                node
            }
        }
        return screenObjects[id];
    }

    let drag: { x: number, y: number } | undefined = undefined;

    const socket = new WebSocket("ws://localhost:3000/api");
    let socketOpen = false;

    socket.addEventListener("open", (event) => {
        console.log('socket opened');
        socketOpen = true;
    });

    socket.addEventListener('close', () => {
        console.log('socket closed');
        socketOpen = false;
    })

    // Listen for messages
    socket.addEventListener("message", (event) => {
        console.log("Message from server ", event.data);
        const message: Message = JSON.parse(event.data);
        if (message.type === 'set-object') {
            objects = objects.filter(ob => !message.remove.includes(ob.id));
            message.set.forEach(newOb => {
                const uIdx = objects.findIndex(ob => ob.id === newOb.id);
                if (uIdx !== -1) {
                    objects[uIdx] = { ...objects[uIdx], ...newOb };
                } else {
                    // TODO: check that every attribute is present
                    objects.push(newOb as MapObject);
                }
            })
        }
        draw();
    });

    const afterDrag = () => {
        if (socketOpen) {
            const message: Message = {
                type: 'set-object',
                remove: [],
                set: objects.filter(ob => screenObjects[ob.id].selected).map(ob => ({
                    id: ob.id,
                    x: ob.x,
                    y: ob.y
                }))
            };
            console.log('sending', message);
            socket.send(JSON.stringify(message));
        } else {
            console.log('socket not open yet');
        }
    }



    document.onmousemove = (e) => {

        if (e.buttons & 1) {
            console.log('dragging');
            const oldDrag = drag;
            drag = { x: e.clientX, y: e.clientY };
            if (oldDrag) {
                const delta = { x: drag.x - oldDrag.x, y: drag.y - oldDrag.y };
                objects.forEach(ob => {
                    if (screenObjects[ob.id].selected) {
                        ob.x += delta.x;
                        ob.y += delta.y;
                    }
                });
            }
            draw();
            e.preventDefault();
        }
    }

    document.onmouseup = (e) => {
        console.log('end drag');
        if (drag) {
            drag = undefined;
            e.preventDefault();
            e.stopPropagation();
            afterDrag();
            return false;
        }
    }

    document.ondragstart = e => {
        e.preventDefault();
    }

    const draw = () => {
        objects.forEach((ob) => {
            const { id, x, y, zoom, angle } = ob;
            const { url } = ob;
            const element = ensureElement(id);
            const node = element.node;
            (node as HTMLImageElement).src = url;

            node.style.position = 'absolute';
            node.style.left = '0';
            node.style.top = '0';
            node.style.display = 'inline-block';
            node.style.transform = `translate(${x}px, ${y}px) scale(${zoom}) rotate(${angle}deg)`;
            node.style.boxShadow = element.selected ? '0px 0px 7px 2px #E6F41D' : '';
            node.onmouseup = (e) => {
                if (!drag) {
                    element.selected = !element.selected;
                    draw();
                }
            };

        });
    }


    console.log('Script loaded', canvas);

    draw();

    // const animate = () => {
    //     objects.forEach(ob => {
    //         ob.angle++;
    //     })
    //     draw();
    //     requestAnimationFrame(animate);
    // }

    // animate();

})();

