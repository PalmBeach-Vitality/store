#!/usr/bin/env bash
# Idempotent: install popular Cloud IDE themes from Open VSX into cursor-server.
set -euo pipefail
EXT_DIR="${HOME}/.cursor-server/extensions"
mkdir -p "$EXT_DIR" /tmp/cloud-ide-themes
cd /tmp/cloud-ide-themes

install_one() {
  local publisher="$1" name="$2" version="$3"
  local vsix="${publisher}.${name}-${version}.vsix"
  local url="https://open-vsx.org/api/${publisher}/${name}/${version}/file/${vsix}"
  if [[ -f "${EXT_DIR}/${publisher}.${name}-${version}/package.json" ]]; then
    echo "present ${publisher}.${name}-${version}"
    return 0
  fi
  echo "download ${vsix}"
  curl -sS -L --fail --max-time 120 -o "$vsix" "$url"
  python3 - "$vsix" "$EXT_DIR" <<'PY'
import json, os, sys, time, zipfile, shutil
vsix, ext_dir = sys.argv[1], sys.argv[2]
unpack = vsix + ".unpack"
shutil.rmtree(unpack, ignore_errors=True)
os.makedirs(unpack)
with zipfile.ZipFile(vsix) as z:
    z.extractall(unpack)
pkg = json.load(open(os.path.join(unpack, "extension", "package.json")))
pub, name, ver = pkg["publisher"], pkg["name"], pkg["version"]
rel = f"{pub}.{name}-{ver}"
target = os.path.join(ext_dir, rel)
shutil.rmtree(target, ignore_errors=True)
shutil.copytree(os.path.join(unpack, "extension"), target)
man = os.path.join(ext_dir, "extensions.json")
exts = []
if os.path.exists(man) and os.path.getsize(man):
    try:
        exts = json.load(open(man))
    except Exception:
        exts = []
ident = f"{pub}.{name}"
exts = [e for e in exts if e.get("identifier", {}).get("id") != ident]
exts.append({
    "identifier": {"id": ident},
    "version": ver,
    "location": {"$mid": 1, "fsPath": target, "external": f"file://{target}", "path": target, "scheme": "file"},
    "relativeLocation": rel,
    "metadata": {"installedTimestamp": int(time.time() * 1000), "pinned": False, "source": "vsix"},
})
json.dump(exts, open(man, "w"), indent=2)
shutil.rmtree(unpack, ignore_errors=True)
print("installed", rel)
PY
}

install_one GitHub github-vscode-theme 6.3.5
install_one zhuangtongfa material-theme 3.20.2
echo "cloud-ide themes ready"
