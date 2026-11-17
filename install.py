#!/usr/bin/env python3
"""Offline, explicit-target installer. Python 3.9+; no third-party packages."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import sys
import tempfile
import uuid

PACKAGE = Path(__file__).resolve().parent
PLUGINS = {'theme': 'patrick-michelangelus', 'sidebar': 'pm-session-details',
           'navigation': 'pm-session-navigation', 'radio': 'pm-radio-podcasts'}
MODES = {'theme': ['theme'], 'full': ['theme', 'sidebar', 'navigation'],
         'media': ['theme', 'sidebar', 'navigation', 'radio']}
STATE = '.michelangelus-share/install-state.json'

def digest(data):
    return hashlib.sha256(data).hexdigest()

def safe_path(root, relative):
    rel = Path(relative)
    if rel.is_absolute() or '..' in rel.parts:
        raise ValueError('Unsafe relative path')
    p = root / rel
    for candidate in [p, *p.parents]:
        if candidate == root:
            break
        if candidate.is_symlink():
            raise ValueError('Refusing symlink target: ' + str(candidate))
    return p

def atomic_write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, name = tempfile.mkstemp(prefix='.michelangelus-', dir=str(path.parent))
    try:
        with os.fdopen(fd, 'wb') as f:
            f.write(data)
            f.flush()
            os.fsync(f.fileno())
        os.replace(name, path)
    finally:
        if os.path.exists(name):
            os.unlink(name)

def check_package():
    manifest = json.loads((PACKAGE / 'manifest.json').read_text(encoding='utf-8'))
    for relative, record in manifest['files'].items():
        data = safe_path(PACKAGE, relative).read_bytes()
        if len(data) != record['bytes'] or digest(data) != record['sha256']:
            raise ValueError('Package integrity mismatch: ' + relative)
    for plugin in PLUGINS.values():
        if 'plugins/' + plugin + '/plugin.js' not in manifest['files']:
            raise ValueError('Missing required plugin in manifest')
    return manifest

def read_state(root):
    path = safe_path(root, STATE)
    if not path.exists():
        return {'version': 1, 'files': {}}
    state = json.loads(path.read_text(encoding='utf-8'))
    allowed = {'desktop-plugins/' + p + '/plugin.js' for p in PLUGINS.values()}
    if state.get('version') != 1 or not set(state.get('files', {})).issubset(allowed):
        raise ValueError('Unrecognized installation state; no changes made')
    return state

def install(root, mode, replace):
    manifest = check_package()
    state = read_state(root)
    keys = MODES[mode]
    plan = []
    # Validate every target before writing anything.
    for key in keys:
        plugin = PLUGINS[key]
        relative = 'desktop-plugins/' + plugin + '/plugin.js'
        target = safe_path(root, relative)
        incoming = (PACKAGE / 'plugins' / plugin / 'plugin.js').read_bytes()
        current = target.read_bytes() if target.exists() else None
        old = state['files'].get(relative)
        if current is not None and current != incoming:
            owned = old and digest(current) == old['installed_sha256']
            if not owned and not replace:
                raise ValueError('Existing customization differs: ' + relative + '. Use --replace only if you want a backed-up replacement.')
        plan.append((relative, target, incoming, current, old))
    session = uuid.uuid4().hex
    undo = []
    try:
        for relative, target, incoming, current, old in plan:
            # Refuse concurrent edits after preflight.
            now = target.read_bytes() if target.exists() else None
            if now != current:
                raise ValueError('Target changed during installation: ' + relative)
            record = dict(old) if old else {'original_sha256': digest(current) if current is not None else None, 'backup': None}
            if current is not None and (not old or digest(current) != old['installed_sha256']):
                # Preserve an explicitly replaced local edit as the restore point.
                backup = '.michelangelus-share/backups/' + session + '/' + relative
                atomic_write(safe_path(root, backup), current)
                record.update(backup=backup, original_sha256=digest(current))
            if current != incoming:
                atomic_write(target, incoming)
                undo.append((target, current))
            if target.read_bytes() != incoming:
                raise ValueError('Installed readback mismatch: ' + relative)
            record['installed_sha256'] = digest(incoming)
            state['files'][relative] = record
        state['package_version'] = manifest['version']
        atomic_write(safe_path(root, STATE), (json.dumps(state, indent=2) + '\n').encode())
    except Exception:
        for target, previous in reversed(undo):
            if previous is None:
                target.unlink(missing_ok=True)
            else:
                atomic_write(target, previous)
        raise
    print('Installed and verified ' + mode + ' package into ' + str(root))
    print('No config, credentials, conversations, memories, schedules or fonts were changed.')
    print('Open README.md for theme selection and optional sidebar layout setup.')

def verify(root):
    check_package()
    state = read_state(root)
    if not state['files']:
        raise ValueError('No installation state found for this target')
    for relative, record in state['files'].items():
        target = safe_path(root, relative)
        if not target.is_file() or digest(target.read_bytes()) != record['installed_sha256']:
            raise ValueError('Installed file missing or modified: ' + relative)
    print('Installed plugin hashes verified; live desktop compatibility is checked separately in the app.')

def uninstall(root):
    state = read_state(root)
    plan = []
    for relative, record in state['files'].items():
        target = safe_path(root, relative)
        current = target.read_bytes() if target.exists() else None
        if current is not None and digest(current) != record['installed_sha256']:
            raise ValueError('Refusing to remove a locally modified plugin: ' + relative)
        restored = None
        if record.get('backup'):
            if not record['backup'].startswith('.michelangelus-share/backups/'):
                raise ValueError('Invalid backup location')
            restored = safe_path(root, record['backup']).read_bytes()
            if digest(restored) != record['original_sha256']:
                raise ValueError('Backup integrity mismatch; nothing removed')
        elif record.get('original_sha256') is not None:
            raise ValueError('Missing original backup; nothing removed')
        plan.append((target, current, restored))
    undo = []
    try:
        for target, current, restored in plan:
            now = target.read_bytes() if target.exists() else None
            if now != current:
                raise ValueError('Target changed during uninstall')
            if restored is None:
                target.unlink(missing_ok=True)
            else:
                atomic_write(target, restored)
                if target.read_bytes() != restored:
                    raise ValueError('Restore readback mismatch')
            undo.append((target, current))
        safe_path(root, STATE).unlink(missing_ok=True)
    except Exception:
        for target, previous in reversed(undo):
            if previous is None:
                target.unlink(missing_ok=True)
            else:
                atomic_write(target, previous)
        raise
    print('Package removed; original plugin files restored where backups existed. Backups retained.')
    print('Saved theme/layout choices are not rewritten. Select a valid theme and layout in Hermes.')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['check', 'install', 'verify', 'uninstall'])
    parser.add_argument('--hermes-home', help='Explicit target Hermes home/profile directory')
    parser.add_argument('--mode', choices=list(MODES), default='theme')
    parser.add_argument('--replace', action='store_true', help='Back up and replace differing target plugin files')
    args = parser.parse_args()
    if args.action == 'check':
        m = check_package()
        print('Package ' + m['version'] + ' integrity verified. No installation performed.')
        return
    if not args.hermes_home:
        parser.error('--hermes-home is required; no live profile is selected implicitly')
    root = Path(args.hermes_home).expanduser().resolve()
    if root.exists() and not root.is_dir():
        parser.error('Target must be a directory')
    if args.action == 'install':
        install(root, args.mode, args.replace)
    elif args.action == 'verify':
        verify(root)
    else:
        uninstall(root)

if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, KeyError, TypeError) as error:
        print('ERROR: ' + str(error), file=sys.stderr)
        sys.exit(1)
