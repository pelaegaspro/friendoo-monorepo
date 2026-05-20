import { toast } from 'sonner';

/**
 * Handles Firestore and general errors with user-friendly messages
 */
export function handleAppError(error: any, context?: string) {
  console.error(`Error ${context ? `in ${context}` : ''}:`, error);

  let message = 'Something went wrong. Please try again.';

  if (error?.code) {
    switch (error.code) {
      case 'permission-denied':
        message = 'You do not have permission to perform this action.';
        break;
      case 'unauthenticated':
        message = 'Please sign in to continue.';
        break;
      case 'unavailable':
        message = 'The service is temporarily unavailable. Check your internet connection.';
        break;
      case 'not-found':
        message = 'The requested resource was not found.';
        break;
      case 'already-exists':
        message = 'This record already exists.';
        break;
      case 'auth/user-not-found':
        message = 'No user found with this email.';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password.';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection.';
        break;
      case 'auth/popup-closed-by-user':
        message = 'Sign-in window was closed.';
        break;
      case 'auth/cancelled-popup-request':
        message = 'Sign-in was cancelled.';
        break;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  toast.error(message);
  return message;
}
