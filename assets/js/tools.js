/*
 * OpenTools — the starting copy.
 *
 * The tools are edited in the studio at /studio. This file is what the site
 * shows until the studio has published tools, and whenever Sanity cannot be
 * reached, and it is what the studio's Import button copies in.
 *
 *   url     The tool's live website. "Visit site" opens it in a new tab.
 *           Left empty, the button reads "Live link soon" and does nothing.
 *   video   A demo video for the tool's pop-up, e.g.
 *           'media/typeforge.mp4'. Left empty, the tool's animated preview
 *           plays in its place. See media/README.md.
 *   poster  Optional still shown while the video loads, e.g.
 *           'media/typeforge.jpg'.
 *   source  The public repository, shown as "Source" in the pop-up.
 *           Set it to '' to hide the link.
 *
 * Tools appear in the index, and step in the pop-up, in the order they are listed.
 */
window.OPENTOOLS = {
  site: {
    name: 'OpenTools',
    github: 'https://github.com/ibrahimweng',
  },

  tools: [
    {
      slug: 'typeforge',
      name: 'Typeforge',
      tagline: 'A font editor that runs in the browser.',
      category: 'Type',
      url: '', // TODO: live URL, e.g. 'https://typeforge.yourdomain.com'
      video: '',
      poster: '',
      source: 'https://github.com/ibrahimweng/typeforge',
      lead: 'Open a typeface, reshape it, export a real font.',
      about: [
        'Typeforge reads .ttf, .otf, .woff and .woff2 files and writes a valid TrueType or OpenType file back out, with its kerning and spacing intact.',
        'It can also draw a family from nothing. Letters are built from a skeleton swept by a pen, so weight is an input to the drawing rather than a shove applied to a finished outline.',
      ],
      features: [
        ['Glyph view', 'Direct outline editing with bezier nodes, handles and a pen tool.'],
        ['Kerning', 'Click the gap between two letters and drag. Pairs and classes.'],
        ['Parameters', 'Weight, width, slant, x-height and corner radius across the whole face.'],
        ['Build', 'Accented letters assembled from their parts, read from Unicode itself.'],
        ['Draw', '452 glyphs across Latin, Greek and Cyrillic, in nine weights.'],
        ['Export', 'TrueType, OpenType, or one variable font with a weight axis.'],
      ],
      runs: 'In your browser. Fonts are never uploaded.',
      stack: 'React, TypeScript, opentype.js, Paper.js',
    },

    {
      slug: 'ideation-board',
      name: 'Ideation Board',
      tagline: 'A board where you drop ideas and work on them.',
      category: 'Ideas',
      url: '', // TODO: live URL
      video: '',
      poster: '',
      source: 'https://github.com/ibrahimweng/Ideation-board',
      lead: 'Images, video, sound, 3D models, notes and links on one canvas.',
      about: [
        'Drop anything onto the board and work on it where it lies: put effects on anything with pixels, run a sound through effects of its own, make a depth map of a photograph, or ask for twelve versions of a card and keep the ones worth keeping.',
        'Group cards into sections, draw connections between them, and put a board inside a board when one canvas is no longer enough.',
      ],
      features: [
        ['Drop anything', 'Images, video, audio, 3D models, notes, links and files.'],
        ['Effects', 'GPU effects for pictures and video, and effects of their own for sound.'],
        ['Depth maps', 'Read the depth of a photograph and push other pictures around with it.'],
        ['Twelve versions', 'Ask for variations of anything and keep the best.'],
        ['Sections', 'Group, label and connect cards. Nest boards inside boards.'],
        ['Export', 'Take any of it out as a full-resolution picture.'],
      ],
      runs: 'In your browser. Boards are kept on your machine, with no account.',
      stack: 'React, TypeScript, three.js',
    },

    {
      slug: 'mockup-studio',
      name: 'Mockup Studio',
      tagline: 'Photoreal mockups, rendered in your browser.',
      category: '3D',
      url: '', // TODO: live URL
      video: '',
      poster: '',
      source: 'https://github.com/ibrahimweng/3d-mockup-project',
      lead: 'Drop in a screenshot. Get a studio shot back.',
      about: [
        'Mockup Studio puts your screenshot on a device’s display, lit by a captured photography studio, or prints it onto merchandise. Drag to turn the device, pick a focal length and a backdrop, and export the frame.',
        'Keyframe the device or the camera and export a short video. The screenshot is never uploaded, and there is no account or API key.',
      ],
      features: [
        ['Devices', 'iPhone, MacBook, iMac, Mac Studio and Apple Watch Ultra.'],
        ['Merchandise', 'T-shirt, tote bag, water bottle, ID card and clipboard.'],
        ['Lighting', 'Image-based light from real photography studios.'],
        ['Animation', 'Keyframes, and a turntable preset that loops cleanly.'],
        ['Export', 'Stills and video, made in the browser.'],
      ],
      runs: 'In your browser, in a window at least 720 px wide.',
      stack: 'React, TypeScript, three.js',
    },

    {
      slug: 'glyphs',
      name: 'Glyphs',
      tagline: 'A parametric icon library and editor.',
      category: 'Icons',
      url: '', // TODO: live URL
      video: '',
      poster: '',
      source: 'https://github.com/ibrahimweng/beetle-wallet/tree/main/glyphs',
      lead: 'Thousands of icons, redrawn at once by a few sliders.',
      about: [
        'Every icon is drawn on a 24 grid with every radius and gap measured in stroke units, so changing the stroke or the corners re-derives the whole library at once.',
        'Four styles, each with rounded or sharp corners. Export one icon, a sprite, an icon font, or a whole category as a ZIP.',
      ],
      features: [
        ['Four styles', 'Stroke, two-tone, duotone and fill.'],
        ['Corners', 'Rounded or sharp, applied across every icon.'],
        ['Stroke', 'From 1 to 4 on the 24 grid, previewed from 16 to 48 px.'],
        ['Library', '1,366 icons in all eight versions, and a core set of 1,854.'],
        ['Export', 'SVG, sprite, icon font, JSON and per-category ZIPs.'],
      ],
      runs: 'In your browser. A static site with no server code.',
      stack: 'JavaScript, Clipper, opentype.js',
    },

    {
      slug: 'pattern-gen',
      name: 'Pattern Gen',
      tagline: 'Turns a logo into a system of brand patterns.',
      category: 'Patterns',
      url: '', // TODO: live URL
      video: '',
      poster: '',
      source: 'https://github.com/ibrahimweng/Pattern-Gen',
      lead: 'Patterns measured from the mark, not laid over it.',
      about: [
        'Pattern Gen reads an SVG mark and works out what makes it recognisable — its colours, its angles, its symmetry, the unit it is drawn on — then builds patterns from those findings rather than from generic decoration.',
        'Every pattern is measured before it is offered, and each one comes with a written report on where it belongs and where it does not.',
      ],
      features: [
        ['Four families', 'Shape, gradient, pixel and dimensional. Twenty-five ideas.'],
        ['Measured', 'Seams, range and survival at small sizes, checked first.'],
        ['Reports', 'A written case for every pattern, with what was measured.'],
        ['Studio', 'Tune density and colour, reroll, and watch the loop play.'],
        ['Export', 'SVG tile, PNG proofs, CSS, a React component and a Lottie loop.'],
      ],
      runs: 'In your browser, or from the command line.',
      stack: 'TypeScript, React',
    },

    {
      slug: 'beat-studio',
      name: 'Beat Studio',
      tagline: 'Sound design for video, in the browser.',
      category: 'Sound',
      url: '', // TODO: live URL
      video: '',
      poster: '',
      source: 'https://github.com/ibrahimweng/beat-studio',
      lead: 'It reads your clip and says what belongs on each moment.',
      about: [
        'Load a clip and Beat Studio finds the moments in it that want a sound, then suggests what belongs on each. Place sounds from a library filed by the moment they serve, and export a file that lines up when you drop it back into your editor.',
        'A second screen takes a recording apart: drop in a beat and it comes back as the drums, the bass, whatever is in front and everything else, each one a layer of its own.',
      ],
      features: [
        ['Reads the picture', 'Finds the hits in a clip and suggests sounds for each.'],
        ['Library', 'Filed by what a sound does on screen, not what made it.'],
        ['Stems', 'Split a recording into parts, then split those again.'],
        ['Synthesised', 'Every sound is made with the Web Audio API.'],
        ['Export', 'WAV, MP3, MIDI and a marker list, at 24 bits and 48k.'],
      ],
      runs: 'In your browser. Clips never leave your machine.',
      stack: 'TypeScript, Web Audio API',
    },

    {
      slug: 'brand-handover',
      name: 'Brand Handover',
      tagline: 'One approved mark in, a whole brand package out.',
      category: 'Brand',
      url: '', // TODO: live URL
      video: '',
      poster: '',
      source: 'https://github.com/ibrahimweng/Brand-Handover',
      lead: 'Change the mark, and every document changes with it.',
      about: [
        'Upload the approved mark once and Brand Handover derives everything downstream of it: lockups in every colourway, icons, favicons, social crops, the brand pattern, the guidelines manual, the client deck and the delivery package.',
        'None of the documents holds a copy of the mark, so a late revision costs a rebuild rather than a week of remaking files by hand.',
      ],
      features: [
        ['Reads the mark', 'Ink box, clear space and minimum sizes, measured from the file.'],
        ['Manual and deck', 'Guidelines and a client presentation, built together.'],
        ['Files', 'SVG, PDF, .ai and PNG for every lockup in every colourway.'],
        ['Canvas', 'Arrange blocks and place photographs; drawn blocks stay true.'],
        ['Delivery', 'Around 150 files, packaged as one zip.'],
      ],
      runs: 'Hosted, or on your own machine, where nothing is uploaded.',
      stack: 'Node, resvg, headless Chrome',
    },
  ],
};
