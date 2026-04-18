import type { Category, TransactionType } from '../types';

export interface MerchantEntry {
  canonical: string;
  category: Category;
  type: TransactionType;
  aliases: string[];
}

// Spec §3: 50 common Indian merchants. Spec category names (dining_out,
// groceries, fuel, rent) are mapped to Ari's existing Category union.
export const MERCHANT_DB: MerchantEntry[] = [
  // Food — food-delivery + QSR + cafe
  { canonical: 'swiggy', category: 'food', type: 'expense', aliases: ['swiggy'] },
  { canonical: 'zomato', category: 'food', type: 'expense', aliases: ['zomato'] },
  { canonical: 'eatsure', category: 'food', type: 'expense', aliases: ['eatsure', 'faasos', 'behrouz', 'ovenstory'] },
  { canonical: 'dominos', category: 'food', type: 'expense', aliases: ['dominos', 'dominoz', 'domino pizza'] },
  { canonical: 'pizza hut', category: 'food', type: 'expense', aliases: ['pizza hut', 'pizzahut'] },
  { canonical: 'mcdonalds', category: 'food', type: 'expense', aliases: ['mcdonalds', 'mcd', 'mc donalds'] },
  { canonical: 'kfc', category: 'food', type: 'expense', aliases: ['kfc', 'kentucky'] },
  { canonical: 'starbucks', category: 'food', type: 'expense', aliases: ['starbucks', 'sbux'] },
  { canonical: 'cafe coffee day', category: 'food', type: 'expense', aliases: ['ccd', 'cafe coffee day', 'coffee day'] },
  { canonical: 'chai point', category: 'food', type: 'expense', aliases: ['chai point', 'chaipoint'] },

  // Food — groceries (no separate category in Ari, rolled into food)
  { canonical: 'big basket', category: 'food', type: 'expense', aliases: ['big basket', 'bigbasket', 'bb'] },
  { canonical: 'blinkit', category: 'food', type: 'expense', aliases: ['blinkit', 'grofers'] },
  { canonical: 'zepto', category: 'food', type: 'expense', aliases: ['zepto', 'zeptonow'] },
  { canonical: 'instamart', category: 'food', type: 'expense', aliases: ['instamart', 'swiggy instamart'] },
  { canonical: 'dmart', category: 'food', type: 'expense', aliases: ['dmart', 'd mart', 'avenue'] },
  { canonical: 'reliance fresh', category: 'food', type: 'expense', aliases: ['reliance fresh'] },
  { canonical: 'jiomart', category: 'food', type: 'expense', aliases: ['jiomart', 'jio mart'] },

  // Transport — ridehail + public + fuel
  { canonical: 'uber', category: 'transport', type: 'expense', aliases: ['uber', 'ubr'] },
  { canonical: 'ola', category: 'transport', type: 'expense', aliases: ['ola', 'ola cabs'] },
  { canonical: 'rapido', category: 'transport', type: 'expense', aliases: ['rapido'] },
  { canonical: 'metro', category: 'transport', type: 'expense', aliases: ['metro', 'dmrc', 'bmrcl', 'namma metro'] },
  { canonical: 'irctc', category: 'transport', type: 'expense', aliases: ['irctc', 'indian railway', 'railway'] },
  { canonical: 'redbus', category: 'transport', type: 'expense', aliases: ['redbus', 'red bus'] },
  { canonical: 'indigo', category: 'transport', type: 'expense', aliases: ['indigo', 'indigo airlines'] },
  { canonical: 'indian oil', category: 'transport', type: 'expense', aliases: ['indian oil', 'iocl'] },
  { canonical: 'hp petrol', category: 'transport', type: 'expense', aliases: ['hp petrol', 'hpcl', 'hp pump'] },
  { canonical: 'bharat petroleum', category: 'transport', type: 'expense', aliases: ['bharat petroleum', 'bpcl', 'bharat petrol'] },
  { canonical: 'shell', category: 'transport', type: 'expense', aliases: ['shell', 'shell petrol'] },

  // Shopping
  { canonical: 'amazon', category: 'shopping', type: 'expense', aliases: ['amazon', 'amzn'] },
  { canonical: 'flipkart', category: 'shopping', type: 'expense', aliases: ['flipkart'] },
  { canonical: 'myntra', category: 'shopping', type: 'expense', aliases: ['myntra', 'myntraa'] },
  { canonical: 'ajio', category: 'shopping', type: 'expense', aliases: ['ajio'] },
  { canonical: 'nykaa', category: 'shopping', type: 'expense', aliases: ['nykaa', 'nyka'] },
  { canonical: 'meesho', category: 'shopping', type: 'expense', aliases: ['meesho'] },
  { canonical: 'croma', category: 'shopping', type: 'expense', aliases: ['croma'] },
  { canonical: 'reliance digital', category: 'shopping', type: 'expense', aliases: ['reliance digital', 'reliancedigital'] },
  { canonical: 'ikea', category: 'shopping', type: 'expense', aliases: ['ikea'] },

  // Entertainment — OTT + tickets
  { canonical: 'netflix', category: 'entertainment', type: 'expense', aliases: ['netflix', 'nflx'] },
  { canonical: 'spotify', category: 'entertainment', type: 'expense', aliases: ['spotify'] },
  { canonical: 'hotstar', category: 'entertainment', type: 'expense', aliases: ['hotstar', 'disney hotstar', 'disney+'] },
  { canonical: 'prime video', category: 'entertainment', type: 'expense', aliases: ['prime video', 'amazon prime', 'prime'] },
  { canonical: 'jiocinema', category: 'entertainment', type: 'expense', aliases: ['jiocinema', 'jio cinema'] },
  { canonical: 'bookmyshow', category: 'entertainment', type: 'expense', aliases: ['bookmyshow', 'bms', 'book my show'] },
  { canonical: 'pvr', category: 'entertainment', type: 'expense', aliases: ['pvr', 'pvr cinemas', 'pvr inox'] },

  // Health
  { canonical: 'apollo pharmacy', category: 'health', type: 'expense', aliases: ['apollo', 'apollo pharmacy', 'apolo'] },
  { canonical: '1mg', category: 'health', type: 'expense', aliases: ['1mg', 'tata 1mg'] },
  { canonical: 'pharmeasy', category: 'health', type: 'expense', aliases: ['pharmeasy', 'pharm easy'] },
  { canonical: 'netmeds', category: 'health', type: 'expense', aliases: ['netmeds', 'net meds'] },
  { canonical: 'practo', category: 'health', type: 'expense', aliases: ['practo'] },

  // Housing — utilities + rent + telco
  { canonical: 'rent', category: 'housing', type: 'expense', aliases: ['rent', 'house rent', 'landlord', 'monthly rent'] },
  { canonical: 'airtel', category: 'housing', type: 'expense', aliases: ['airtel', 'airtel xstream', 'airtel broadband'] },
  { canonical: 'jio recharge', category: 'housing', type: 'expense', aliases: ['jio recharge', 'jio fiber', 'jio postpaid'] },
  { canonical: 'tata power', category: 'housing', type: 'expense', aliases: ['tata power', 'tatapower'] },

  // Education
  { canonical: 'udemy', category: 'education', type: 'expense', aliases: ['udemy'] },
  { canonical: 'coursera', category: 'education', type: 'expense', aliases: ['coursera'] },
];
