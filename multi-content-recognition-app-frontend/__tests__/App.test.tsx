import { render, waitFor } from '@testing-library/react-native';

import App from '../App';

describe('App root component', () => {
  it('renders the main title', async () => {
    const { getByText } = render(<App />);

    // Wait for splash screen to hide and component to render (2 seconds delay + async operations)
    await waitFor(
      () => {
        expect(getByText('Multi Recognition POC')).toBeTruthy();
      },
      { timeout: 3500 }
    );
  });
});

