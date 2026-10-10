# Videos

Put each tool's demo video in this folder, then point the tool at it in
`assets/js/tools.js`:

```js
video: 'media/typeforge.mp4',
poster: 'media/typeforge.jpg', // optional, shown while the video loads
```

The video plays muted and on a loop, both on the tool's tile and in its
pop-up. The pop-up adds Sound and Pause buttons.

- **Format:** MP4 (H.264) plays everywhere.
- **Shape:** 16:10 or 16:9 suits the pop-up. Tiles are square and crop to the
  middle, so keep the action near the centre.
- **Length and size:** 10 to 30 seconds and under about 8 MB keeps the page
  quick. Tiles only start loading their video when they come into view.

A showreel for the top of the page goes here too, set as `reel` at the top
of `tools.js`.
