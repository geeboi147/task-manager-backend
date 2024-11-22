const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

/**
 * Uploads a file to Cloudinary using a buffer.
 * @param {Buffer} fileBuffer - The buffer of the file to upload.
 * @param {Object} options - Additional Cloudinary upload options (optional).
 * @returns {Promise<string>} - Resolves with the secure URL of the uploaded file.
 */
const uploadToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { resource_type: 'auto', ...options }, // Merge default and custom options
      (error, result) => {
        if (error) {
          return reject(new Error('Error uploading to Cloudinary: ' + error.message));
        }
        resolve(result.secure_url);
      }
    ).end(fileBuffer);
  });
};

module.exports = { uploadToCloudinary };
