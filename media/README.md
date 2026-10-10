# Videos

Put each tool's demo video in this folder, then point the tool at it in
`assets/js/tools.js`:

```js
video: 'media/typeforge.mp4',
poster: 'media/typeforge.jpg', // optional, shown while the video loads
```

The video plays muted and on a loop in the tool's pop-up, which adds Sound
and Pause buttons.

- **Format:** MP4 (H.264) plays everywhere.
- **Shape:** 16:10 fills the pop-up exactly. 16:9 works too, trimmed slightly
  at the sides.
- **Length and size:** 10 to 30 seconds and under about 8 MB keeps the pop-up
  quick to open. Nothing loads until the pop-up does.
