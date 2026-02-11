if (typeof global.clearImmediate === 'undefined') {
  // Basic polyfill for environments where clearImmediate is missing.
  // eslint-disable-next-line no-undef
  global.clearImmediate = (id) => clearTimeout(id);
}
if (typeof global.setImmediate === 'undefined') {
  // eslint-disable-next-line no-undef
  global.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args);
}

jest.mock('expo-speech-recognition', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  getStateAsync: jest.fn().mockResolvedValue({ isAvailable: true }),
  startAsync: jest.fn().mockResolvedValue(undefined),
  stopAsync: jest.fn().mockResolvedValue(undefined)
}));

