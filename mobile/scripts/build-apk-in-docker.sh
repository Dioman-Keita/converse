#!/usr/bin/env bash
# Builds the release APK inside an eclipse-temurin:17-jdk container — nothing to install
# on the host but Docker. Usage (from the repository root):
#
#   docker run --rm -v "$PWD/mobile:/project" \
#     -v converse-android-sdk:/sdk -v converse-android-gradle:/root/.gradle \
#     -v converse-node:/opt/node -v converse-npm:/root/.npm \
#     -e VERSION_NAME=0.1.0 [signing env] eclipse-temurin:17-jdk bash /project/scripts/build-apk-in-docker.sh
#
# Signing (optional): ANDROID_KEYSTORE_PATH, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS,
# ANDROID_KEY_PASSWORD. The APK is written to mobile/dist/.
set -euo pipefail

SDK=/sdk
NODE_VERSION=22.12.0
CMDLINE_TOOLS=commandlinetools-linux-11076708_latest.zip
export DEBIAN_FRONTEND=noninteractive

apt-get update -qq >/dev/null && apt-get install -y -qq --no-install-recommends unzip curl git xz-utils >/dev/null

# Node.js (cached in a volume)
if [ ! -x "/opt/node/bin/node" ]; then
  echo "Installing Node.js $NODE_VERSION…"
  curl -fsSL "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz" | tar -xJ -C /opt/node --strip-components=1
fi
export PATH="/opt/node/bin:$PATH"

# Android SDK command-line tools (cached in a volume); AGP downloads the platform,
# build tools and NDK the generated project asks for.
if [ ! -x "$SDK/cmdline-tools/latest/bin/sdkmanager" ]; then
  echo "Installing Android command-line tools…"
  curl -fsSL "https://dl.google.com/android/repository/$CMDLINE_TOOLS" -o /tmp/tools.zip
  rm -rf /tmp/tools && mkdir -p "$SDK/cmdline-tools" && unzip -q /tmp/tools.zip -d /tmp/tools
  rm -rf "$SDK/cmdline-tools/latest" && mv /tmp/tools/cmdline-tools "$SDK/cmdline-tools/latest"
fi
# `yes` dies of SIGPIPE once sdkmanager is done: don't let pipefail treat that as a failure.
(yes || true) | "$SDK/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$SDK" --licenses >/dev/null
export ANDROID_HOME="$SDK" ANDROID_SDK_ROOT="$SDK"

# Work on a copy: the host's node_modules may be built for another OS.
rm -rf /work && mkdir /work
tar -C /project --exclude=node_modules --exclude=android --exclude=dist --exclude=.expo -cf - . | tar -C /work -xf -
cd /work

echo "Installing JavaScript dependencies…"
npm ci --no-audit --no-fund --loglevel=error

echo "Generating the native Android project…"
CI=1 npx expo prebuild --platform android --no-install

echo "Building the release APK (version ${VERSION_NAME:-0.0.0})…"
cd android
# arm64 only (every phone from the last ~8 years) keeps the build small and the APK light.
./gradlew assembleRelease --no-daemon --console=plain -q --max-workers=2 \
  -PreactNativeArchitectures=arm64-v8a -Porg.gradle.jvmargs="-Xmx2g -XX:MaxMetaspaceSize=512m" -Pkotlin.compiler.execution.strategy=in-process

mkdir -p /project/dist
cp app/build/outputs/apk/release/app-release.apk "/project/dist/converse-${VERSION_NAME:-0.0.0}.apk"
ls -l /project/dist
