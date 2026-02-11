import type { Request, Response, NextFunction } from 'express';

import { logger } from '../logger/logger';
import { recognizeImageContent } from '../services/imageRecognitionService';

/**
 * Express controller responsible for orchestrating the image recognition flow.
 * It validates the request, delegates the heavy work to the service and
 * translates domain errors into HTTP responses.
 */
export const handleImageRecognition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  logger.info('HTTP request received for image recognition endpoint.');

  try {
    const file = req.file;

    if (!file) {
      logger.warn('Image recognition request received without an image file.');
      res.status(400).json({ error: 'Image file is required under field "image".' });
      return;
    }

    logger.debug('Image file successfully received by controller.', {
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size
    });

    const recognizedText = await recognizeImageContent({
      imageBuffer: file.buffer,
      mimeType: file.mimetype
    });

    logger.info('Image successfully processed. Returning recognized text to client.');

    res.status(200).json({ text: recognizedText });
  } catch (error) {
    logger.error('Error while handling image recognition request.', {
      error: error instanceof Error ? error.message : String(error)
    });
    // Delegate to centralized error handler.
    next(error);
  }
};

