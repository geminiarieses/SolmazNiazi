# Solmaz Niazi — portfolio website

Static portfolio site for Solmaz Niazi, contemporary artist and jewellery designer based in Belgium.
No build step: plain HTML, CSS and JavaScript, ready for GitHub Pages.

- `index.html` — page structure
- `assets/js/content.js` — **all text, works, CV and contact details** (English, Dutch, French)
- `assets/js/main.js` — rendering, language switch, the interactive magnetic-field hero, work viewer
- `assets/css/style.css` — design
- `assets/img/works/` — images (`name.jpg` large, `name-sm.jpg` ~900px for the grid)

## Editing
- Add contact details: fill in `email` / `instagram` in `window.CONTACT` in `content.js`.
- Add a work: add images to `assets/img/works/`, then copy an entry in `window.WORKS`.
- Language can be forced with `?lang=en`, `?lang=nl` or `?lang=fr`.

## Preview locally
```
python3 -m http.server 8000
```
then open http://localhost:8000

## Publish on GitHub Pages
Settings → Pages → Deploy from a branch → `main` / root. A custom domain can be added there too (a `CNAME` file is created automatically).

## Design études
Several design versions live side by side so they can be compared:
- `/` — étude 1 (`index.html`, `assets/css/style.css`, `assets/js/main.js`)
- `/2/` — étude 2: light-slit splash and scroll dive into the black hole (`2/index.html`, `2/style.css`, `2/main.js`)
- `/3/` — étude 3, "Longing for Union" (تمنای وصال): a ray-traced Schwarzschild black hole in WebGL (`3/bh.js`). Scrolling falls toward the horizon while her statement appears line by line (Persian original + translation); past the horizon a silver mirror opens with the brooch video.
- `/4/` — étude 4: like étude 3, but past the horizon the brooch itself appears, rebuilt in 3D (`assets/js/brooch.js`) and seen from straight above, turning as you scroll.
- `/5/` — étude 5: the 3D brooch is the hero from the first screen, turning with the scroll while her statement unfolds; at the end the view sinks into its silver dome, which reflects a black hole.

All études share the same content (`assets/js/content.js`) and images (`assets/img/`).
A small "Étude" switcher sits bottom-left on every version. To add étude 3, copy the `2/` folder to `3/` and add a link to the switcher in each `index.html`.
