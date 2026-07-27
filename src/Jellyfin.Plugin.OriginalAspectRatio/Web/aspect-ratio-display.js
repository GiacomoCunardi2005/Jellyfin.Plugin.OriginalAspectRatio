(function () {
    'use strict';

    function getItemId() {
        var queryStart = window.location.hash.indexOf('?');
        if (queryStart === -1) {
            return null;
        }

        return new URLSearchParams(window.location.hash.substring(queryStart + 1)).get('id');
    }

    function formatAspectRatio(value) {
        var text = String(value || '').trim();
        if (!text || text.indexOf(':') !== -1) {
            return text;
        }

        var ratio = Number.parseFloat(text.replace(',', '.'));
        if (!Number.isFinite(ratio)) {
            return text;
        }

        return ratio.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ':1';
    }

    function createDetailsGroup(aspectRatio) {
        var group = document.createElement('div');
        group.className = 'detailsGroupItem originalAspectRatioGroup';

        var label = document.createElement('div');
        label.className = 'label';
        label.textContent = 'Formato immagine';

        var content = document.createElement('div');
        content.className = 'content';
        content.textContent = formatAspectRatio(aspectRatio);

        group.append(label, content);
        return group;
    }

    async function render(page) {
        var itemId = getItemId();
        var apiClient = globalThis.ApiClient;
        if (!itemId || !apiClient) {
            return;
        }

        try {
            var item = await apiClient.getItem(apiClient.getCurrentUserId(), itemId);
            var existing = page.querySelector('.originalAspectRatioGroup');
            if (existing) {
                existing.remove();
            }

            if (!item || !item.AspectRatio) {
                return;
            }

            var group = createDetailsGroup(item.AspectRatio);
            var directors = page.querySelector('.directorsGroup');
            if (directors) {
                directors.insertAdjacentElement('afterend', group);
                return;
            }

            page.querySelector('.itemDetailsGroup')?.append(group);
        } catch (error) {
            console.debug('Original Aspect Ratio: unable to load item details.', error);
        }
    }

    document.addEventListener('viewshow', function (event) {
        var page = event.target;
        if (!(page instanceof HTMLElement) || page.id !== 'itemDetailPage') {
            return;
        }

        window.setTimeout(function () {
            void render(page);
        }, 0);
    });
}());
