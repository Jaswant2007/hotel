import { useRef, useEffect } from 'react'

export default function OtpInput({ length = 6, value = '', onChange, disabled = false }) {
  const inputsRef = useRef([])

  useEffect(() => {
    // Focus first empty input or the first one on mount
    const firstEmptyIndex = value.length < length ? value.length : 0
    if (inputsRef.current[firstEmptyIndex]) {
      inputsRef.current[firstEmptyIndex]?.focus()
    }
  }, [])

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, '')
    if (!val) {
      const newOtp = value.split('')
      newOtp[index] = ''
      onChange(newOtp.join(''))
      return
    }

    // If pasted or multiple characters
    if (val.length > 1) {
      const digits = val.slice(0, length).split('')
      const newOtp = digits.join('')
      onChange(newOtp)
      const nextIndex = Math.min(digits.length, length - 1)
      inputsRef.current[nextIndex]?.focus()
      return
    }

    // Single digit entry
    const newOtpArr = value.split('')
    newOtpArr[index] = val
    const newOtp = newOtpArr.join('')
    onChange(newOtp)

    if (index < length - 1 && val) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        inputsRef.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      inputsRef.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault()
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length)
    if (pasted) {
      onChange(pasted)
      const targetIndex = Math.min(pasted.length, length - 1)
      inputsRef.current[targetIndex]?.focus()
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => (inputsRef.current[idx] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          disabled={disabled}
          value={value[idx] || ''}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          className="h-12 w-11 sm:h-14 sm:w-12 text-center font-mono text-xl font-bold text-stone-900 bg-white border border-stone-300 rounded-xl shadow-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-all disabled:bg-stone-100 disabled:opacity-50"
        />
      ))}
    </div>
  )
}
