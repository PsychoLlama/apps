import { render } from '@solidjs/testing-library';
import App from '../app';

test('renders without crashing', () => {
  const { container } = render(() => <App />);
  expect(container.innerHTML).not.toBe('');
});
