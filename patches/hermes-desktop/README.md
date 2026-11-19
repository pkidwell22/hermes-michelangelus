# Optional Hermes Desktop Speed picker

`speed-picker.patch` restores a native **Speed** dropdown immediately after the thinking level. It shows only when the model supports a selectable speed; supported choices use the same session or draft settings as the built-in model menu. Standard, Fast and Ultrafast are shown according to the selected model and provider. The stock model menu remains available.

This is a source patch for [NousResearch/hermes-agent at `09eebd1873e9fa173dad0ecc0463ca28392831e7`](https://github.com/NousResearch/hermes-agent/tree/09eebd1873e9fa173dad0ecc0463ca28392831e7), not a Desktop plugin. The Michelangelus installer does not apply it, modify Hermes binaries or enable any tier automatically.

From a clean, separate Hermes source checkout at the pinned commit, use the absolute path to this patch:

```sh
git apply --check /path/to/hermes-michelangelus/patches/hermes-desktop/speed-picker.patch
git apply /path/to/hermes-michelangelus/patches/hermes-desktop/speed-picker.patch
```

Build Desktop using the Hermes source checkout's normal build process. On another revision, review and retest the patch before applying it; do not force it onto a changed checkout. A normal Desktop update can replace a custom build. The patch contains renderer source and tests only. The Hermes source in the patch retains the terms in [LICENSE-Hermes.txt](../../LICENSE-Hermes.txt).
