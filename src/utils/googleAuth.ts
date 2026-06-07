/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { WorkspaceState } from '../types';

// Reuse firebase app if already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Required Google Drive scope for file synchronization
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Track the active user and access token in-memory
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      // Check if we already have the token cached, if not try to sign in again or clear
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If state changed but no cached token, request standard sign in to renew token
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google Auth.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Authenticate Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

const BACKUP_FILE_NAME = 'ai_subbarao_financial_backup.json';

/**
 * Searches for the app backup file on Google Drive.
 * @returns The file ID if found, otherwise null.
 */
export const findBackupFile = async (token: string): Promise<string | null> => {
  try {
    const q = `name = '${BACKUP_FILE_NAME}' and trashed = false`;
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Google Drive search failed:', errText);
      return null;
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (error) {
    console.error('Failed to search Google Drive:', error);
    return null;
  }
};

/**
 * Saves/Uploads the local state data to the user's Google Drive.
 */
export const saveToGoogleDrive = async (token: string, state: WorkspaceState): Promise<boolean> => {
  try {
    let fileId = await findBackupFile(token);

    if (!fileId) {
      // 1. Create file metadata
      const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: BACKUP_FILE_NAME,
          mimeType: 'application/json',
        }),
      });

      if (!createResponse.ok) {
        const errText = await createResponse.text();
        console.error('Google Drive file creation failure:', errText);
        return false;
      }

      const fileData = await createResponse.json();
      fileId = fileData.id;
    }

    // 2. Upload file content
    const uploadResponse = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(state),
      }
    );

    return uploadResponse.ok;
  } catch (error) {
    console.error('Error backing up to Google Drive:', error);
    return false;
  }
};

/**
 * Fetches/Loads state data from the user's Google Drive.
 */
export const loadFromGoogleDrive = async (token: string): Promise<WorkspaceState | null> => {
  try {
    const fileId = await findBackupFile(token);
    if (!fileId) {
      return null;
    }

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Google Drive fetch content failed:', errText);
      return null;
    }

    const state = await response.json();
    return state as WorkspaceState;
  } catch (error) {
    console.error('Error downloading from Google Drive:', error);
    return null;
  }
};
