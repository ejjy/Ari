import { autoDetectCategory } from '../autoDetectCategory';

describe('autoDetectCategory', () => {
  describe('food detection', () => {
    it.each(['Zomato order', 'Swiggy dinner', 'Coffee shop', 'Chai break', 'Restaurant bill', 'Pizza hut', 'Burger king'])(
      'detects "%s" as food expense',
      (desc) => {
        const result = autoDetectCategory(desc, 'expense');
        expect(result).toEqual({ category: 'food', type: 'expense' });
      }
    );
  });

  describe('transport detection', () => {
    it.each(['Uber ride', 'Ola cab', 'Metro card', 'Petrol fill', 'Bus ticket', 'Auto rickshaw', 'Rapido bike'])(
      'detects "%s" as transport expense',
      (desc) => {
        const result = autoDetectCategory(desc, 'expense');
        expect(result).toEqual({ category: 'transport', type: 'expense' });
      }
    );
  });

  describe('shopping detection', () => {
    it.each(['Amazon order', 'Flipkart sale', 'Myntra clothes', 'Nykaa beauty'])(
      'detects "%s" as shopping expense',
      (desc) => {
        const result = autoDetectCategory(desc, 'expense');
        expect(result).toEqual({ category: 'shopping', type: 'expense' });
      }
    );
  });

  describe('entertainment detection', () => {
    it.each(['Netflix subscription', 'Movie tickets', 'Spotify premium', 'Hotstar plan'])(
      'detects "%s" as entertainment expense',
      (desc) => {
        const result = autoDetectCategory(desc, 'expense');
        expect(result).toEqual({ category: 'entertainment', type: 'expense' });
      }
    );
  });

  describe('health detection', () => {
    it.each(['Doctor visit', 'Medicine purchase', 'Apollo pharmacy', '1mg order'])(
      'detects "%s" as health expense',
      (desc) => {
        const result = autoDetectCategory(desc, 'expense');
        expect(result).toEqual({ category: 'health', type: 'expense' });
      }
    );
  });

  describe('housing detection', () => {
    it.each(['Rent payment', 'Electricity bill', 'WiFi recharge', 'Society maintenance'])(
      'detects "%s" as housing expense',
      (desc) => {
        const result = autoDetectCategory(desc, 'expense');
        expect(result).toEqual({ category: 'housing', type: 'expense' });
      }
    );
  });

  describe('education detection', () => {
    it.each(['Udemy course', 'Book purchase', 'Tuition fees', 'Coaching class'])(
      'detects "%s" as education expense',
      (desc) => {
        const result = autoDetectCategory(desc, 'expense');
        expect(result).toEqual({ category: 'education', type: 'expense' });
      }
    );
  });

  describe('income detection', () => {
    it('detects salary', () => {
      expect(autoDetectCategory('Salary credited', 'income')).toEqual({
        category: 'salary',
        type: 'income',
      });
    });

    it('detects freelance', () => {
      expect(autoDetectCategory('Freelance project', 'expense')).toEqual({
        category: 'freelance',
        type: 'income',
      });
    });

    it('detects investments', () => {
      expect(autoDetectCategory('Mutual fund returns', 'income')).toEqual({
        category: 'investment',
        type: 'income',
      });
    });

    it('detects SIP', () => {
      expect(autoDetectCategory('SIP maturity', 'income')).toEqual({
        category: 'investment',
        type: 'income',
      });
    });

    it('detects gifts/cashback', () => {
      expect(autoDetectCategory('Cashback received', 'income')).toEqual({
        category: 'gift',
        type: 'income',
      });
    });
  });

  describe('no match', () => {
    it('returns null for unrecognized descriptions', () => {
      expect(autoDetectCategory('random stuff', 'expense')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(autoDetectCategory('', 'expense')).toBeNull();
    });
  });

  describe('type switching', () => {
    it('switches from expense to income when salary detected', () => {
      const result = autoDetectCategory('Monthly salary', 'expense');
      expect(result?.type).toBe('income');
    });

    it('switches from income to expense when food detected', () => {
      const result = autoDetectCategory('Zomato order', 'income');
      expect(result?.type).toBe('expense');
    });
  });
});
