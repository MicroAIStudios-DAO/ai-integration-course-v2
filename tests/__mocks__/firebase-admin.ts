// Mock for firebase-admin
const mockAdmin = {
  apps: [],
  initializeApp: () => ({}),
  firestore: () => ({
    doc: () => ({
      get: () => Promise.resolve({ exists: false, data: () => ({}) })
    })
  }),
  storage: () => ({
    bucket: () => ({
      file: () => ({
        exists: () => Promise.resolve([false]),
        download: () => Promise.resolve([Buffer.from('{}')]),
        save: () => Promise.resolve()
      })
    })
  })
};

export default mockAdmin;
