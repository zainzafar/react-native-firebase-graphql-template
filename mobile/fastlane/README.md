fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios build

```sh
[bundle exec] fastlane ios build
```

Build iOS: Release archive if signing is configured, otherwise Simulator Debug (no signing)

### ios beta

```sh
[bundle exec] fastlane ios beta
```

Upload to TestFlight (requires ASC_* or MATCH_*)

----


## Android

### android build

```sh
[bundle exec] fastlane android build
```

Build Android (dual-mode). Release if keystore present; otherwise Debug. Fails early if google-services.json required.

### android beta

```sh
[bundle exec] fastlane android beta
```

Upload to Google Play (track selectable via ANDROID_TRACK; default internal)

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
