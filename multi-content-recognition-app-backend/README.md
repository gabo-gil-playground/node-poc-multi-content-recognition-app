## Multi Recognition POC – Backend

This backend is a small, focused Node.js + TypeScript service that exposes a single AI‑vision endpoint used by the Multi Recognition POC frontend.

The API accepts an image via multipart form data, forwards it to an AI vision provider (currently OpenAI) with a strict privacy‑oriented system prompt, and returns a plain English description of non‑sensitive physical objects.

### Tech stack

- Node.js (>= 20)
- TypeScript
- Express
- Multer (multipart/form‑data handling)
- OpenAI Node SDK (`gpt-4o-mini`, `detail: low`)
- Jest + ts‑jest for unit tests
- ESLint for static analysis

### Environment configuration

Configuration is centralized in `src/config/env.ts` and read from environment variables.

Required variables (see root `.env.example`):

- `AI_VISION_API_KEY` – API key for the AI vision provider
- `AI_VISION_PROVIDER_URL` – base URL for the AI provider (e.g. `https://api.openai.com/v1`)
- `BACKEND_HOST` – interface to bind the HTTP server to (default: `0.0.0.0`)
- `BACKEND_PORT` – port for the HTTP server (default: `4000`)

> The root `.env` file is ignored by Git; do not commit credentials or API keys.

### Scripts

From `multi-content-recognition-app-backend`:

- `npm run build` – compile TypeScript to JavaScript into `dist`
- `npm run dev` – start the development server with live reload
- `npm start` – start the compiled server from `dist`
- `npm test` – run unit tests once
- `npm run test:watch` – run tests in watch mode
- `npm run test:coverage` – run tests with HTML and CI‑friendly coverage reports
- `npm run lint` – run ESLint on the `src` directory

### API

#### `POST /api/v1/vision/recognize`

- **Request**
  - Content‑Type: `multipart/form-data`
  - Field name: `image`
  - Payload: image file (JPEG/PNG, up to 10 MB)
- **Success response (200)**
  - Body: `{ "text": "comma‑separated list or short description of objects" }`
- **Error response (400)**
  - Body: `{ "error": "Unable to process the provided image. Please verify the file and try again." }` or a similar descriptive message.

### Architecture and modules

- `src/logger/logger.ts`
  - Small wrapper around `console` providing `debug`, `info`, `warn`, and `error` with timestamps and contextual JSON metadata.
  - Designed so it can be swapped for a more advanced logger without changing call sites.

- `src/config/env.ts`
  - Reads and validates environment variables (via `dotenv`).
  - Exposes a strongly typed `appConfig` object used by the rest of the application.

- `src/config/openaiConfig.ts`
  - Maps generic config (`AI_VISION_API_KEY`, `AI_VISION_PROVIDER_URL`) into an `OpenAI` client instance.
  - Central place to switch to another provider in the future (acts as a proxy layer).

- `src/services/imageRecognitionService.ts`
  - Accepts a raw image buffer + MIME type.
  - Converts the buffer to base64 and calls the OpenAI Chat Completions API with the `gpt-4o-mini` model in low‑detail mode.
  - Adds a strict system message instructing the model to:
    - Only describe non‑sensitive physical objects.
    - Explicitly avoid people, faces, animals, license plates and any private information.
    - Return plain text only (no formatting or extra commentary).
  - Logs every significant step and rethrows errors to be handled at the API layer.

- `src/controllers/imageRecognitionController.ts`
  - HTTP controller that:
    - Validates that a file is present under the `image` field.
    - Delegates to `imageRecognitionService`.
    - Returns a `200` response with the recognized text, or `400` with a descriptive error message.

- `src/routes/imageRecognitionRoutes.ts`
  - Express router that wires `POST /recognize` with Multer memory storage and the controller.

- `src/app.ts`
  - Express app factory responsible for:
    - Security middleware (`helmet`)
    - CORS configuration
    - JSON body parsing
    - `/health` endpoint
    - Image recognition routes
    - Centralized error handler that always returns a clear, user‑friendly `400` error.

- `src/server.ts`
  - Bootstraps the HTTP server using `appConfig` and logs startup information.

### Testing

- Service tests:
  - `tests/imageRecognitionService.test.ts` mocks the OpenAI client and verifies:
    - behaviour with an empty buffer (error)
    - successful recognition
    - handling of empty model responses
    - error propagation from the provider
- Controller tests:
  - `tests/imageRecognitionController.test.ts` uses `supertest` to validate:
    - missing image handling (400)
    - happy‑path response with mocked service
    - mapping of service errors to a 400 HTTP response

The target is to keep unit coverage close to 100% for newly introduced code while focusing primarily on happy paths and key edge cases.

