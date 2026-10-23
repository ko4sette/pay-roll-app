export const POSITION_RATES = {
  Manager: 150,
  Barista: 120,
  Cashier: 100,
  "Kitchen staff": 120,
  "Service crew": 100,
} as const;

export type Position = keyof typeof POSITION_RATES;

export const POSITIONS = Object.keys(POSITION_RATES) as Position[];

export const POSITION_DESCRIPTIONS: Record<Position, string> = {
  Manager: "Oversees cafe operations",
  Barista: "Prepares coffee and drinks",
  Cashier: "Handles cashier duties",
  "Kitchen staff": "Prepares food and snacks",
  "Service crew": "Serves customers and cleans tables",
};
