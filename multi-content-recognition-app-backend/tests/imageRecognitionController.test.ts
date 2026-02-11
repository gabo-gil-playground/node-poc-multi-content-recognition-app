import request from 'supertest';

import { createApp } from '../src/app';

jest.mock('../src/services/imageRecognitionService', () => ({
  recognizeImageContent: jest.fn().mockResolvedValue('recognized text from image')
}));

describe('imageRecognitionController', () => {
  const app = createApp();

  it('returns 400 when image file is missing', async () => {
    const response = await request(app).post('/api/v1/vision/recognize');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Image file is required under field "image".');
  });

  it('returns 200 and recognized text when image is provided', async () => {
    const response = await request(app)
      .post('/api/v1/vision/recognize')
      .attach('image', Buffer.from([1, 2, 3]), {
        filename: 'test.jpg',
        contentType: 'image/jpeg'
      });

    expect(response.status).toBe(200);
    expect(response.body.text).toBe('recognized text from image');
  });

  it('returns 400 when service throws an error', async () => {
    const { recognizeImageContent } = require('../src/services/imageRecognitionService');
    recognizeImageContent.mockRejectedValueOnce(new Error('service failure'));

    const response = await request(createApp())
      .post('/api/v1/vision/recognize')
      .attach('image', Buffer.from([1, 2, 3]), {
        filename: 'test.jpg',
        contentType: 'image/jpeg'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      'Unable to process the provided image. Please verify the file and try again.'
    );
  });
});

