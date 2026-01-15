"use client";
import { useEffect, useState } from 'react';
import { getFirebase } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function UploadPage() {
  const { auth, storage } = getFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  useEffect(() => onAuthStateChanged(auth, setUser), [auth]);

  async function onUpload() {
    if (!user || !file) return;
    try {
      setStatus('Uploading…');
      const path = `uploads/${user.uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const publicUrl = await getDownloadURL(storageRef);
      setUrl(publicUrl);
      setStatus('Uploaded');
      try { await navigator.clipboard.writeText(publicUrl); } catch {}
    } catch (e: any) {
      console.error(e);
      setStatus('Upload failed');
    }
  }

  if (!user) return <p>Please sign in to upload images.</p>;

  return (
    <div>
      <h1>Upload Image</h1>
      <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
      <button onClick={onUpload} disabled={!file}>Upload</button>
      <p>{status}</p>
      {url && (
        <div>
          <p>URL (copied to clipboard):</p>
          <code style={{ wordBreak: 'break-all' }}>{url}</code>
          <div style={{ marginTop: 12 }}>
            <img src={url} alt="uploaded" style={{ maxWidth: 400 }} />
          </div>
        </div>
      )}
    </div>
  );
}

