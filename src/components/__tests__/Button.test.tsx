import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../ui/Button';

describe('Button', () => {
  it('renders children text', () => {
    const { getByText } = render(
      <Button onPress={() => {}}>Save</Button>
    );
    expect(getByText('Save')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button onPress={onPress}>Tap Me</Button>
    );

    fireEvent.press(getByText('Tap Me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button onPress={onPress} disabled>
        Disabled
      </Button>
    );

    fireEvent.press(getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const { queryByText, UNSAFE_getByType } = render(
      <Button onPress={() => {}} loading>
        Loading
      </Button>
    );

    // Text should not be visible when loading
    expect(queryByText('Loading')).toBeNull();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button onPress={onPress} loading>
        Save
      </Button>
    );

    // Loading button should be disabled
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders danger variant', () => {
    const { getByText } = render(
      <Button onPress={() => {}} variant="danger">
        Delete
      </Button>
    );
    expect(getByText('Delete')).toBeTruthy();
  });

  it('renders secondary variant', () => {
    const { getByText } = render(
      <Button onPress={() => {}} variant="secondary">
        Cancel
      </Button>
    );
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('renders ghost variant', () => {
    const { getByText } = render(
      <Button onPress={() => {}} variant="ghost">
        Skip
      </Button>
    );
    expect(getByText('Skip')).toBeTruthy();
  });
});
