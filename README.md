# OpenTools

A one-page site for a shelf of design tools: Typeforge, Ideation Board, Mockup
Studio, Glyphs, Pattern Gen, Beat Studio and Brand Handover.

The top of the page is the name, OpenTools, written as a gap in a field of
silver glitter. Grab the word and drag it through the flakes; let go and it
glides back. Click a name in the index below it, and a pop-up opens with what
the tool is, what it does, and a video of it in use. From there
you can step to the next tool or the previous one, or press **Visit site** to
open the tool itself in a new tab.

It is plain HTML, CSS and JavaScript. There is no build step and nothing to
install.

## Looking at it locally

Open `index.html` in a browser, or serve the folder so the links behave exactly
as they will online:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Changing what it says

Everything the site says about the tools is in one file,
`assets/js/tools.js`. Each tool has:

| Field | What it is |
| --- | --- |
| `name`, `tagline` | Shown in the index and at the top of the pop-up |
| `category` | Shown in the index and the pop-up |
| `url` | **The tool's live website.** Empty for now: the button reads "Live link soon" until you fill it in |
| `video`, `poster` | The demo video and its still. Empty for now: the tool's animated preview plays instead |
| `source` | The GitHub repository. Set it to `''` to hide the link |
| `lead`, `about`, `features`, `runs`, `stack` | The breakdown in the pop-up |

Tools appear in the order they are listed. To add a tool, copy one of the
entries and give it a new `slug`. Without a video, a new tool's pop-up shows a
plain frame until it has a preview of its own in `assets/js/previews.js`.

### Adding the videos

Drop the files in `media/` and set `video: 'media/your-file.mp4'` on the tool.
`media/README.md` covers the format and size.

## Linking straight to a tool

Every tool has its own address. `yourdomain.com/#glyphs` opens the page with
Glyphs already showing. The back button closes the pop-up.

## Files

```
index.html             the page
assets/js/tools.js     the tools, their copy, links and videos
assets/js/previews.js  the animated preview drawn for each tool
assets/js/glitter.js   the glitter wordmark at the top of the page
assets/js/site.js      the index and the pop-up
assets/css/site.css    the look, and the motion of every preview
assets/og.png          the picture a shared link shows
assets/favicon.svg     the tab icon
media/                 put the videos here
vercel.json            hosting settings
```

## Putting it on your domain

The site is static, so any host works. With Vercel:

1. Go to [vercel.com/new](https://vercel.com/new) and import
   `ibrahimweng/Opentools`.
2. Leave **Framework Preset** on **Other**, and leave the build command and
   output directory empty. Press **Deploy**.
3. In the project, open **Settings → Domains**, add your domain, and add the DNS
   records Vercel shows you at your domain registrar. HTTPS is set up for you
   once the records are in place.

Every push to the default branch then goes live on its own.

The site lives at **https://www.opentools.art**, with `opentools.art`
redirecting there. `index.html` names that address in its canonical link and
share tags, so if the domain ever changes, change it there too.
