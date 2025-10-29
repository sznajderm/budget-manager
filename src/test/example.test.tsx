import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Example component test
describe('Example Test', () => {
  it('should render and interact', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<button onClick={handleClick}>Click me</button>);

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
