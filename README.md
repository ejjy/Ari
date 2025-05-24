# Ari - AI-Powered Financial Management App

Ari is a comprehensive financial management application that combines expense tracking, budgeting, and AI-powered insights to help users manage their finances effectively.

## Features

- Expense and income tracking
- Budget management with categories
- Financial goals tracking
- Recurring transactions
- AI-powered insights and advice
- Personalized financial recommendations
- Secure data storage with Firebase

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Firebase account
- OpenAI API key

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ari.git
cd ari
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

4. Start the development server:
```bash
npm start
```

## Project Structure

```
src/
  ├── components/         # Reusable UI components
  ├── screens/           # Screen components
  ├── services/          # API and service integrations
  ├── hooks/             # Custom React hooks
  ├── types/             # TypeScript type definitions
  ├── theme/             # Theme configuration
  └── config/            # Configuration files
```

## AI Integration

The app uses OpenAI's GPT-4 model to provide:
- Financial insights based on transaction history
- Personalized financial advice
- Transaction categorization
- Spending pattern analysis

## Database

The app uses Firebase Firestore for data storage with the following collections:
- users
- transactions
- budget_categories
- financial_goals
- recurring_transactions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 