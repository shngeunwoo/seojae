#!/usr/bin/env bash
# Install the Android command-line SDK, accept licenses, and create the
# "seojae" virtual device so you can run the app without Android Studio.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT/scripts/android-env.sh"

SDK_ROOT="$ANDROID_SDK_ROOT"
AVD_NAME="${AVD_NAME:-seojae}"
API="${ANDROID_API:-35}"
IMAGE="system-images;android-${API};google_apis;x86_64"
CMDLINE_ZIP_URL="${CMDLINE_ZIP_URL:-https://dl.google.com/android/repository/commandlinetools-linux-13114758_latest.zip}"

if [[ "$(uname -s)" == "Darwin" ]]; then
  CMDLINE_ZIP_URL="${CMDLINE_ZIP_URL/commandlinetools-linux/commandlinetools-mac}"
fi

mkdir -p "$SDK_ROOT/cmdline-tools"

if [[ ! -x "$SDK_ROOT/cmdline-tools/latest/bin/sdkmanager" ]]; then
  echo "Downloading Android command-line tools…"
  tmp="$(mktemp -d)"
  curl -fL --retry 4 --retry-delay 4 -o "$tmp/cmdline-tools.zip" "$CMDLINE_ZIP_URL"
  unzip -q "$tmp/cmdline-tools.zip" -d "$tmp"
  rm -rf "$SDK_ROOT/cmdline-tools/latest"
  mkdir -p "$SDK_ROOT/cmdline-tools"
  if [[ -d "$tmp/cmdline-tools" ]]; then
    mv "$tmp/cmdline-tools" "$SDK_ROOT/cmdline-tools/latest"
  else
    echo "Unexpected command-line tools zip layout" >&2
    exit 1
  fi
  rm -rf "$tmp"
fi

SDKMANAGER="$SDK_ROOT/cmdline-tools/latest/bin/sdkmanager"
AVDMANAGER="$SDK_ROOT/cmdline-tools/latest/bin/avdmanager"

echo "Accepting Android SDK licenses…"
yes | "$SDKMANAGER" --sdk_root="$SDK_ROOT" --licenses >/dev/null || true

echo "Installing platform-tools, emulator, API ${API}, and the system image…"
"$SDKMANAGER" --sdk_root="$SDK_ROOT" \
  "platform-tools" \
  "emulator" \
  "platforms;android-${API}" \
  "platforms;android-36" \
  "build-tools;35.0.0" \
  "build-tools;36.0.0" \
  "$IMAGE"

if [[ -e /dev/kvm && ! -r /dev/kvm ]]; then
  echo "Making /dev/kvm readable for this session…"
  sudo chmod 666 /dev/kvm || true
fi

if ! "$AVDMANAGER" list avd | grep -q "Name: ${AVD_NAME}"; then
  echo "Creating AVD ${AVD_NAME}…"
  echo "no" | "$AVDMANAGER" create avd \
    --name "$AVD_NAME" \
    --package "$IMAGE" \
    --device "pixel_7" \
    --force
fi

AVD_CONFIG="$HOME/.android/avd/${AVD_NAME}.avd/config.ini"
if [[ -f "$AVD_CONFIG" ]]; then
  python3 - <<'PY' "$AVD_CONFIG"
from pathlib import Path
import sys
path = Path(sys.argv[1])
text = path.read_text()
wanted = {
    "hw.keyboard": "yes",
    "hw.gpu.enabled": "yes",
    "hw.gpu.mode": "swiftshader_indirect",
    "hw.ramSize": "2048",
    "disk.dataPartition.size": "4096M",
}
lines = []
seen = set()
for line in text.splitlines():
    key = line.split("=", 1)[0]
    if key in wanted:
        lines.append(f"{key}={wanted[key]}")
        seen.add(key)
    else:
        lines.append(line)
for key, value in wanted.items():
    if key not in seen:
        lines.append(f"{key}={value}")
path.write_text("\n".join(lines) + "\n")
PY
fi

if [[ -d "$ROOT/android" ]]; then
  printf 'sdk.dir=%s\n' "$SDK_ROOT" > "$ROOT/android/local.properties"
fi

echo
echo "Android SDK: $SDK_ROOT"
echo "Virtual device: $AVD_NAME (API $API)"
echo
echo "Next:"
echo "  npm run android:run"
echo
echo "Or source the env in this shell:"
echo "  source scripts/android-env.sh"
