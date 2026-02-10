import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

/**
 * UserJot Feedback Widget for Beta Testers
 *
 * This component loads the UserJot feedback widget only for users
 * who are marked as beta testers in Firestore (isBetaTester: true).
 *
 * The widget will appear as a floating button on the right side of the screen
 * for beta testers only.
 */

export function UserJotWidget() {
    const { currentUser } = useAuth();
    const [isBetaTester, setIsBetaTester] = useState(false);
    const [betaCohort, setBetaCohort] = useState<string | null>(null);

  // Listen for beta tester status from Firestore user document
  useEffect(() => {
        if (!currentUser) {
                setIsBetaTester(false);
                setBetaCohort(null);
                return;
        }

                const unsubscribe = onSnapshot(
                        doc(db, 'users', currentUser.uid),
                        (snapshot) => {
                                  if (snapshot.exists()) {
                                              const userData = snapshot.data();
                                              setIsBetaTester(userData.isBetaTester === true);
                                              setBetaCohort(userData.betaCohort || null);
                                  } else {
                                              setIsBetaTester(false);
                                              setBetaCohort(null);
                                  }
                        },
                        (error) => {
                                  console.error('Error fetching beta tester status:', error);
                                  setIsBetaTester(false);
                        }
                      );

                return () => unsubscribe();
  }, [currentUser]);

  // Load or remove UserJot widget script based on beta tester status
  useEffect(() => {
        if (!isBetaTester || !currentUser) {
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
        script.setAttribute('data-userjot-id', 'cml2vs82h15p516ml2chcrzin');

                // Pass user information to UserJot for better tracking
                if (currentUser.email) {
                        script.setAttribute('data-userjot-email', currentUser.email);
                }

                if (currentUser.displayName) {
                        script.setAttribute('data-userjot-name', currentUser.displayName);
                }

                // Add beta cohort information if available
                if (betaCohort) {
                        script.setAttribute('data-userjot-cohort', betaCohort);
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
  }, [isBetaTester, currentUser, betaCohort]);

  // This component doesn't render anything visible
  return null;
}
