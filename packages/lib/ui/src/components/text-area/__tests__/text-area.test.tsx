/**
 * Unit tests for TextArea.
 *
 * Scope: DOM shape, attribute forwarding, ref forwarding, resize-class
 * application. TextArea has no focus-delegation logic, so jsdom is
 * sufficient — no browser-test sibling.
 */

import { render, screen } from '@solidjs/testing-library';
import TextArea from '../text-area';

describe('TextArea', () => {
  it('renders a <textarea> inside a wrapping <div>', () => {
    render(() => <TextArea testId="area" />);
    const wrapper = screen.getByTestId('area');
    expect(wrapper.tagName).toBe('DIV');
    expect(wrapper.querySelector('textarea')).not.toBeNull();
  });

  it('forwards native <textarea> attributes', () => {
    render(() => (
      <TextArea
        testId="area"
        placeholder="Tell us"
        name="feedback"
        rows={5}
        value="hi"
      />
    ));
    const textarea = screen.getByTestId('area').querySelector('textarea')!;
    expect(textarea).toHaveAttribute('placeholder', 'Tell us');
    expect(textarea).toHaveAttribute('name', 'feedback');
    expect(textarea).toHaveAttribute('rows', '5');
    expect(textarea).toHaveValue('hi');
  });

  it('forwards ref to the inner <textarea>', () => {
    let captured: HTMLTextAreaElement | undefined;
    render(() => <TextArea testId="area" ref={(el) => (captured = el)} />);
    expect(captured).toBeInstanceOf(HTMLTextAreaElement);
    expect(captured).toBe(screen.getByTestId('area').querySelector('textarea'));
  });

  it('reflects disabled and readOnly on the textarea', () => {
    render(() => <TextArea testId="a" disabled />);
    expect(screen.getByTestId('a').querySelector('textarea')).toBeDisabled();

    render(() => <TextArea testId="b" readOnly />);
    expect(screen.getByTestId('b').querySelector('textarea')).toHaveAttribute(
      'readonly',
    );
  });

  it('applies a different class when resize differs', () => {
    render(() => <TextArea testId="default" />);
    render(() => <TextArea testId="vertical" resize="vertical" />);
    render(() => <TextArea testId="both" resize="both" />);

    const defaultClasses = screen.getByTestId('default').className;
    const verticalClasses = screen.getByTestId('vertical').className;
    const bothClasses = screen.getByTestId('both').className;

    expect(verticalClasses).not.toBe(defaultClasses);
    expect(bothClasses).not.toBe(verticalClasses);
  });

  it('puts data-testid on the wrapping <div>', () => {
    render(() => <TextArea testId="area" />);
    const wrapper = screen.getByTestId('area');
    expect(wrapper.tagName).toBe('DIV');
    // The textarea itself does not echo the testId.
    expect(wrapper.querySelector('textarea')).not.toHaveAttribute(
      'data-testid',
    );
  });
});
