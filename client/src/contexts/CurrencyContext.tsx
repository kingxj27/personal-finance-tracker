import { createContext, useContext, useState, type ReactNode } from "react";

export type Currency = {
  code: string;
  symbol: string;
  name: string;
  rateFromNGN: number; // 1 NGN = X of this currency
};

export const CURRENCIES: Currency[] = [
  { code: "NGN", symbol: "₦",   name: "Nigerian Naira",       rateFromNGN: 1 },
  { code: "USD", symbol: "$",   name: "US Dollar",             rateFromNGN: 0.000649 },
  { code: "EUR", symbol: "€",   name: "Euro",                  rateFromNGN: 0.000595 },
  { code: "GBP", symbol: "£",   name: "British Pound",         rateFromNGN: 0.000508 },
  { code: "CAD", symbol: "C$",  name: "Canadian Dollar",       rateFromNGN: 0.000885 },
  { code: "GHS", symbol: "₵",   name: "Ghana Cedi",            rateFromNGN: 0.0100 },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling",       rateFromNGN: 0.0833 },
  { code: "ZAR", symbol: "R",   name: "South African Rand",    rateFromNGN: 0.01205 },
];

interface CurrencyContextValue {
  currency: Currency;
  currencies: Currency[];
  setCurrency: (code: string) => void;
  /** Format a raw NGN amount into the selected currency string */
  format: (amountNGN: number) => string;
  /** Convert a raw NGN amount to the selected currency number */
  convert: (amountNGN: number) => number;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: CURRENCIES[0],
  currencies: CURRENCIES,
  setCurrency: () => {},
  format: (n) => "₦" + Math.round(Math.max(0, n)).toLocaleString(),
  convert: (n) => n,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currencyCode, setCurrencyCode] = useState(
    () => localStorage.getItem("currency") || "NGN"
  );

  const currency =
    CURRENCIES.find((c) => c.code === currencyCode) ?? CURRENCIES[0];

  function setCurrency(code: string) {
    localStorage.setItem("currency", code);
    setCurrencyCode(code);
  }

  function convert(amountNGN: number): number {
    return amountNGN * currency.rateFromNGN;
  }

  function format(amountNGN: number): string {
    const raw = Math.max(0, amountNGN);
    const converted = raw * currency.rateFromNGN;
    let formatted: string;
    if (currency.code === "NGN") {
      formatted = Math.round(converted).toLocaleString("en-NG");
    } else {
      // Show 2 decimal places for foreign currencies when value < 1000
      formatted =
        converted >= 1000
          ? Math.round(converted).toLocaleString()
          : converted.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    return `${currency.symbol}${formatted}`;
  }

  return (
    <CurrencyContext.Provider
      value={{ currency, currencies: CURRENCIES, setCurrency, format, convert }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
