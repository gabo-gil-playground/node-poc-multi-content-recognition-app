import { recognizeImageContent } from '../src/services/imageRecognitionService';

jest.mock('../src/config/openaiConfig', () => {
  return {
    OPENAI_VISION_MODEL: 'gpt-4o-mini',
    openAiClient: {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: 'table, chair, lamp'
                }
              }
            ]
          })
        }
      }
    }
  };
});

describe('imageRecognitionService', () => {
  it('throws an error when buffer is empty', async () => {
    await expect(
      recognizeImageContent({
        imageBuffer: Buffer.from([]),
        mimeType: 'image/jpeg'
      })
    ).rejects.toThrow('Image buffer is empty. Unable to process image.');
  });

  it('returns recognized text when OpenAI responds successfully', async () => {
    const result = await recognizeImageContent({
      imageBuffer: Buffer.from([1, 2, 3]),
      mimeType: 'image/jpeg'
    });

    expect(result).toBe('table, chair, lamp');
  });

  it('throws an error when OpenAI returns empty content', async () => {
    const mockedModule = require('../src/config/openaiConfig');
    mockedModule.openAiClient.chat.completions.create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: ''
          }
        }
      ]
    });

    await expect(
      recognizeImageContent({
        imageBuffer: Buffer.from([1, 2, 3]),
        mimeType: 'image/jpeg'
      })
    ).rejects.toThrow('Image could not be interpreted. No description was returned.');
  });

  it('propagates errors from OpenAI', async () => {
    const mockedModule = require('../src/config/openaiConfig');
    mockedModule.openAiClient.chat.completions.create.mockRejectedValueOnce(new Error('network failure'));

    await expect(
      recognizeImageContent({
        imageBuffer: Buffer.from([1, 2, 3]),
        mimeType: 'image/jpeg'
      })
    ).rejects.toThrow('network failure');
  });
});

