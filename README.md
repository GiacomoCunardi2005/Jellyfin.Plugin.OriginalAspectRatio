# Jellyfin Original Aspect Ratio Detector

Detects the original visible aspect ratio of movies and episodes with FFmpeg
`cropdetect`, then stores the accepted value in Jellyfin's native
`AspectRatio` metadata field.

## Features

- Samples video frames and detects letterboxing/pillarboxing.
- Supports movies, episodes, DVD, and Blu-ray media.
- Saves the configured aspect-ratio text unchanged, for example `2.39` or
  `16:9`.
- Optionally shows **Rapporto d’aspetto originale: 2.39:1** on the item detail
  page without changing tags, genres, studios, or people metadata.

## Requirements

- Jellyfin 10.11.x (the current release targets ABI `10.11.0.0`).
- .NET 9 SDK to build from source.
- FFmpeg available to Jellyfin.
- For the detail-page row: [File Transformation](https://github.com/IAmParadox27/jellyfin-plugin-file-transformation)
  (preferred in Docker) or [JavaScript Injector](https://github.com/n00bcodr/Jellyfin-JavaScript-Injector).

Detection and metadata storage work without either frontend injector; only the
display row is optional.

## Installation

Build the plugin:

```bash
dotnet restore src/Jellyfin.Plugin.OriginalAspectRatio.sln
dotnet build src/Jellyfin.Plugin.OriginalAspectRatio.sln -c Release --no-restore
```

Copy both files from `src/Jellyfin.Plugin.OriginalAspectRatio/bin/Release/net9.0/`
to the existing plugin directory, then restart Jellyfin:

```text
Jellyfin.Plugin.OriginalAspectRatio.dll
Jellyfin.Plugin.OriginalAspectRatio.deps.json
```

For a Docker container named `jellyfin`, the default data location is commonly
`/config/data/plugins/`. Keep the existing plugin directory and replace the two
matching files; the running plugin logs its actual version at startup.

## Configuration

The plugin settings page controls:

- accepted ratios, such as `1.33, 1.78, 1.85, 2.39, 2.40`;
- number of FFmpeg sampling passes;
- whether to overwrite an existing ratio;
- whether to retain a detected ratio that matches the video stream ratio.

The frontend appends `:1` only when the saved value has no colon: `2.00`
becomes `2.00:1`, while `16:9` remains `16:9`.

## Troubleshooting

Check one item through the API:

```bash
curl -fsS -H "X-Emby-Token: $TOKEN" \
  "$JELLYFIN_URL/Items/$ITEM_ID?userId=$USER_ID" |
  jq '{Name, Type, AspectRatio, Tags}'
```

On startup, look for an aspect-ratio display registration message. In the
browser console, filter for `[Original Aspect Ratio]`; it reports the API
value, a missing value, or a missing DOM insertion point. Empty tag strings in
the API explain a `Tag: , ,` display and are unrelated to this plugin.

## Development

```bash
dotnet format src/Jellyfin.Plugin.OriginalAspectRatio.sln --verify-no-changes
node tests/aspect-ratio-display.test.cjs
```

## License

[MIT](LICENSE)
