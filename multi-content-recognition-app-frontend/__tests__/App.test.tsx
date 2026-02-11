import { render } from '@testing-library/react-native';

import App from '../App';

describe('App root component', () => {
  it('renders the main title', () => {
    const { getByText } = render(<App />);

    expect(getByText('Unified content capture')).toBeTruthy();
  });
});

