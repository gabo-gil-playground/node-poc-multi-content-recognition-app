## Multi Recognition POC – Frontend

This project is the Expo React Native frontend for the **Multi Recognition POC**. It provides a single, modern, minimalistic screen where users can choose between three input modes:

- **Text** – manual text entry inside a modal dialog.
- **Voice** – speech‑to‑text capture using the device microphone.
- **Photo** – image‑to‑text using an AI vision backend.

All outputs are displayed in a dedicated read‑only area at the bottom of the screen.

### Tech stack

- Expo (Android, iOS, Web via Expo Go)
- React Native + TypeScript
- NativeWind + Tailwind CSS for styling
- `expo-image-picker` and `expo-image-manipulator` for image selection and compression
- `expo-speech-recognition` for speech‑to‑text
- Jest + jest‑expo + React Native Testing Library for tests

### Design language

- Light background with floating, rounded cards.
- High contrast between background, primary actions and text.
- Minimalistic layout inspired by high‑end UI/UX references (air, spacing, clear hierarchy).
- All labels are in English.

### Environment configuration

The frontend reads the backend URL from a public Expo variable:

- `EXPO_PUBLIC_BACKEND_URL` – base URL of the backend API (e.g. `http://localhost:4000`)

This variable is defined in the root `.env` file (see `.env.example`) and automatically exposed by Expo at build/runtime.

### Running the app

From the project root (monorepo):

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the backend:

   ```bash
   npm run dev:backend
   ```

3. Start the Expo dev server:

   ```bash
   npm run dev:frontend
   ```

4. Open the app:
   - **Android / iOS**: use Expo Go and scan the QR code shown in the terminal or Expo Dev Tools.
   - **Web**: press `w` in the Expo CLI or run `npm run web` inside the frontend directory.

### Main screen behaviour

- **Input selection**
  - Three buttons: `Text`, `Voice`, `Photo`.
  - A footer area ensures OS system buttons (especially on Android) remain visually separated from the app.

- **Text input**
  - Opens a modal with a multi‑line text field.
  - On **Confirm**, the text is stored and rendered as read‑only content.
  - On **Cancel**, the modal is dismissed without updating the result area.
  - No backend calls are performed for this flow.

- **Voice input**
  - Opens a modal with a large “Listening” button.
  - Uses `expo-speech-recognition` to capture speech and update text in near real‑time.
  - Once the user stops, the final text remains in the read‑only area.
  - No backend calls are performed for this flow.

- **Photo input**
  - Uses `expo-image-picker` to select an image from the gallery.
  - The image is resized so that its largest side is at most **1080px**, preserving aspect ratio.
  - JPEG quality is reduced to **70%** to save bandwidth.
  - The compressed image is then sent to the backend as `multipart/form-data` with field name `image`.
  - Backend response text is displayed in the read‑only area.
  - HTTP errors or network issues are surfaced via console‑based toasts.

### Splash screen and icon

- `app.json` configures:
  - App name: **Multi Recognition POC**
  - Light splash screen with the project logo for 2 seconds (Expo manages the timing automatically while the app loads).
  - Platform‑specific icons (`icon.png`, `adaptive-icon.png`, `favicon.png`).

### Testing

From `multi-content-recognition-app-frontend`:

- `npm test` – run tests once
- `npm run test:watch` – test in watch mode
- `npm run test:coverage` – tests with HTML and CI‑friendly coverage

The test setup (`jest.setup.js`) mocks `expo-speech-recognition` and adds small polyfills used by React Native internals to keep tests deterministic.

