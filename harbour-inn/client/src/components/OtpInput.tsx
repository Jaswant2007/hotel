import React, { useRef, useEffect } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
  autoFocus = true,
}) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  // Auto focus first empty input or input 0 on mount
  useEffect(() => {
    if (autoFocus && !disabled) {
      const firstEmpty = digits.findIndex((d) => !d);
      const targetIdx = firstEmpty === -1 ? 0 : firstEmpty;
      inputsRef.current[targetIdx]?.focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Keep only numbers
    const cleaned = rawVal.replace(/\D/g, '');

    if (!cleaned) {
      // Clear active digit
      const nextArr = [...digits];
      nextArr[index] = '';
      const nextCode = nextArr.join('');
      onChange(nextCode);
      return;
    }

    if (cleaned.length > 1) {
      // Multiple digits entered or autofill applied to this field
      handlePastedCode(cleaned);
      return;
    }

    const nextArr = [...digits];
    nextArr[index] = cleaned;
    const nextCode = nextArr.join('');
    onChange(nextCode);

    // Auto-advance to next box
    if (index < 5 && cleaned) {
      inputsRef.current[index + 1]?.focus();
    }

    if (nextCode.length === 6 && onComplete) {
      onComplete(nextCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move back and clear previous digit
        e.preventDefault();
        const nextArr = [...digits];
        nextArr[index - 1] = '';
        onChange(nextArr.join(''));
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text/plain');
    handlePastedCode(pasted);
  };

  const handlePastedCode = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '').slice(0, 6);
    if (!cleaned) return;

    onChange(cleaned);

    const nextIndex = Math.min(cleaned.length, 5);
    inputsRef.current[nextIndex]?.focus();

    if (cleaned.length === 6 && onComplete) {
      onComplete(cleaned);
    }
  };

  return (
    <div
      role="group"
      aria-label="6-digit verification code"
      className="flex items-center justify-between gap-2 sm:gap-3"
    >
      {Array.from({ length: 6 }).map((_, idx) => {
        const digit = digits[idx] || '';
        return (
          <input
            key={idx}
            ref={(el) => (inputsRef.current[idx] = el)}
            type="text"
            inputMode="numeric"
            autoComplete={idx === 0 ? 'one-time-code' : 'off'}
            pattern="[0-9]*"
            maxLength={6} // Allows mobile browser autofill to paste full code into 1st box
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(idx, e)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            aria-label={`Digit ${idx + 1} of 6`}
            className={`w-11 h-14 sm:w-13 sm:h-16 text-center text-2xl font-bold font-mono rounded-lg border transition-all duration-200 outline-none ${
              hasError
                ? 'border-red-400 bg-red-50/50 text-red-900 focus:border-red-600 focus:ring-2 focus:ring-red-400'
                : 'border-neutral-border bg-white text-primary-900 hover:border-primary-300 focus:border-primary focus:ring-2 focus:ring-focusRing'
            } ${disabled ? 'opacity-50 cursor-not-allowed bg-neutral-100' : ''}`}
          />
        );
      })}
    </div>
  );
};
