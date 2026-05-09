const adjustHeight = () => document.querySelector('body').style.height = `${window.innerHeight}px`;

document.addEventListener('resize', adjustHeight);

adjustHeight();

const bind = (input, parent, property) => {
    const type = typeof parent[property];
    if (input.type === 'checkbox') {
        input.checked = Boolean(parent[property]);
    } else {
        input.value = parent[property];
    }
    input.addEventListener('change', () => {
        switch (type) {
            case 'number': parent[property] = Number(input.value); break;
            case 'boolean': parent[property] = input.checked; break;
            default: parent[property] = input.value; break;
        }
        save();
    });
}

const elem = (parent, name, value, setup) => {
    const ret = document.createElement(name);
    parent.appendChild(ret);
    if (typeof value === 'string') {
        ret.innerText = value;
    }
    setup?.(ret);
};

const input = (parent, type, ob, prop) => {
    elem(parent, 'input', null, input => {
        input.type = type;
        bind(input, ob, prop);
    })
}

const button = (parent, label, action) => {
    elem(parent, 'button', label, button => {
        button.addEventListener('click', action);
    })
}





const charString = localStorage.getItem('character');

const character = charString ? JSON.parse(charString) : {
    name: '',
    age: '',
    background: '',
    attributes: {
        Hunting: { max: 1, val: 1 },
        Making: { max: 1, val: 1 },
        Life: { max: 1, val: 1 },
        Cunning: { max: 1, val: 1 },
        Song: { max: 1, val: 1 },
        Anima: { max: 1, val: 1 }
    },
    description: '',
    notes: '',
    items: [],
    songs: [],
    tattoos: [],
};

const save = () => localStorage.setItem('character', JSON.stringify(character));

save();

const populateTextSection = (title) => {
    const field = title.toLowerCase();

    const tbody = document.querySelector(`#section-${title} tbody`);

    elem(tbody, 'tr', null, tr => {
        elem(tr, 'td', null, td => {
            elem(td, 'textarea', character[field], text => {
                bind(text, character, field);
            });
        });
    });
};

const populateCharacter = () => {
    const tbody = document.querySelector('#section-Character tbody');
    ['Name', 'Age', 'Background'].forEach(label => elem(tbody, 'tr', null, tr => {
        elem(tr, 'th', label);
        elem(tr, 'td', null, td => {
            td.colSpan = 2;
            input(td, 'text', character, label.toLowerCase());
        })
    }));


    Object.entries(character.attributes).forEach(([name, value]) => {
        elem(tbody, 'tr', null, tr => {
            elem(tr, 'th', name);
            elem(tr, 'td', null, td => {
                input(td, 'number', value, 'val');
                td.appendChild(document.createTextNode('/'));
                input(td, 'number', value, 'max');
            });
            elem(tr, 'td', null, td => {
                button(td, 'Roll', () => {
                    window.parent?.postMessage(`${name} check: ${value.val}D`, '*');
                });
            })
        });
    });
}

const populateSongs = () => {
    const tbody = document.querySelector('#section-Songs tbody');
    tbody.replaceChildren();
    character.songs.forEach((song, idx) => {
        elem(tbody, 'tr', null, tr => {
            elem(tr, 'td', null, td => {
                input(td, 'text', song, 'name');
            });
            elem(tr, 'td', null, td => {
                input(td, 'number', song, 'difficulty');
            })
            elem(tr, 'td', null, td => {
                button(td, 'x', () => {
                    character.songs.splice(idx, 1);
                    save();
                    populateSongs();
                });
            })
        })
    });
    elem(tbody, 'tr', null, tr => {
        elem(tr, 'td', null, td => {
            td.colSpan = 3;
            button(td, 'Add song', () => {
                character.songs.push({
                    name: '',
                    difficulty: 1
                });
                save();
                populateSongs();
            });
        });
    });
}

const populateItems = (section) => {
    const tbody = document.querySelector(`#section-${section} tbody`);
    tbody.replaceChildren();
    const field = section.toLowerCase();
    character[field].forEach((item, idx) => {
        elem(tbody, 'tr', null, tr => {
            elem(tr, 'td', null, td => {
                input(td, 'text', item, 'name');
            });
            elem(tr, 'td', null, td => {
                input(td, 'number', item, 'strength');
            });
            elem(tr, 'td', null, td => {
                input(td, 'number', item, 'difficulty');
            });
            elem(tr, 'td', null, td => {
                input(td, 'checkbox', item, 'canMake');
            });
            elem(tr, 'td', null, td => {
                input(td, 'number', item, 'charges');
            });
            elem(tr, 'td', null, td => {
                button(td, 'x', () => {
                    character[field].splice(idx, 1);
                    save();
                    populateItems(section);
                });
            })
        })
    });
    elem(tbody, 'tr', null, tr => {
        elem(tr, 'td', null, td => {
            td.colSpan = 3;
            button(td, 'Add item', () => {
                character[field].push({
                    name: '',
                    difficulty: 1,
                    strength: 1,
                    charges: 5,
                    canMake: true,

                });
                save();
                populateItems(section);
            });
        });
    });

}


const populateRolls = () => {
    const ul = document.querySelector('ul#rolls');
    new Array(15).fill(null).forEach((_, i) => elem(ul, 'li', null, li => elem(li, 'button', String(i + 1), button => {
        button.addEventListener('click', () => {
            window.parent?.postMessage(`Roll: ${i + 1}D`, '*');
        });
    })));
}

const selectSection = title => document.querySelectorAll('section').forEach(section => {
    section.style.display = section.id === `section-${title}` ? 'block' : 'none';
});

const populateNav = () => {
    const nav = document.querySelector('nav');
    elem(nav, 'ul', null, ul => {
        ['Character', 'Items', 'Songs', 'Tattoos', 'Notes', 'Description'].forEach(title => {
            elem(ul, 'li', null, li => {
                elem(li, 'button', title, button => {
                    button.addEventListener('click', () => selectSection(title));
                })
            });
        });
    });
};

selectSection('Character');
populateCharacter();
populateRolls();
populateSongs();
populateItems('Items');
populateItems('Tattoos');
populateTextSection('Notes');
populateTextSection('Description');
populateNav();



// textSection('Equipment', 'equipment');
// textSection('Songs', 'songs');
// textSection('Notes', 'notes');
// textSection('Backstory', 'backstory');
