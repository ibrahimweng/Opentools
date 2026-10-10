# OpenTools

A one-page site for a shelf of design tools: Typeforge, Ideation Board, Mockup
Studio, Glyphs, Pattern Gen, Beat Studio and Brand Handover.

The top of the page is the name, OpenTools, written as a gap in a field of
silver glitter. Grab the word and drag it through the flakes; let go and it
glides back. Click a name in the index below it, and a pop-up opens with what
the tool is, what it does, and a video of it in use. From there
you can step to the next tool or the previous one, or press **Visit site** to
open the tool itself in a new tab.

The page is plain HTML, CSS and JavaScript. The tools are edited in a Sanity
studio that lives on the same site, at **https://www.opentools.art/studio**.

## Editing the tools

Open **/studio** and sign in with the Sanity account that owns the project.

- **Tools** lists every tool in the order the site shows them. Drag a row to
  move it.
- Open a tool to change its name, tagline, category, **Tool link** (where
  "Visit site" goes), description and features, or to upload a **Demo video**.
- Press **Publish**. The site picks the change up within about a minute.
- **Hide from the site** takes a tool off the page without deleting it.
- To add a tool, press the **+** at the top of the Tools list.

The first time, open **Import** in the studio's top bar and press the button.
It copies the seven tools the site already describes into the studio. Pressing
it again does nothing to tools that are already there.

| Field | What it is |
| --- | --- |
| Name, Tagline | Shown at the top of the pop-up; the name also in the index |
| Link name | The tool's own address on the site, e.g. `#typeforge` |
| Category | Shown under the name in the index |
| Tool link | Where **Visit site** goes. Left empty, the button reads "Live link soon" |
| Demo video, Video still | Plays in the pop-up. Left empty, the tool's animated preview plays instead |
| Short description, Description, What it does, Runs, Built with | The breakdown in the pop-up |
| Source code link | The GitHub link in the pop-up. Left empty, it is hidden |

Videos play muted on a loop. MP4, 10–30 seconds and under about 8 MB keeps the
pop-up quick to open.

### When the studio has nothing

`assets/js/tools.js` holds the copy the site shows until the studio has
published tools, and whenever Sanity cannot be reached. It is also what
**Import** copies in. Once the tools are in the studio, edit them there.

A tool added in the studio shows its video, or a plain frame without one. The
seven tools above also have an animated preview each, drawn in
`assets/js/previews.js`.

## Linking straight to a tool

Every tool has its own address. `opentools.art/#glyphs` opens the page with
Glyphs already showing. The back button closes the pop-up.

## Looking at it locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

To work on the studio itself:

```bash
npm ci --prefix studio
cd studio && npm run dev      # http://localhost:3333/studio
```

Add `http://localhost:3333` as a CORS origin in the Sanity project (with
credentials allowed) to sign in locally.

## Building

```bash
npm ci --prefix studio
npm run build                 # writes dist/, with the studio at dist/studio
```

The build copies the page and its assets into `dist/`, stamps each asset link
with a hash of the file so browsers never keep a stale copy, and builds the
studio into `dist/studio`. Vercel runs exactly this on every push;
`vercel.json` holds the settings, so nothing needs setting in Vercel's
dashboard.

## Files

```
index.html             the page
assets/js/tools.js     the starting copy, used until the studio has tools
assets/js/previews.js  the animated preview drawn for each tool
assets/js/glitter.js   the glitter wordmark at the top of the page
assets/js/site.js      the index, the pop-up, and reading from the studio
assets/css/site.css    the look, and the motion of every preview
assets/og.png          the picture a shared link shows
assets/favicon.svg     the tab icon
studio/                the Sanity studio served at /studio
scripts/build.mjs      the build Vercel runs
vercel.json            hosting settings
```

## Hosting

The site is on Vercel, project **opentools**, and lives at
**https://www.opentools.art**, with `opentools.art` redirecting there.
`index.html` names that address in its canonical link and share tags, so if
the domain ever changes, change it there too.

The Sanity project is `hha7i7up`, dataset `production`. Its CORS origins must
include the site's addresses, with credentials allowed, for the studio to sign
in there.
