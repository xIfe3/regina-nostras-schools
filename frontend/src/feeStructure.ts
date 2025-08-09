// feeStructure.ts
interface FeeStructure {
  [session: string]: {
    [className: string]: {
      [term: string]: number;
    };
  };
}

export const feeStructure: FeeStructure = {
  "2025/2026": {
    "Pre-Nursery": {
      "1st Term": 120000,
      "2nd Term": 100000,
      "3rd Term": 100000,
    },
    "Nursery 1": {
      "1st Term": 130000,
      "2nd Term": 110000,
      "3rd Term": 110000,
    },
    "Nursery 2": {
      "1st Term": 135000,
      "2nd Term": 115000,
      "3rd Term": 115000,
    },
    "Primary 1": {
      "1st Term": 175000,
      "2nd Term": 150000,
      "3rd Term": 150000,
    },
    "Primary 2": {
      "1st Term": 180000,
      "2nd Term": 155000,
      "3rd Term": 155000,
    },
    "Primary 3": {
      "1st Term": 185000,
      "2nd Term": 160000,
      "3rd Term": 160000,
    },
    "Primary 4": {
      "1st Term": 190000,
      "2nd Term": 165000,
      "3rd Term": 165000,
    },
    "Primary 5": {
      "1st Term": 195000,
      "2nd Term": 170000,
      "3rd Term": 170000,
    },
    "Primary 6": {
      "1st Term": 200000,
      "2nd Term": 175000,
      "3rd Term": 175000,
    },
  },
};
