## Multi Recognition POC

**Multi Recognition POC** is a proof‑of‑concept application that allows users to provide content using three different input modes:

- **Text**: manual text entry
- **Voice**: speech‑to‑text using device microphone
- **Photo**: image‑to‑text using an AI vision provider

The project is structured as a small monorepo with two sub‑projects:

- `multi-content-recognition-app-frontend`: Expo React Native app (TypeScript + Tailwind via NativeWind)
- `multi-content-recognition-app-backend`: Node.js + TypeScript API that proxies an AI vision provider (OpenAI)

All code, documentation and error messages are written in English by design.

### Tech stack overview

- **Frontend**
  - Expo (Android, iOS, Web via Expo Go)
  - React Native with TypeScript
  - NativeWind + Tailwind for styling
  - `expo-image-picker` and `expo-image-manipulator` for photo selection and compression
  - `expo-speech-recognition` for speech‑to‑text
- **Backend**
  - Node.js + TypeScript
  - Express + Multer for HTTP API and multipart form handling
  - OpenAI SDK (configured for `gpt-4o-mini` in `detail: low` mode)

### Environment configuration

Configuration is shared through a root `.env` file (not committed to version control). An example is available in `.env.example`:

```bash
AI_VISION_API_KEY=your-openai-api-key
AI_VISION_PROVIDER_URL=https://api.openai.com/v1
BACKEND_HOST=0.0.0.0
BACKEND_PORT=4000
EXPO_PUBLIC_BACKEND_URL=http://localhost:4000
```

> Copy `.env.example` to `.env` at the root of the repository and fill in the values before running the app.

### Scripts

From the monorepo root:

- **Install all dependencies**
  - `npm install`
- **Backend**
  - `npm run dev:backend` – start backend in watch mode
  - `npm run test:backend` – run backend unit tests
- **Frontend**
  - `npm run dev:frontend` – start Expo dev server (Expo Go)
  - `npm run test:frontend` – run frontend tests

### High‑level architecture

- The **frontend** allows the user to pick one of three input modes (Text, Voice, Photo) from a single main screen and always renders the resulting text in a dedicated read‑only area.
- For **Text** and **Voice** inputs the transformation to text happens fully on the device, without calling the backend.
- For **Photo** input the image is resized (maximum dimension 1080px, 70% JPEG quality) and then sent as multipart form data to the backend, which calls the AI vision provider and returns a plain text description.

Each sub‑project has its own `README.md` with more detailed instructions.
