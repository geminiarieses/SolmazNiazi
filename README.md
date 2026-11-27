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
