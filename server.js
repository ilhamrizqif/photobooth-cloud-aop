const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode'); // Ensure this package is installed
const upload = multer({ storage });
const multer = require('multer');


const app = express();
const PORT = 3265;

// Middleware to parse JSON requests
app.use(bodyParser.json({ limit: '50mb' }));

// Set up multer storage
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


// New endpoint: accepts multipart/form-data image
app.post('/recieve-file', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ message: 'No file uploaded.' });
        }

        const resultFilename = req.file.filename;
        const downloadUrl = `https://server-photobooth.senimankode.id/downloads/${resultFilename}`;

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

// Route to handle image upload
app.post('/upload', async (req, res) => {
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

        // Send the response
        res.status(201).json(response);
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ message: 'Failed to upload image.', error: error.message });
    }
});

// Serve uploaded files
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});