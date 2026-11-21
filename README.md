# Michelangelus for Hermes Desktop

An offline-installable visual theme and companion plugins. Use the theme alone or add the Sessions navigation, chat-specific Workspace sidebar, small visual companions and optional player. This pack does not distribute Hermes itself.

| Install mode | Contents |
| --- | --- |
| `theme` | Painting backdrop, frosted surfaces, typography and accent styling. The font is optional; no font binaries are bundled. |
| `full` | Theme plus native Sessions navigation, the Workspace sidebar (Context with MCP marks, Audio, Performance, Environment and Terminal launcher, plus a docked Terminal view) and two small companions: frosted Settings and one-click answers on single-choice questions. |
| `media` | Everything in `full` plus the radio/podcast player with the flat-base visualizer and optional Music.app controls on macOS. |
| `catalogue` | Optional extra: **Saved artifacts** sidebar section. Reads the recipient’s own `catalogue.json` and opens published local pages in a sandboxed reader. Installs nothing else; no catalogue data ships with this pack. |
| `browser` | Optional extra: **Work browser library** page. Imports a Chrome bookmarks export (and, separately, an optional history export) into local storage for search and copy. Research notes can use project metadata from the connected gateway or be explicitly added to a chat draft. No bundled entries. |

`catalogue` and `browser` are additive: install `full` first, then either extra mode. Running another mode later keeps the earlier installation records, so one `uninstall` removes everything the installer owns.

## Install

From this repository, with Python 3.9 or later:

```sh
python3 install.py check
python3 install.py install --mode full --hermes-home "$HOME/.hermes"
python3 install.py verify --hermes-home "$HOME/.hermes"
```

Optional extras, after `full`:

```sh
python3 install.py install --mode catalogue --hermes-home "$HOME/.hermes"
python3 install.py install --mode browser --hermes-home "$HOME/.hermes"
```

Upgrading from the earlier three-plugin `full` pack needs no special flag: run `install --mode full` again and the two new companions are added while the existing theme record stays restorable. Use `--replace` only if a target plugin file was edited locally and you accept a backed-up replacement.

Choose the target Hermes profile explicitly. Select **Michelangelus** in the theme picker and **Michelangelus unified sidebar** in layout controls for the full workspace. Installed navigation destinations and MCP servers come from the recipient’s setup. A different existing plugin file is not overwritten unless you pass `--replace`, which backs it up first.

**Companion notes:** the Settings frost stylesheet only applies while a Michelangelus theme is selected; it defines no colors of its own. One-click answers activate only on a single-question, single-choice native form and still use Hermes’ own submit path. The Saved artifacts section appears only when the local default profile has a readable `catalogue.json`; the browser library keeps imports in the app’s local storage and never reads a profile directory. The theme’s Terminal view is the app’s own persistent terminal, projected into the sidebar; no shell, environment or session state is created or copied by this pack.

For Saved artifacts, put a `catalogue.json` such as `{"version":1,"entries":[{"id":"example","title":"Example"}]}` in `plugin-files/data/pm-artifact-catalogue` under the Desktop app’s user-data directory. Put your self-contained page at `publications/example.html` under that same plugin directory. Nothing is published by the installer.

**Media setup:** Choose `--mode media` in place of `full`. Disable the stock Radio player before enabling the bundled podcast/radio player, so only one owns playback. The RSS episode library needs a separately installed RSS Reader with the `hermes:rss-library:v1` integration; the [upstream reader](https://github.com/Adolanium/hermes-rss) alone is not verified to supply it. Radio streams need network access. Music.app integration is optional and uses the recipient’s own library and macOS permissions. No feeds, credentials, playlist files, listening history or personal profile are included.

**Optional Desktop source patch:** [Restore the Speed picker beside Thinking](patches/hermes-desktop/README.md) on the supported Hermes revision. The plugin installer does not apply the patch or replace the Desktop app.

## Uninstall and test

Switch back to your previous theme and layout, then run `python3 install.py uninstall --hermes-home "$HOME/.hermes"`. Previously backed-up plugin files are restored. If you enabled the optional player, re-enable stock Radio as needed.

`python3 test_installer.py` exercises installation, verification and removal using temporary profiles, as well as conflict handling, rollback, tamper detection, adding the optional extras beside `full`, and upgrading a theme-only installation to `full`. The UI was developed on macOS; clean-install testing in other Desktop builds and on other operating systems remains open. See [asset and license notices](THIRD-PARTY-NOTICES.md).
