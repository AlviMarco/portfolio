
import { fetchWithTimeout, isOnline } from '../../../utils/networkService';

const FOLDER_NAME = 'AccountingApp_Backups';
const FETCH_TIMEOUT_MS = 15000; // 15 second timeout for Google Drive API

export class GoogleDriveService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get or create backup folder on Google Drive
   * ✅ Includes network timeout guard
   * ✅ Offline-safe error handling
   */
  async getOrCreateFolder(): Promise<string> {
    // ✅ FIX: Check network before attempting API call
    if (!isOnline()) {
      throw new Error('❌ Cannot access Google Drive while offline. Please connect to the internet.');
    }

    try {
      const query = encodeURIComponent(`name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
      const response = await fetchWithTimeout(
        `https://www.googleapis.com/drive/v3/files?q=${query}`,
        { headers: this.headers },
        FETCH_TIMEOUT_MS
      );
      
      const data = await response.json();

      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }

      // Create folder if not found
      const createResponse = await fetchWithTimeout(
        'https://www.googleapis.com/drive/v3/files',
        {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify({
            name: FOLDER_NAME,
            mimeType: 'application/vnd.google-apps.folder',
          }),
        },
        FETCH_TIMEOUT_MS
      );
      
      const folder = await createResponse.json();
      return folder.id;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Failed to access Google Drive folder:', errorMsg);
      throw new Error(`Failed to access Google Drive: ${errorMsg}`);
    }
  }

  /**
   * Upload backup file to Google Drive
   * ✅ Includes network timeout guard
   * ✅ Offline-safe error handling
   */
  async uploadBackup(fileName: string, folderId: string, content: string): Promise<void> {
    // ✅ FIX: Check network before attempting upload
    if (!isOnline()) {
      throw new Error('❌ Cannot upload to Google Drive while offline. Please connect to the internet.');
    }

    try {
      const metadata = {
        name: fileName,
        parents: [folderId],
        mimeType: 'application/json',
      };

      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formData.append('file', new Blob([content], { type: 'application/json' }));

      const response = await fetchWithTimeout(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.accessToken}` },
          body: formData,
        },
        FETCH_TIMEOUT_MS
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Google Drive upload failed:', errorMsg);
      throw new Error(`Upload failed: ${errorMsg}`);
    }
  }

  /**
   * List all backup files in Google Drive folder
   * ✅ Includes network timeout guard
   * ✅ Offline-safe error handling
   */
  async listBackups(folderId: string): Promise<any[]> {
    // ✅ FIX: Check network before attempting API call
    if (!isOnline()) {
      console.warn('⚠️ Offline: Cannot fetch backup history from Google Drive');
      return [];
    }

    try {
      const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
      const response = await fetchWithTimeout(
        `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime)&orderBy=createdTime desc`,
        { headers: this.headers },
        FETCH_TIMEOUT_MS
      );
      
      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('❌ Failed to list Google Drive backups:', error);
      return []; // ✅ FIX: Return empty array instead of throwing (graceful fallback)
    }
  }

  /**
   * Download backup file from Google Drive
   * ✅ Includes network timeout guard
   * ✅ Offline-safe error handling
   */
  async downloadFile(fileId: string): Promise<any> {
    // ✅ FIX: Check network before attempting download
    if (!isOnline()) {
      throw new Error('❌ Cannot download from Google Drive while offline. Please connect to the internet.');
    }

    try {
      const response = await fetchWithTimeout(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers: this.headers },
        FETCH_TIMEOUT_MS
      );
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Google Drive download failed:', errorMsg);
      throw new Error(`Download failed: ${errorMsg}`);
    }
  }
}
