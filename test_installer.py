#!/usr/bin/env python3
"""Exercise installer safety using disposable homes only. No Hermes launch."""
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

sys.dont_write_bytecode = True
PACKAGE = Path(__file__).resolve().parent
INSTALLER = PACKAGE / 'install.py'
RESULTS = []

def run(*args, ok=True, package=PACKAGE):
    result = subprocess.run([sys.executable, '-B', str(package / 'install.py'), *map(str, args)], capture_output=True, text=True)
    assert (result.returncode == 0) == ok, result.stdout + result.stderr
    return result

def record(label):
    RESULTS.append(label)

def main():
    run('check')
    run('install', ok=False)
    record('Package integrity check and explicit target requirement')
    with tempfile.TemporaryDirectory(prefix='michelangelus-test-', dir=os.environ.get('TMPDIR')) as directory:
        temp = Path(directory)
        theme_rel = 'desktop-plugins/patrick-michelangelus/plugin.js'
        side_rel = 'desktop-plugins/pm-session-details/plugin.js'
        full = temp / 'full'
        full.mkdir()
        for name in ['config.yaml', 'state.db', 'memories/USER.md', 'cron/jobs.json']:
            p = full / name
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(b'unchanged fixture')
        run('install', '--hermes-home', full, '--mode', 'full')
        assert (full / theme_rel).is_file() and (full / side_rel).is_file()
        run('verify', '--hermes-home', full)
        first_state = (full / '.michelangelus-share/install-state.json').read_bytes()
        run('install', '--hermes-home', full, '--mode', 'full')
        assert (full / '.michelangelus-share/install-state.json').read_bytes() == first_state
        for name in ['config.yaml', 'state.db', 'memories/USER.md', 'cron/jobs.json']:
            assert (full / name).read_bytes() == b'unchanged fixture'
        record('Full install, readback verification, idempotency and unrelated-data preservation')
        run('uninstall', '--hermes-home', full)
        assert not (full / theme_rel).exists() and not (full / side_rel).exists()
        assert (full / 'config.yaml').read_bytes() == b'unchanged fixture'
        record('Fresh full installation removes only owned plugin files')

        theme = temp / 'theme'
        run('install', '--hermes-home', theme, '--mode', 'theme')
        assert (theme / theme_rel).is_file() and not (theme / side_rel).exists()
        run('install', '--hermes-home', theme, '--mode', 'full')
        assert (theme / side_rel).is_file()
        run('uninstall', '--hermes-home', theme)
        assert not (theme / theme_rel).exists() and not (theme / side_rel).exists()
        record('Theme-only installation and safe upgrade to full')

        # Assert exact payloads for all three modes, and no lingering plugin after removal.
        for mode, expected in {
            'theme': {'patrick-michelangelus'},
            'full': {'patrick-michelangelus', 'pm-session-details', 'pm-session-navigation'},
            'media': {'patrick-michelangelus', 'pm-session-details', 'pm-session-navigation', 'pm-radio-podcasts'},
        }.items():
            root = temp / ('exact-' + mode)
            run('install', '--hermes-home', root, '--mode', mode)
            assert {x.parent.name for x in root.glob('desktop-plugins/*/plugin.js')} == expected
            run('verify', '--hermes-home', root)
            run('uninstall', '--hermes-home', root)
            assert not list(root.glob('desktop-plugins/*/plugin.js'))
        record('Exact payload and clean uninstall for theme, full and media modes')

        previous = temp / 'previous'
        for relative in [theme_rel, side_rel]:
            p = previous / relative
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(('original ' + relative).encode())
        run('install', '--hermes-home', previous, '--mode', 'full', ok=False)
        for relative in [theme_rel, side_rel]:
            assert (previous / relative).read_bytes() == ('original ' + relative).encode()
        run('install', '--hermes-home', previous, '--mode', 'full', '--replace')
        run('uninstall', '--hermes-home', previous)
        for relative in [theme_rel, side_rel]:
            assert (previous / relative).read_bytes() == ('original ' + relative).encode()
        record('Conflict refusal is non-destructive; explicit replacement restores original bytes')

        drift = temp / 'drift'
        run('install', '--hermes-home', drift, '--mode', 'full')
        (drift / side_rel).write_bytes(b'local edit')
        run('verify', '--hermes-home', drift, ok=False)
        run('uninstall', '--hermes-home', drift, ok=False)
        assert (drift / theme_rel).is_file() and (drift / side_rel).read_bytes() == b'local edit'
        record('Local edits block verification and destructive uninstall before any removal')

        broken_backup = temp / 'broken-backup'
        p = broken_backup / theme_rel
        p.parent.mkdir(parents=True)
        p.write_bytes(b'original theme')
        run('install', '--hermes-home', broken_backup, '--replace')
        state = json.loads((broken_backup / '.michelangelus-share/install-state.json').read_text())
        (broken_backup / state['files'][theme_rel]['backup']).write_bytes(b'corrupt backup')
        run('uninstall', '--hermes-home', broken_backup, ok=False)
        assert p.read_bytes() == (PACKAGE / 'plugins/patrick-michelangelus/plugin.js').read_bytes()
        record('Corrupt backup fails closed without removing installed theme')

        outside = temp / 'outside'
        outside.mkdir()
        linked = temp / 'linked'
        linked.mkdir()
        try:
            (linked / 'desktop-plugins').symlink_to(outside, target_is_directory=True)
        except OSError:
            record('Symlink test skipped: OS did not permit test symlink creation')
        else:
            run('install', '--hermes-home', linked, ok=False)
            assert not list(outside.iterdir())
            record('Symlinked plugin target refused without writing outside target')

        corrupt = temp / 'corrupt-package'
        shutil.copytree(PACKAGE, corrupt, ignore=shutil.ignore_patterns('__pycache__', '.git'))
        with (corrupt / 'plugins/patrick-michelangelus/plugin.js').open('ab') as f:
            f.write(b'\n// modified\n')
        run('check', package=corrupt, ok=False)
        run('install', '--hermes-home', temp / 'must-not-exist', package=corrupt, ok=False)
        assert not (temp / 'must-not-exist').exists()
        record('Tampered package rejected before creating installation target')

        spec = importlib.util.spec_from_file_location('michelangelus_installer_test', INSTALLER)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        actual_write = module.atomic_write
        rollback = temp / 'rollback'
        def fail_second(path, data):
            if str(path).endswith(side_rel):
                raise OSError('Injected second-file write failure')
            return actual_write(path, data)
        module.atomic_write = fail_second
        try:
            module.install(rollback, 'full', False)
        except OSError:
            pass
        else:
            raise AssertionError('Fault injection failed')
        assert not (rollback / theme_rel).exists() and not (rollback / side_rel).exists()
        assert not (rollback / '.michelangelus-share/install-state.json').exists()
        record('Partial install failure rolls back the first plugin write')
    print(json.dumps({'passed': True, 'checks': RESULTS}, indent=2))

if __name__ == '__main__':
    main()
