import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from '../atoms/Buttons';

describe('Button Component', () => {
  it('renders button with correct text', () => {
    render(<Button type="primary">Click me</Button>);
    expect(
      screen.getByRole('button', { name: /click me/i })
    ).toBeInTheDocument();
  });

  it('applies correct CSS classes based on props', () => {
    render(
      <Button type="primary" size="lg" rounded outline>
        Test Button
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass(
      'btn-primary',
      'btn-lg',
      'rounded-pill',
      'btn-outline-primary'
    );
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(
      <Button type="primary" onClick={handleClick}>
        Click me
      </Button>
    );

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders with default props', () => {
    render(<Button>Default Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-primary');
  });
});
