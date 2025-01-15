const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode'); // Install with `npm install qrcode`

const app = express();
const PORT = 3000;

// Middleware to parse JSON requests
app.use(bodyParser.json({ limit: '50mb' }));

// Route to handle image upload
app.post('/upload', async (req, res) => {
    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).send({ message: 'No image provided.' });
        }

        // Extract Base64 data and determine file type
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const fileType = image.match(/data:image\/(\w+);base64/)[1];

        // Define file path and name
        const resultFilename = `uploaded_image_${Date.now()}.${fileType}`;
        const filePath = path.join(__dirname, 'uploads', resultFilename);

        // Ensure the uploads directory exists
        if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
            fs.mkdirSync(path.join(__dirname, 'uploads'));
        }

        // Save the image to the server
        fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });

        // Generate a QR code for the download URL
        const downloadUrl = `http://localhost:${PORT}/uploads/${resultFilename}`;
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
