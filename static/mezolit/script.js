
window.addEventListener('message', ({ data }) => {
    const bodyStyle = document.querySelector('body').style;
    bodyStyle.height = `${data.height}px`;
    bodyStyle.width = `${data.width}px`;
});

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
    return ret;
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

const tr = (parent, tdContents) => elem(parent, 'tr', null, tr => {
    tdContents.forEach(tdContent => {
        if (typeof tdContent === 'string') {
            elem(tr, 'th', tdContent);
        } else {
            elem(tr, 'td', null, td => tdContent(td))
        }
    });
});


let character;

const save = () => localStorage.setItem('character', JSON.stringify(character));

const loadCharacter = () => {
    const charString = localStorage.getItem('character');

    character = charString ? JSON.parse(charString) : {
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

    character.items.forEach(item => {
        if (item.maxCharges === undefined) {
            item.maxCharges = item.charges;
        }
    });

    character.tattoos.forEach(item => {
        if (item.maxCharges === undefined) {
            item.maxCharges = item.charges;
        }
    });


    save();

};


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
    ['Name', 'Age', 'Background'].forEach(label => tr(tbody,
        [
            label,
            td => {
                td.colSpan = 2;
                input(td, 'text', character, label.toLowerCase());
            }
        ]
    ));


    Object.entries(character.attributes).forEach(([name, value]) => {
        tr(tbody, [
            name,
            td => {
                input(td, 'number', value, 'val');
                td.appendChild(document.createTextNode('/'));
                input(td, 'number', value, 'max');
            },
            td => {
                button(td, 'Roll', () => {
                    window.parent?.postMessage(`${name} check: ${value.val}D`, '*');
                });
            }
        ])
    });
}

const populateSongs = () => {
    const tbody = document.querySelector('#section-Songs tbody');
    tbody.replaceChildren();
    character.songs.forEach((song, idx) => {
        tr(tbody, [
            td => {
                input(td, 'text', song, 'name');
            },
            td => {
                input(td, 'number', song, 'difficulty');
            },
            td => {
                td.className = 'delete';
                button(td, '❌', () => {
                    character.songs.splice(idx, 1);
                    save();
                    populateSongs();
                });
            }
        ])
    });
    elem(tbody, 'tr', null, tr => {
        tr.className = 'buttonrow';
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

const populateItems = (section, canEnchant) => {
    const tbody = document.querySelector(`#section-${section} tbody`);
    tbody.replaceChildren();
    const field = section.toLowerCase();
    character[field].forEach((item, idx) => {
        tr(tbody, [
            td => {
                input(td, 'text', item, 'name');
            },
            td => {
                input(td, 'checkbox', item, 'owns');
            },
            td => {
                input(td, 'checkbox', item, 'canMake');
            },
            td => {
                input(td, 'number', item, 'difficulty');
            },
            td => {
                input(td, 'number', item, 'strength');
            },
            td => {
                input(td, 'number', item, 'charges');
                elem(td, 'span', '/');
                input(td, 'number', item, 'maxCharges');
            },
            td => {
                td.className = 'delete';
                if (canEnchant && !item.enchantment) {
                    button(td, '✨', () => {
                        item.enchantment = {
                            name: '',
                            strength: 0,
                            charges: 0,
                            maxCharges: 0
                        };
                        save();
                        populateItems(section, canEnchant);
                    });

                }
                button(td, '❌', () => {
                    character[field].splice(idx, 1);
                    save();
                    populateItems(section, canEnchant);
                });
            }
        ]);
        if (item.enchantment) {
            tr(tbody, [
                td => {
                    td.className = 'enchantment';
                    input(td, 'text', item.enchantment, 'name');
                },
                td => {

                },
                td => {

                },
                td => {

                },
                td => {
                    input(td, 'number', item.enchantment, 'strength');
                },
                td => {
                    input(td, 'number', item.enchantment, 'charges');
                    elem(td, 'span', '/');
                    input(td, 'number', item.enchantment, 'maxCharges');
                },
                td => {
                    td.className = 'delete';
                    button(td, '❌', () => {
                        delete item.enchantment;
                        save();
                        populateItems(section, canEnchant);
                    });
                }
            ])
        }
    });
    elem(tbody, 'tr', null, tr => {
        tr.className = 'buttonrow';
        elem(tr, 'td', null, td => {
            td.colSpan = 6;
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

loadCharacter();
selectSection('Character');
populateCharacter();
populateRolls();
populateSongs();
populateItems('Items', true);
populateItems('Tattoos');
populateTextSection('Notes');
populateTextSection('Description');
populateNav();

