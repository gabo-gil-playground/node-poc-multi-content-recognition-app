import { openAiClient, OPENAI_VISION_MODEL } from '../config/openaiConfig';
import { logger } from '../logger/logger';

/**
 * System prompt used to constrain the vision model behaviour.
 * The goal is to obtain a privacy‑preserving, plain English description of
 * non‑sensitive objects only.
 */
const SYSTEM_PROMPT =
  'You are an expert in image recognition. ' +
  'Describe ONLY the non-sensitive physical objects detected in the image, ' +
  'excluding people, faces, animals, license plates, texts that reveal identities, or any private information. ' +
  'Return a concise plain English list of objects without any additional commentary, suggestions, guesses, or formatting.';

export interface ImageRecognitionRequest {
  /** Raw image bytes as received from the HTTP multipart upload. */
  readonly imageBuffer: Buffer;
  /** MIME type of the uploaded image, e.g. image/jpeg. */
  readonly mimeType: string;
}

/**
 * Calls the AI provider (currently OpenAI) to perform low‑detail vision
 * recognition over the provided image and returns the plain text description.
 */
export const recognizeImageContent = async (input: ImageRecognitionRequest): Promise<string> => {
  logger.info('Starting image recognition service call.');

  if (!input.imageBuffer || input.imageBuffer.length === 0) {
    logger.warn('Image recognition requested with an empty buffer.');
    throw new Error('Image buffer is empty. Unable to process image.');
  }

  const base64Image = input.imageBuffer.toString('base64');

  logger.debug('Image buffer converted to base64 for OpenAI request.', {
    bufferSize: input.imageBuffer.length
  });

  try {
    logger.info('Sending image to OpenAI vision endpoint.', {
      model: OPENAI_VISION_MODEL,
      mimeType: input.mimeType
    });

    const response: any = await (openAiClient as any).chat.completions.create({
      model: OPENAI_VISION_MODEL,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this image and describe only the non-sensitive physical objects.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${input.mimeType};base64,${base64Image}`,
                detail: 'low'
              }
            }
          ]
        }
      ]
    });

    const text: string = response.choices?.[0]?.message?.content ?? '';

    logger.info('Image recognition service call completed successfully.', {
      textLength: text.length
    });

    if (!text.trim()) {
      logger.warn('OpenAI returned an empty description for the image.');
      throw new Error('Image could not be interpreted. No description was returned.');
    }

    return text.trim();
  } catch (error) {
    logger.error('Error while calling OpenAI vision service.', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
};


