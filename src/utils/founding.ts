const FOUNDING_KEY = 'foundingAccess';

export const isFoundingMember = (): boolean => {
  try {
    return window.localStorage.getItem(FOUNDING_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setFoundingMember = (value: boolean): void => {
  try {
    window.localStorage.setItem(FOUNDING_KEY, value ? 'true' : 'false');
  } catch {
    // ignore storage failures
  }
};
