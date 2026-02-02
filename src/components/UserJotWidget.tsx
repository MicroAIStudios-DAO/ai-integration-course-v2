import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * UserJot Feedback Widget for Beta Testers
 * 
 * This component loads the UserJot feedback widget only for users
 * who are marked as beta testers in Firestore.
 * 
 * Setup Instructions:
 * 1. Sign up at https://userjot.com (Free plan)
 * 2. Create a feedback board
 * 3. Get your workspace ID from Settings → Widget
 * 4. Replace 'YOUR_USERJOT_WORKSPACE_ID' below with your actual workspace ID
 * 
 * The widget will appear as a floating button on the right side of the screen
 * for beta testers only.
 */

export function UserJotWidget() {
  const { currentUser } = useAuth();

  useEffect(() => {
    // Only load widget for beta testers
    if (!currentUser?.isBetaTester) {
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[data-userjot-widget]');
    if (existingScript) {
      return;
    }

    // Create and configure the UserJot script
    const script = document.createElement('script');
    script.src = 'https://widget.userjot.com/widget.js';
    script.async = true;
    script.setAttribute('data-userjot-widget', 'true');
    
    // TODO: Replace with your actual UserJot workspace ID
    // Get this from: https://userjot.com → Settings → Widget
    script.setAttribute('data-userjot-id', 'YOUR_USERJOT_WORKSPACE_ID');
    
    // Pass user information to UserJot for better tracking
    if (currentUser.email) {
      script.setAttribute('data-userjot-email', currentUser.email);
    }
    
    if (currentUser.displayName) {
      script.setAttribute('data-userjot-name', currentUser.displayName);
    }
    
    // Add beta cohort information if available
    if (currentUser.betaCohort) {
      script.setAttribute('data-userjot-cohort', currentUser.betaCohort);
    }

    // Append script to body
    document.body.appendChild(script);

    // Cleanup function to remove script when component unmounts
    return () => {
      const scriptToRemove = document.querySelector('script[data-userjot-widget]');
      if (scriptToRemove) {
        document.body.removeChild(scriptToRemove);
      }
    };
  }, [currentUser]);

  // This component doesn't render anything visible
  return null;
}
