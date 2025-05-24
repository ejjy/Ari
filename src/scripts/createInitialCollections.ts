import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { config } from '../config/app.config'; // make sure this resolves

// Firebase setup
const firebaseConfig = {
  apiKey: config.firebase.apiKey,
  authDomain: config.firebase.authDomain,
  projectId: config.firebase.projectId,
  storageBucket: config.firebase.storageBucket,
  messagingSenderId: config.firebase.messagingSenderId,
  appId: config.firebase.appId,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PLACEHOLDER_USER_ID = 'placeholder_user';

const placeholderData = {
  transactions: {
    id: '',
    type: 'expense' as const,
    amount: 50.0,
    category: 'Food',
    description: 'Sample transaction',
    date: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['sample'],
  },
  budgetCategories: {
    id: '',
    name: 'Food & Dining',
    limit: 500,
    spent: 0,
    color: '#FF5733',
    icon: 'food',
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  },
  goals: {
    id: '',
    title: 'Emergency Fund',
    targetAmount: 10000,
    currentAmount: 0,
    deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    category: 'savings' as const,
  },
  habits: {
    id: '',
    name: 'Daily Budget Review',
    description: 'Review daily spending and budget',
    streak: 0,
    target: 30,
    completed: false,
    lastCompleted: new Date(),
  },
};

async function createInitialCollections() {
  try {
    console.log('🌱 Creating user and subcollections...');

    const userRef = doc(db, 'users', PLACEHOLDER_USER_ID);
    await setDoc(userRef, {
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    for (const key of Object.keys(placeholderData)) {
      const subRef = doc(collection(db, 'users', PLACEHOLDER_USER_ID, key));
      const dataWithId = {
        ...placeholderData[key as keyof typeof placeholderData],
        id: subRef.id,
      };
      await setDoc(subRef, dataWithId);
    }

    console.log('✅ Subcollections created under /users/placeholder_user/');
  } catch (error) {
    console.error('🔥 Error initializing collections:', error);
    process.exit(1);
  }
}

createInitialCollections()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
