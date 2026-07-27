const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class Element {
    constructor() {
        this.children = [];
        this.className = '';
        this.id = '';
        this.textContent = '';
    }

    append(...children) {
        this.children.push(...children);
    }
}

async function main() {
    const listeners = new Map();
    const directors = {
        element: null,
        insertAdjacentElement(position, element) {
            assert.equal(position, 'afterend');
            this.element = element;
        }
    };
    const page = new Element();
    page.id = 'itemDetailPage';
    page.querySelector = selector => {
        if (selector === '.directorsGroup') return directors;
        return null;
    };

    const script = fs.readFileSync(
        path.join(__dirname, '..', 'src', 'Jellyfin.Plugin.OriginalAspectRatio', 'Web', 'aspect-ratio-display.js'),
        'utf8');
    vm.runInNewContext(script, {
        ApiClient: {
            getCurrentUserId: () => 'user-1',
            getItem: async () => ({ AspectRatio: '1.78' })
        },
        HTMLElement: Element,
        URLSearchParams,
        console,
        document: {
            addEventListener: (name, listener) => listeners.set(name, listener),
            createElement: () => new Element()
        },
        window: {
            location: { hash: '#/details?id=movie-1' },
            setTimeout
        }
    });

    listeners.get('viewshow')({ target: page });
    await new Promise(resolve => setTimeout(resolve, 10));

    assert.ok(directors.element);
    assert.equal(directors.element.children[0].textContent, 'Formato immagine');
    assert.equal(directors.element.children[1].textContent, '1.78:1');
}

main();
