import { useState, useEffect } from 'react';

interface UseNumberInputOptions {
  min?: number;
  max?: number;
  defaultValue?: number;
  step?: number;
  onValueChange: (value: number) => void;
}

export const useNumberInput = (
  currentValue: number | undefined,
  options: UseNumberInputOptions
) => {
  const [inputValue, setInputValue] = useState<string>('');

  useEffect(() => {
    setInputValue(String(currentValue || options.defaultValue || 0));
  }, [currentValue, options.defaultValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value === '') {
      // Allow empty input temporarily, don't update the actual value yet
      return;
    }

    const numValue = options.step ? parseFloat(value) : parseInt(value);
    if (!isNaN(numValue)) {
      // Apply min/max constraints
      let clampedValue = numValue;
      if (options.min !== undefined) {
        clampedValue = Math.max(options.min, clampedValue);
      }
      if (options.max !== undefined) {
        clampedValue = Math.min(options.max, clampedValue);
      }
      options.onValueChange(clampedValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || isNaN(options.step ? parseFloat(value) : parseInt(value))) {
      const defaultValue = options.defaultValue || 0;
      setInputValue(String(defaultValue));
      options.onValueChange(defaultValue);
    } else {
      const numValue = options.step ? parseFloat(value) : parseInt(value);
      let clampedValue = numValue;
      if (options.min !== undefined) {
        clampedValue = Math.max(options.min, clampedValue);
      }
      if (options.max !== undefined) {
        clampedValue = Math.min(options.max, clampedValue);
      }
      setInputValue(String(clampedValue));
      options.onValueChange(clampedValue);
    }
  };

  return {
    value: inputValue,
    onChange: handleChange,
    onBlur: handleBlur,
  };
};
