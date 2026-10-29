# Jobin Expo development

Git branch development is the source for the Expo development preview workflow. It publishes to the EAS branch development and maps the development channel to it.

## Authentication and project linking
Store EXPO_TOKEN as a GitHub Actions repository secret. The workflow uses it without embedding its value in code. It links an existing configured project or creates/links @<token-account>/jobin using EAS init. EXPO_OWNER and EXPO_PROJECT_ID repository variables can select a specific organization or existing project.

The generated real app.json project ID and npm dependency lock are committed to development by the workflow bot. Commits using GITHUB_TOKEN do not recursively trigger Actions.

## Builds and viewing
The initial [expo-build] commit requests an Android development APK. Ordinary development pushes publish updates without requesting another native build. A manual workflow run on development can request android, ios or all.

The development profile includes expo-dev-client; Android uses a debug APK without production signing credentials. Install it, then open the published update in the development client. It is not a Play Store production release.

The iOS development profile targets a simulator. A physical iPhone needs Apple device provisioning or TestFlight. Simulator builds cannot be installed on an iPhone.

Both builds and updates use the preview EAS environment and fingerprint runtime policy. Changes to native dependencies or permissions require a matching new build. Update/build result JSON files, including Expo links, are saved as the expo-development-results Actions artifact.

## Commands
After installing EAS CLI and authenticating:
```sh
npm install
npm run expo:configure
npx eas-cli@27.1.0 update --branch development --environment preview --non-interactive
npx eas-cli@27.1.0 build --profile development --platform android
```

Official CI reference: https://docs.expo.dev/build/building-on-ci/
