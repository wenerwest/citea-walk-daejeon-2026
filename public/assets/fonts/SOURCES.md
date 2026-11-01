# Font sources

Fonts are served from this website's own `assets/fonts/` path. Visitors do not need a connection to a font CDN. Both families use the SIL Open Font License 1.1; the original license and copyright notices are included next to the font files.

## Pretendard Variable

- Author: Kil Hyung-jin / Pretendard project.
- Official release: [Pretendard v1.3.9](https://github.com/orioncactus/pretendard/tree/v1.3.9).
- File: `PretendardVariable.woff2` (2,057,688 bytes).
- Download: [official v1.3.9 full variable WOFF2 via jsDelivr](https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/variable/woff2/PretendardVariable.woff2).
- License: `Pretendard-OFL.txt`, copied from [the release's original LICENSE](https://raw.githubusercontent.com/orioncactus/pretendard/v1.3.9/LICENSE).
- `font-family: 'Pretendard Variable'`; normal variable weights 45–920, `font-display: swap`.

The upstream dynamic stylesheet declares 92 subsets. This small static site instead uses the official, unchanged full variable WOFF2 (about 1.96 MiB) to simplify offline caching and cover later Korean content updates without requiring dozens of font assets. The file is downloaded once when used and can then be served from the site's cache. No font glyphs or outlines were modified.

## Poppins

- Authors: The Poppins Project Authors / Indian Type Foundry.
- Official project: [Poppins](https://github.com/itfoundry/Poppins).
- Distribution: Google Fonts CSS API, Poppins v24, downloaded 2026-11-01.
- Query: [normal 400 / 500 / 600 / 700](https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap).
- Only the Latin subsets are included; Chinese characters use device fonts, Korean characters use Pretendard.
- License: `Poppins-OFL.txt`, copied from [Google Fonts' original OFL notice](https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/OFL.txt).
- `font-family: 'Poppins'`; normal weights 400, 500, 600, 700, `font-display: swap`.

| File | Upstream URL |
| --- | --- |
| `Poppins-400-latin.woff2` | https://fonts.gstatic.com/s/poppins/v24/pxiEyp8kv8JHgFVrJJfecnFHGPc.woff2 |
| `Poppins-500-latin.woff2` | https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLGT9Z1xlFd2JQEk.woff2 |
| `Poppins-600-latin.woff2` | https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLEj6Z1xlFd2JQEk.woff2 |
| `Poppins-700-latin.woff2` | https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLCz7Z1xlFd2JQEk.woff2 |

The files are original WOFF2 distributions with local filenames; their glyphs and outlines were not modified. `fonts.css` preserves the Google Fonts Latin Unicode range so letters and numbers use Poppins when it is first in the font stack.
