import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { app } from '../firebase';

/**
 * Central boundary for Firebase Cloud Messaging.
 * Application services must not import firebase/messaging directly.
 */
export const firebaseMessagingGateway = {
  isSupported,
  getMessaging: () => getMessaging(app),
  getToken,
  onMessage,
};
