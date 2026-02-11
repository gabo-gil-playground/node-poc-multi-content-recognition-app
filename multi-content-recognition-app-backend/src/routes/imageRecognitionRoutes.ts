import express from 'express';
import multer from 'multer';

import { handleImageRecognition } from '../controllers/imageRecognitionController';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB hard limit to protect the API
  }
});

export const imageRecognitionRouter = express.Router();

/**
 * POST /api/v1/vision/recognize
 * Receives an image via multipart-form upload and returns recognized text.
 */
imageRecognitionRouter.post('/recognize', upload.single('image'), handleImageRecognition);

