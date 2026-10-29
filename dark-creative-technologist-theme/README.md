# Dark Creative Technologist — GitHub Pages Starter

A responsive, black-and-white portfolio theme for Daniel Delgado's research and project archive.

## Files
- `index.html` — page structure and portfolio content
- `style.css` — monochrome visual system and responsive layouts
- `script.js` — accessible mobile navigation toggle

## Preview locally
Open `index.html` in a browser, or run a simple local server from this directory:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish with GitHub Pages
1. Copy `index.html`, `style.css`, and `script.js` into the root of your `Portfolio` repository.
2. Keep your existing `Projects/`, `Publications/`, `Resume/`, and `CV/` directories.
3. In the repository, open **Settings → Pages**.
4. Select **Deploy from a branch**, choose your main branch and `/ (root)`, then save.
5. Check the published site URL shown in Pages settings.

If your site is published under `https://danieldel96.github.io/Portfolio/`, the relative publication and PDF links in this template will work when their filenames match. Confirm exact file names and capitalization in your repository before publishing.

## Customize
- Update the text and links in `index.html`.
- Replace the CSS-generated project visuals with your own images if desired.
- Update publication years and filenames to match the final PDFs.
- Adjust color tokens at the top of `style.css`.

This is a static site; it does not require a build step or Jekyll.
