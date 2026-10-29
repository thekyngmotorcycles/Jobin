# Register the Expo/EAS project

The app is already an Expo SDK 54 project. Registering its cloud project additionally requires an authorized Expo account; no Expo credentials are stored in this repository.

From a local checkout:
```sh
npm install
npx eas-cli@latest login
npx eas-cli@latest whoami
npx eas-cli@latest init
```

Select the intended account/organization and Jobin. EAS init writes the real project UUID into app.json under expo.extra.eas.projectId. Commit the generated app.json update. Never invent a project UUID or place an Expo access token in app.json.

Then run:
```sh
npx eas-cli@latest build --platform android --profile preview
npx eas-cli@latest build --platform ios --profile preview
```

Camera/media modules require a compatible development/native build to validate permissions. SDK 54 may need a matching Expo Go build rather than the latest app-store version.
