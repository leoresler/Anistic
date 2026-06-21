# MAL → Kitsu mapping

`mal-kitsu-mapping.json` is a static lookup table used by `syncAnimes.ts` to enrich
anime records with a `kitsu_id` when Jikan does not expose a Kitsu external link.

## Current coverage

This file is intentionally a **seed** with only a handful of known mappings:

| MAL ID | Kitsu ID | Title (example)        |
|-------:|---------:|------------------------|
| 1      | 185      | Cowboy Bebop           |
| 5114   | 1043     | Fullmetal Alchemist: Brotherhood |
| 16498  | 16498    | Attack on Titan        |

## Replacing with a full dataset

Before production use this file should be replaced with a complete mapping
generated from a reliable source such as the Kitsu API, Cinemeta, or an
anime-mapping community dataset. The loader ignores non-numeric keys (e.g.
`_comment`), so you may keep metadata keys if needed.
