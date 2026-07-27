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

const script = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'Jellyfin.Plugin.OriginalAspectRatio', 'Web', 'aspect-ratio-display.js'),
    'utf8');

async function flush() {
    await Promise.resolve();
    await Promise.resolve();
}

async function runScript(aspectRatio, { initialPage = true, triggerViewShow = false } = {}) {
    const listeners = new Map();
    const groups = [];
    const genres = {
        element: null,
        insertAdjacentElement(position, element) {
            assert.equal(position, 'beforebegin');
            this.element = element;
            groups.push(element);
        }
    };
    const page = new Element();
    page.id = 'itemDetailPage';
    page.querySelector = selector => {
        if (selector === '.genresGroup') return genres;
        return null;
    };

    const itemIds = [];
    vm.runInNewContext(script, {
        ApiClient: {
            getCurrentUserId: () => 'user-1',
            getItem: async (_, itemId) => {
                itemIds.push(itemId);
                return { AspectRatio: aspectRatio };
            }
        },
        URLSearchParams,
        console: {
            debug() {},
            info() {},
            warn() {}
        },
        document: {
            addEventListener: (name, listener) => listeners.set(name, listener),
            createElement: () => new Element(),
            querySelector: selector => selector === '#itemDetailPage' && initialPage ? page : null
        },
        window: {
            location: { hash: '#/details?id=movie-1' },
            setTimeout: callback => {
                callback();
                return 0;
            }
        }
    });

    if (triggerViewShow) {
        listeners.get('viewshow')({
            detail: { params: { id: 'episode-1' } },
            target: page
        });
    }

    await flush();
    return { groups, itemIds };
}

async function main() {
    for (const aspectRatio of ['1.33', '1.78', '1.85', '2.00', '2.39', '2.40', '1.43']) {
        const result = await runScript(aspectRatio);
        assert.equal(result.itemIds[0], 'movie-1');
        assert.equal(result.groups.length, 1);
        assert.equal(result.groups[0].children[0].textContent, 'Rapporto d’aspetto originale');
        assert.equal(result.groups[0].children[1].textContent, aspectRatio + ':1');
    }

    const colonRatio = await runScript('16:9');
    assert.equal(colonRatio.groups[0].children[1].textContent, '16:9');

    const emptyRatio = await runScript('   ');
    assert.equal(emptyRatio.groups.length, 0);

    const laterViewShow = await runScript('2.39', { initialPage: false, triggerViewShow: true });
    assert.equal(laterViewShow.itemIds[0], 'episode-1');
    assert.equal(laterViewShow.groups[0].children[1].textContent, '2.39:1');

    assert.equal(/\bTags\b/.test(script), false);
}

main();
