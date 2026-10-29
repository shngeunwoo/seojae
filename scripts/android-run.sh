#!/usr/bin/env bash
# Build the static web bundle, sync Capacitor, start the seojae emulator
# if needed, install the debug APK, and launch the app.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT/scripts/android-env.sh"

AVD_NAME="${AVD_NAME:-seojae}"
APK_OUT="$ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
COPY_APK="${COPY_APK:-$ROOT/dist/seojae-debug.apk}"

if [[ ! -x "$ANDROID_SDK_ROOT/platform-tools/adb" ]]; then
  echo "Android SDK is missing. Run: npm run android:setup" >&2
  exit 1
fi

if [[ -e /dev/kvm && ! -r /dev/kvm ]]; then
  sudo chmod 666 /dev/kvm || true
fi

cd "$ROOT"
if [[ ! -d node_modules ]]; then
  npm install
fi

echo "Building the Android web bundle…"
CAPACITOR=true npm run build
npx cap sync android

printf 'sdk.dir=%s\n' "$ANDROID_SDK_ROOT" > "$ROOT/android/local.properties"

adb start-server >/dev/null

booted=""
if adb devices | awk 'NR>1 && $2=="device" {print $1}' | grep -q .; then
  booted="$(adb devices | awk 'NR>1 && $2=="device" {print $1; exit}')"
fi

if [[ -z "$booted" ]]; then
  if ! "$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/avdmanager" list avd | grep -q "Name: ${AVD_NAME}"; then
    echo "Virtual device ${AVD_NAME} is missing. Run: npm run android:setup" >&2
    exit 1
  fi
  echo "Starting emulator ${AVD_NAME}…"
  "$ANDROID_SDK_ROOT/emulator/emulator" \
    -avd "$AVD_NAME" \
    -gpu swiftshader_indirect \
    -no-snapshot \
    -no-audio \
    -no-boot-anim \
    -netdelay none \
    -netspeed full \
    >/tmp/seojae-emulator.log 2>&1 &
  echo $! > /tmp/seojae-emulator.pid
  adb wait-for-device
  echo "Waiting for the emulator to finish booting…"
  for _ in $(seq 1 90); do
    if [[ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == "1" ]]; then
      booted="$(adb devices | awk 'NR>1 && $2=="device" {print $1; exit}')"
      break
    fi
    sleep 2
  done
  if [[ -z "$booted" ]]; then
    echo "Emulator did not boot. See /tmp/seojae-emulator.log" >&2
    exit 1
  fi
fi

echo "Assembling the debug APK…"
(
  cd "$ROOT/android"
  ./gradlew :app:assembleDebug --no-daemon
)

mkdir -p "$(dirname "$COPY_APK")"
cp -f "$APK_OUT" "$COPY_APK"

echo "Installing on ${booted}…"
adb -s "$booted" install -r "$APK_OUT"
adb -s "$booted" shell am start -n com.seojae.app/.MainActivity

echo
echo "App launched on ${booted}."
echo "Debug APK: $COPY_APK"
echo "A physical phone can install the same file with:"
echo "  adb install -r dist/seojae-debug.apk"
