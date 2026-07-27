# Repository Guidelines

## Project Structure & Module Organization

Plugin source and metadata live under `src/`; the focused UI-script check is in
`tests/`. Build the solution at
`src/Jellyfin.Plugin.OriginalAspectRatio.sln`; the plugin project is
`src/Jellyfin.Plugin.OriginalAspectRatio/`. Its entry point is
`OriginalAspectRatioPlugin.cs`, with metadata logic in `Providers/` and
configuration in `Configuration/`. `Configuration/configPage.html` is an
embedded configuration page. Keep release metadata aligned between
`src/Directory.Build.props` and `src/meta.json`.

## Build, Test, and Development Commands

- `dotnet restore src/Jellyfin.Plugin.OriginalAspectRatio.sln` restores NuGet packages.
- `dotnet build src/Jellyfin.Plugin.OriginalAspectRatio.sln -c Release` compiles the plugin and runs configured analyzers.
- `dotnet format src/Jellyfin.Plugin.OriginalAspectRatio.sln` applies the repository's formatting rules.
- `node tests/aspect-ratio-display.test.cjs` checks the injected detail-page row.

This is a Jellyfin plugin, not a standalone application; validate runtime behavior by loading the built plugin into a local Jellyfin instance.

## Coding Style & Naming Conventions

Follow `src/.editorconfig`: UTF-8, LF endings, trimmed trailing whitespace,
and four-space C# indentation (two spaces for XML). Use PascalCase for types,
members, constants, and local functions; use camelCase for parameters and
locals; prefix fields with `_` (for example, `_logger`). Keep `using` directives
ordered with `System` first and retain braces around control-flow blocks.

Warnings are errors. The project enables .NET analyzers, StyleCop, Serilog, and
multithreading analysis; fix analyzer findings rather than suppressing them
unless `src/jellyfin.ruleset` documents the exception.

## Testing Guidelines

No C# test project or test framework is currently configured. At minimum, run
the Release build, the focused Node check, and affected metadata/configuration
flows in Jellyfin. If adding C# coverage, use a dedicated test project and
descriptive names such as `OriginalAspectRatioMetadataProviderTests`.

## Commit & Pull Request Guidelines

Use short, capitalized imperative commit subjects without Conventional Commit
prefixes, for example: `Fix accepted aspect ratios setting not saving`. Keep
pull requests focused; include a concise summary, a linked issue when relevant,
and the build/manual validation performed. Include screenshots when changing
the embedded configuration UI.
