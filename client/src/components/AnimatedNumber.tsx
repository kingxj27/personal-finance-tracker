import { useEffect, useRef, useState } from "react";
import { useCurrency } from "../contexts/CurrencyContext";

interface AnimatedNumberProps {
  value: number;
  duration?: number;         // ms
  prefix?: string;           // e.g. "₦"
  suffix?: string;           // e.g. "%"
  formatFn?: (v: number) => string;
  className?: string;
}

function easeOutExpo(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function AnimatedNumber({
  value,
  duration = 1200,
  prefix = "",
  suffix = "",
  formatFn,
  className,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const from = prevValue.current;
    const to = value;
    prevValue.current = value;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current = null;

    function step(ts: number) {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplay(to);
      }
    }

    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration]);

  const formatted = formatFn
    ? formatFn(display)
    : display.toLocaleString("en-NG");

  return (
    <span className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}

/* Currency-aware animated amount — respects the active currency from context */
export function AnimatedNGN({ value, className }: { value: number; className?: string }) {
  const { currency, convert } = useCurrency();
  const convertedTarget = Math.round(Math.max(0, convert(value)));

  return (
    <AnimatedNumber
      value={convertedTarget}
      prefix={currency.symbol}
      formatFn={(v) =>
        currency.code === "NGN"
          ? v.toLocaleString("en-NG")
          : v >= 1000
          ? Math.round(v).toLocaleString()
          : v.toLocaleString(undefined, { maximumFractionDigits: 2 })
      }
      className={className}
    />
  );
}

/* Pre-wired variant for percentages */
export function AnimatedPercent({ value, className }: { value: number; className?: string }) {
  return (
    <AnimatedNumber
      value={Math.round(Math.max(0, value))}
      suffix="%"
      className={className}
    />
  );
}
