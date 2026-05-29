import { useRef } from "react";

/**
 * 4-digit PIN input matching existing OTP box styling on the login screen.
 */
function PinInput({
  values,
  onChange,
  onKeyDown,
  pinError = false,
  activeIndex,
  onActiveIndexChange,
  hidden = false,
  autoFocusIndex = 0,
  inputClassName = "",
}) {
  const refs = [useRef(), useRef(), useRef(), useRef()];

  const handleChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;
    const next = [...values];
    next[index] = value;
    onChange(next);
    if (value !== "" && index < 3) {
      refs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
    onKeyDown?.(index, e);
  };

  return (
    <div className="mb-4 flex flex-wrap items-center justify-center">
      {values.map((value, index) => {
        const isActive = activeIndex === index && !pinError;
        return (
          <input
            key={index}
            ref={refs[index]}
            type={hidden ? "password" : "text"}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            className={`m-[15px] h-[50px] w-[70px] rounded-3xl border bg-white text-center text-[1.15rem] transition focus:outline-none ${pinError ? "border-red-500" : "border-[#cbcfd5]"
              } ${isActive
                ? "ring-4 ring-blue-500/40"
                : "shadow-[0_2px_5px_rgba(0,0,0,0.1)]"
              } ${inputClassName}`}
            value={value}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onFocus={() => onActiveIndexChange?.(index)}
            onBlur={() =>
              onActiveIndexChange?.((prev) => (prev === index ? null : prev))
            }
            onMouseEnter={() => onActiveIndexChange?.(index)}
            onMouseLeave={() =>
              onActiveIndexChange?.((prev) => (prev === index ? null : prev))
            }
            maxLength={1}
            autoFocus={index === autoFocusIndex}
            aria-label={`PIN digit ${index + 1}`}
          />
        );
      })}
    </div>
  );
}

export default PinInput;
