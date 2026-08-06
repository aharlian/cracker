# UFO MAGIC — Secret Archive Landing Page

A modular cinematic landing page built with Vite, Three.js, GSAP, Lenis, WebGL/GLSL and native ES modules.

## Run locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

The HTML also includes an import map so the unbuilt source can be previewed from a normal static HTTP server while dependencies load from jsDelivr.

## Architecture

- `js/three/scene.js`: WebGL scene, GLB spacecraft, particles, fog, volumetric beam and post-processing.
- `js/three/shaders.js`: nebula, beam and chromatic-aberration GLSL.
- `js/core/`: preloader, smooth scrolling, cursor, audio and global motion.
- `js/components/`: navigation, books, tilt interactions, timeline and access form.
- `css/`: reset, design tokens, layout, motion and responsive behavior.
- `assets/models/ufo-magic-ark.glb`: original spacecraft model generated for this project.
- `assets/audio/archive-ambience.wav`: original ambient loop generated for this project.

## Fonts

Font binaries are not bundled. Vazirmatn and Latin display families are loaded from Google Fonts. For a licensed IRANSansX or Yekan Bakh deployment, add your own licensed files and update `--font-fa` in `css/tokens.css`.

## Production checklist

1. Replace the demo request form handler with your API endpoint.
2. Add the final domain to canonical and Open Graph metadata.
3. Convert the WAV ambience to Opus/AAC for smaller transfer if required.
4. Deploy with Brotli/Gzip and long-lived cache headers for hashed assets.
5. Test WebGL on target mobile devices and tune `capabilityProfile()` thresholds if needed.
