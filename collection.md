users
{
  uid: string;                    // Firebase Auth UID
  email: string;
  displayName: string;
  createdAt: timestamp;
  lastLogin: timestamp;
  settings: {
    currency: string;            // e.g., "USD", "EUR"
    theme: "light" | "dark";
    notifications: boolean;
  }
}
transactions
{
  id: string;
  userId: string;                // Reference to users collection
  amount: number;
  type: "income" | "expense";
  category: string;              // e.g., "Food", "Transport", "Housing"
  description: string;
  date: timestamp;
  createdAt: timestamp;
  updatedAt: timestamp;
  recurringId?: string;         // Reference to recurring transactions if applicable
  tags: string[];               // Optional tags for better organization
  attachments?: string[];       // URLs to receipt images or other documents
}
budgetCategories
{
  id: string;
  userId: string;               // Reference to users collection
  name: string;                 // e.g., "Groceries", "Entertainment"
  limit: number;                // Monthly budget limit
  color: string;                // Hex color code for UI
  icon: string;                 // Icon identifier
  createdAt: timestamp;
  updatedAt: timestamp;
  isActive: boolean;
}
financialGoals
{
  id: string;
  userId: string;               // Reference to users collection
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: timestamp;
  category: string;             // e.g., "Savings", "Investment", "Debt"
  status: "active" | "completed" | "abandoned";
  createdAt: timestamp;
  updatedAt: timestamp;
  progress: number;             // Calculated field: currentAmount/targetAmount
}
recurringTransactions
{
  id: string;
  userId: string;               // Reference to users collection
  description: string;
  amount: number;
  category: string;
  type: "income" | "expense";
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  startDate: timestamp;
  endDate?: timestamp;          // Optional end date
  lastProcessed: timestamp;     // Last time the transaction was created
  nextDate: timestamp;          // Next occurrence date
  isActive: boolean;
}
insights
{
  id: string;
  userId: string;               // Reference to users collection
  type: "spending" | "savings" | "budget" | "goal";
  title: string;
  description: string;
  data: {
    // Flexible object to store insight-specific data
    // e.g., spending patterns, savings rates, etc.
  };
  createdAt: timestamp;
  period: {
    start: timestamp;
    end: timestamp;
  };
}
notifications
{
  id: string;
  userId: string;               // Reference to users collection
  type: "budget_alert" | "goal_milestone" | "bill_reminder" | "insight";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: timestamp;
  data?: {
    // Additional data specific to notification type
  };
}
categories
{
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
  isDefault: boolean;
  userId?: string;              // If custom category, reference to user
}

Rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Transactions collection
    match /transactions/{transactionId} {
      allow read, write: if isAuthenticated() && 
        isOwner(resource.data.userId);
    }
    
    // Similar rules for other collections...
  }
}


