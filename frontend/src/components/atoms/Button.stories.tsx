import type { Meta, StoryObj } from '@storybook/react';
import Button from './Buttons';

const meta: Meta<typeof Button> = {
  title: 'Components/Atoms/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    type: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    type: 'secondary',
    children: 'Secondary Button',
  },
};

export const Success: Story = {
  args: {
    type: 'success',
    children: 'Success Button',
  },
};

export const Danger: Story = {
  args: {
    type: 'danger',
    children: 'Danger Button',
  },
};

export const Large: Story = {
  args: {
    type: 'primary',
    size: 'lg',
    children: 'Large Button',
  },
};

export const Small: Story = {
  args: {
    type: 'primary',
    size: 'sm',
    children: 'Small Button',
  },
};

export const Outline: Story = {
  args: {
    type: 'primary',
    outline: true,
    children: 'Outline Button',
  },
};

export const Rounded: Story = {
  args: {
    type: 'primary',
    rounded: true,
    children: 'Rounded Button',
  },
}; 