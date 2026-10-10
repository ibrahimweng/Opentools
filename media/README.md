# Videos

Put each tool's demo video in this folder, then point the tool at it in
`assets/js/tools.js`:

```js
video: 'media/typeforge.mp4',
poster: 'media/typeforge.jpg', // optional, shown while the video loads
```

The video plays muted and on a loop, both on the tool's card in the spiral
and in its pop-up. The pop-up adds Sound and Pause buttons.

- **Format:** MP4 (H.264) plays everywhere.
- **Shape:** 16:10 suits both the spiral's cards and the pop-up. 16:9 works
  too, trimmed slightly at the sides.
- **Length and size:** 10 to 30 seconds and under about 8 MB keeps the page
  quick. A card only plays its video while it faces the viewer.
