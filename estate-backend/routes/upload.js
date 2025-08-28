const express = require('express');
const router = express.Router();
const multer = require('multer');

// Use memory storage to hold files in memory as buffers for ImgBB upload
const upload = multer({ storage: multer.memoryStorage() });

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
if (!IMGBB_API_KEY) {
  console.warn('Warning: IMGBB_API_KEY is not set in environment variables');
}

// Since Node 18+ has native fetch, no need to import 'node-fetch'

router.post('/', upload.array('images', 5), async (req, res) => {
  console.log('Received files:', req.files.length);
  req.files.forEach((file, i) => {
    console.log(`File[${i}]: originalname=${file.originalname}, size=${file.size}, buffer present=${!!file.buffer}`);
  });

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ msg: 'No files uploaded' });
  }

  try {
    const uploadPromises = req.files.map(async (file, index) => {
  const base64 = file.buffer.toString('base64');
  console.log(`Uploading file ${index} (${file.originalname}): base64 length=${base64.length}`);
  console.log(`Base64 sample: ${base64.substring(0, 30)}...`);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: `image=${encodeURIComponent(base64)}`,
});


  const data = await response.json();
  console.log('ImgBB API response:', data);

  if (!response.ok || !data.success) {
    throw new Error(data.error?.message || 'Upload failed');
  }
  return data.data.url;
});


    const imageUrls = await Promise.all(uploadPromises);
    res.json({ files: imageUrls });
  } catch (error) {
    console.error('ImgBB upload error:', error);
    res.status(500).json({ msg: 'Failed to upload images', error: error.message });
  }
});


module.exports = router;
