# Michelangelus for Hermes Desktop

An offline-installable visual theme and companion plugins. Use the theme alone or add the Sessions navigation, chat-specific Workspace sidebar and optional player. This pack does not distribute Hermes itself.

| Install mode | Contents |
| --- | --- |
| `theme` | Painting backdrop, frosted surfaces, typography and accent styling. The font is optional; no font binaries are bundled. |
| `full` | Theme plus native Sessions navigation and the Workspace sidebar: Context (with MCP marks), Audio, Performance, Environment and Terminal. |
| `media` | Everything in `full` plus the radio/podcast player with the flat-base visualizer and optional Music.app controls on macOS. |

## Install

From this repository, with Python 3.9 or later:

```sh
python3 install.py check
python3 install.py install --mode full --hermes-home "$HOME/.hermes"
python3 install.py verify --hermes-home "$HOME/.hermes"
```

Choose the target Hermes profile explicitly. Select **Michelangelus** in the theme picker and **Michelangelus unified sidebar** in layout controls for the full workspace. Installed navigation destinations and MCP servers come from the recipient’s setup. A different existing plugin file is not overwritten unless you pass `--replace`, which backs it up first.

**Media setup:** Choose `--mode media` in place of `full`. Disable the stock Radio player before enabling the bundled podcast/radio player, so only one owns playback. The RSS episode library needs a separately installed RSS Reader with the `hermes:rss-library:v1` integration; the [upstream reader](https://github.com/Adolanium/hermes-rss) alone is not verified to supply it. Radio streams need network access. Music.app integration is optional and uses the recipient’s own library and macOS permissions. No feeds, credentials, playlist files, listening history or personal profile are included.

## Uninstall and test

Switch back to your previous theme and layout, then run `python3 install.py uninstall --hermes-home "$HOME/.hermes"`. Previously backed-up plugin files are restored. If you enabled the optional player, re-enable stock Radio as needed.

`python3 test_installer.py` exercises installation, verification and removal using temporary profiles, as well as conflict handling, rollback and tamper detection. The UI was developed on macOS; clean-install testing in other Desktop builds and on other operating systems remains open. See [asset and license notices](THIRD-PARTY-NOTICES.md).
