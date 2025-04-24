const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_PRESET;

/**
 * Uploads a file to Cloudinary (unsigned) with optional progress reporting.
 * @param {File} file - The file to upload.
 * @param {function| string} [onProgressOrFolder] - If a function, receives progress events; if a string, treated as folder path.
 * @param {string} [maybeFolder] - Folder path when using a progress callback.
 * @returns {Promise<string>} The secure URL of the uploaded resource.
 */
export function uploadToCloudinary(file, onProgressOrFolder, maybeFolder = '') {
  let progressCallback = null;
  let folder = '';

  if (typeof onProgressOrFolder === 'function') {
    progressCallback = onProgressOrFolder;
    folder = maybeFolder;
  } else {
    folder = onProgressOrFolder || '';
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
  const formData = new FormData();

  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  if (folder) {
    formData.append('folder', folder);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    // Report upload progress
    xhr.upload.onprogress = event => {
      if (progressCallback && event.lengthComputable) {
        progressCallback(event);
      }
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        let errorMsg = `Cloudinary upload error: HTTP ${xhr.status}`;
        try {
          const errData = JSON.parse(xhr.responseText);
          if (errData.error && errData.error.message) {
            errorMsg = `Cloudinary upload error: ${errData.error.message}`;
          }
        } catch {};
        return reject(new Error(errorMsg));
      }

      try {
        const res = JSON.parse(xhr.responseText);
        resolve(res.secure_url);
      } catch (err) {
        reject(new Error('Cloudinary upload: invalid JSON response'));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Cloudinary upload error: Network error'));
    };

    xhr.send(formData);
  });
}
