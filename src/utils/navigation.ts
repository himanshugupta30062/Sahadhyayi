import { NavigateFunction } from 'react-router-dom';

/**
 * Redirects the user to their home dashboard after authentication.
 * Ensures signed-in users land on their personal home page only.
 */
export function redirectToUserHome(navigate: NavigateFunction) {
  navigate('/dashboard', { replace: true });
}
