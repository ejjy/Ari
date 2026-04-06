import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Input from '../ui/Input';

describe('Input', () => {
  it('renders with label', () => {
    const { getByText } = render(
      <Input label="Email" placeholder="you@example.com" />
    );
    expect(getByText('Email')).toBeTruthy();
  });

  it('renders placeholder', () => {
    const { getByPlaceholderText } = render(
      <Input placeholder="Enter text" />
    );
    expect(getByPlaceholderText('Enter text')).toBeTruthy();
  });

  it('calls onChangeText when typing', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <Input placeholder="Type here" onChangeText={onChangeText} />
    );

    fireEvent.changeText(getByPlaceholderText('Type here'), 'hello');
    expect(onChangeText).toHaveBeenCalledWith('hello');
  });

  it('shows error message', () => {
    const { getByText } = render(
      <Input label="Name" error="Name is required" />
    );
    expect(getByText('Name is required')).toBeTruthy();
  });

  it('renders password toggle when showPasswordToggle is true', () => {
    const { getByLabelText } = render(
      <Input label="Password" showPasswordToggle />
    );
    expect(getByLabelText('Toggle password visibility')).toBeTruthy();
  });

  it('toggles password visibility on press', () => {
    const { getByLabelText } = render(
      <Input label="Password" showPasswordToggle />
    );

    const toggle = getByLabelText('Toggle password visibility');
    fireEvent.press(toggle);
    // Should still be there after toggle
    expect(getByLabelText('Toggle password visibility')).toBeTruthy();
  });
});
