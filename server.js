const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const QRCode = require('qrcode');
const multer = require('multer');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = 3190;
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const baseUrl = `https://server-photobooth.senimankode.id`;

function broadcastNewImage(fileName) {
  const message = JSON.stringify({ type: 'new_image', file: fileName });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'downloads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const uniqueName = `uploaded_image_${Date.now()}${ext}`;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage });
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));
app.get('/', (req, res) => {
    res.status(404).render('404'); 
});
app.get('/gallery', async (req, res) => {
  try {
    const downloadsDir = path.join(__dirname, 'downloads');
    const files = fs.readdirSync(downloadsDir).filter(file => /\.(png|jpe?g|webp)$/i.test(file));

    // Generate QR codes for each file (async)
    const filesWithQRCodes = await Promise.all(files.map(async file => {
      const downloadUrl = `${req.protocol}://${req.get('host')}/downloads/${file}`;
      previewUrl = `${req.protocol}://${req.get('host')}/downloads-result/${file}`;
      const qrDataUrl = await QRCode.toDataURL(previewUrl, { errorCorrectionLevel: 'H' });
      return { file, qrDataUrl };
    }));

    res.render('mainMenu', { filesWithQRCodes });
  } catch (error) {
    console.error('Error loading gallery:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.get('/downloads-result/:file', (req, res) => {
  const file = req.params.file;
  const filePath = path.join(__dirname, 'downloads', file);
  if (!file || !fs.existsSync(filePath)) {
    return res.status(404).send('File not found.');
  }
  res.render('downloadResult', { file });
});
app.post('/recieve-file', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ message: 'No file uploaded.' });
        }

        const resultFilename = req.file.filename;
        const downloadUrl = `${baseUrl}/downloads-result/${resultFilename}`;

        // Generate QR code for download URL
        const qrCodeDataURL = await QRCode.toDataURL(downloadUrl);

        const response = {
            qrCodeDataURL,
            resultFilename,
            download_url: downloadUrl,
            message: 'File successfully uploaded and processed.'
        };

        res.status(201).json(response);
    } catch (error) {
        console.error('Error processing file upload:', error);
        res.status(500).json({ message: 'File upload failed.', error: error.message });
    }
});
app.post('/upload', async (req, res) => {
    console.log('Received upload request');
    // Validate request body
    try {
        const { image } = req.body;
        if (!image) {
            return res.status(400).send({ message: 'No image data provided.' });
        }

        // Define file path and name (always PNG)
        const resultFilename = `uploaded_image_${Date.now()}.png`;
        const filePath = path.join(__dirname, 'downloads', resultFilename);

        // Ensure the downloads directory exists
        if (!fs.existsSync(path.join(__dirname, 'downloads'))) {
            fs.mkdirSync(path.join(__dirname, 'downloads'));
        }

        // Save the image to the server
        fs.writeFileSync(filePath, image, { encoding: 'base64' });

        // Generate a QR code for the download URL
        const downloadUrl = `https://server-photobooth.senimankode.id/downloads/${resultFilename}`;
        const qrCodeDataURL = await QRCode.toDataURL(downloadUrl);

        // Prepare response data
        const response = {
            qrCodeDataURL,
            resultFilename,
            download_url: downloadUrl,
            message: 'File successfully uploaded and processed.',
        };
        broadcastNewImage(resultFilename);
        // Send the response
        res.status(201).json(response);
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ message: 'Failed to upload image.', error: error.message });
    }
});
app.delete('/delete/:file', (req, res) => {
    const file = req.params.file;
    const filePath = path.join(__dirname, 'downloads', file);

    if (!file || !fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found.' });
    }

    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('Error deleting file:', err);
            return res.status(500).json({ message: 'Failed to delete file.' });
        }
        res.json({ message: 'File deleted successfully.' });
    });
});
app.get('/slideshow', (req, res) => {
    const imageFiles = fs.readdirSync(path.join(__dirname, 'downloads'))
        .filter(file => /\.(png|jpe?g|webp)$/i.test(file));
    res.render('slideshow', { imageFiles });
});
app.use('/download', express.static(path.join(__dirname, 'downloads')));
app.listen(PORT, () => {
    console.log(`Server is running on Port:${PORT}`);
});