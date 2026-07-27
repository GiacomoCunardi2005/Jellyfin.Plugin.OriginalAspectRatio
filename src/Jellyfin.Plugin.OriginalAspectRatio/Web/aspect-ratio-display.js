(function () {
    'use strict';

    var logPrefix = '[Original Aspect Ratio]';

    if (globalThis.__originalAspectRatioDisplayLoaded) {
        console.debug(logPrefix + ' Display script was already loaded.');
        return;
    }

    globalThis.__originalAspectRatioDisplayLoaded = true;

    function getItemId(event) {
        var eventItemId = event && event.detail && event.detail.params && event.detail.params.id;
        if (eventItemId) {
            return eventItemId;
        }

        var queryStart = window.location.hash.indexOf('?');
        if (queryStart === -1) {
            return null;
        }

        return new URLSearchParams(window.location.hash.substring(queryStart + 1)).get('id');
    }

    function formatAspectRatio(value) {
        var text = String(value ?? '').trim();
        return text && text.indexOf(':') === -1 ? text + ':1' : text;
    }

    function createDetailsGroup(aspectRatio) {
        var group = document.createElement('div');
        group.className = 'detailsGroupItem originalAspectRatioGroup';

        var label = document.createElement('div');
        label.className = 'label';
        label.textContent = 'Rapporto d’aspetto originale';

        var content = document.createElement('div');
        content.className = 'content';
        content.textContent = formatAspectRatio(aspectRatio);

        group.append(label, content);
        return group;
    }

    async function render(page, itemId) {
        var apiClient = globalThis.ApiClient;
        if (!itemId) {
            console.debug(logPrefix + ' Cannot render because the item id is unavailable.');
            return;
        }

        if (!apiClient) {
            console.warn(logPrefix + ' Cannot render because ApiClient is unavailable.');
            return;
        }

        try {
            var item = await apiClient.getItem(apiClient.getCurrentUserId(), itemId);
            var existing = page.querySelector('.originalAspectRatioGroup');
            if (existing) {
                existing.remove();
            }

            var aspectRatio = String(item?.AspectRatio ?? '').trim();
            console.debug(logPrefix + ' API returned AspectRatio for item ' + itemId + ':', aspectRatio || '(empty)');
            if (!aspectRatio) {
                console.debug(logPrefix + ' No aspect ratio is available; no row was rendered.');
                return;
            }

            var group = createDetailsGroup(aspectRatio);
            var genres = page.querySelector('.genresGroup');
            if (genres) {
                genres.insertAdjacentElement('beforebegin', group);
                console.debug(logPrefix + ' Rendered the aspect-ratio row before genres.');
                return;
            }

            var directors = page.querySelector('.directorsGroup');
            if (directors) {
                directors.insertAdjacentElement('afterend', group);
                console.debug(logPrefix + ' Rendered the aspect-ratio row after directors.');
                return;
            }

            var details = page.querySelector('.itemDetailsGroup');
            if (details) {
                details.append(group);
                console.debug(logPrefix + ' Rendered the aspect-ratio row in the details group fallback.');
                return;
            }

            console.warn(logPrefix + ' Could not find an item-details insertion point.');
        } catch (error) {
            console.warn(logPrefix + ' Unable to load item details.', error);
        }
    }

    function scheduleRender(page, event) {
        if (!page || page.id !== 'itemDetailPage') {
            return;
        }

        var itemId = getItemId(event);
        console.debug(logPrefix + ' Scheduling detail-page render for item:', itemId || '(unknown)');
        window.setTimeout(function () {
            void render(page, itemId);
        }, 0);
    }

    document.addEventListener('viewshow', function (event) {
        scheduleRender(event.target, event);
    });

    console.info(logPrefix + ' Display script loaded.');
    scheduleRender(document.querySelector('#itemDetailPage'));
}());
