export interface DriveBackupFile {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
}

/**
 * Searches for a backup folder in Google Drive. If it does not exist, creates it.
 * Returns the folder ID.
 */
export async function findOrCreateBackupFolder(accessToken: string): Promise<string> {
  const folderName = "Mi Gestor Financiero Backups";
  
  // Search query for the folder
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(folderName)}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id)`;
  
  try {
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!searchRes.ok) {
      throw new Error(`Folder search failed with status ${searchRes.status}`);
    }
    
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    // If not found, create it
    const createUrl = "https://www.googleapis.com/drive/v3/files";
    const createRes = await fetch(createUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
      }),
    });
    
    if (!createRes.ok) {
      throw new Error(`Folder creation failed with status ${createRes.status}`);
    }
    
    const createData = await createRes.json();
    return createData.id;
  } catch (error) {
    console.error("Error finding or creating folder in Google Drive:", error);
    throw new Error("No se pudo conectar o crear la carpeta de copias de seguridad en Google Drive.");
  }
}

/**
 * Uploads a JSON backup file to the specified Google Drive folder using multipart upload.
 */
export async function uploadBackupFile(
  accessToken: string,
  filename: string,
  content: string,
  folderId: string
): Promise<any> {
  const boundary = "gestor_financiero_boundary_string_123";
  const metadata = {
    name: filename,
    mimeType: "application/json",
    parents: [folderId],
  };

  const multipartBody = 
    `\r\n--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `\r\n--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${content}\r\n` +
    `\r\n--${boundary}--\r\n`;

  const url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Upload error details:", errText);
      throw new Error(`File upload failed with status ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error uploading backup file to Google Drive:", error);
    throw new Error("No se pudo subir la copia de seguridad a Google Drive.");
  }
}

/**
 * Lists all backup JSON files in the specified Google Drive folder.
 */
export async function listBackupFiles(
  accessToken: string,
  folderId: string
): Promise<DriveBackupFile[]> {
  const query = `'${folderId}' in parents and mimeType='application/json' and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=createdTime desc&fields=files(id,name,createdTime,size)`;
  
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error(`File listing failed with status ${res.status}`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.error("Error listing backup files from Google Drive:", error);
    throw new Error("No se pudieron listar las copias de seguridad de Google Drive.");
  }
}

/**
 * Downloads a JSON backup file content.
 */
export async function downloadBackupFile(accessToken: string, fileId: string): Promise<any> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error(`File download failed with status ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error downloading file from Google Drive:", error);
    throw new Error("No se pudo descargar la copia de seguridad de Google Drive.");
  }
}

/**
 * Deletes a backup file from Google Drive.
 */
export async function deleteBackupFile(accessToken: string, fileId: string): Promise<void> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  
  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error(`File deletion failed with status ${res.status}`);
    }
  } catch (error) {
    console.error("Error deleting file from Google Drive:", error);
    throw new Error("No se pudo eliminar la copia de seguridad de Google Drive.");
  }
}
