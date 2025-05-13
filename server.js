const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode'); 
const multer = require('multer');
// Ensure this package is installed



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
const upload = multer({ storage });
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// 🌐 Root route: list all downloadable images
app.get('/', (req, res) => {
    const dir = path.join(__dirname, 'downloads');
    fs.readdir(dir, (err, files) => {
        if (err) return res.status(500).send('Failed to read directory.');

        // Get full path and stats for sorting
        const filesWithStats = files
            .map(file => {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                return { file, time: stat.mtime };
            })
            .sort((a, b) => b.time - a.time); // sort by modified time, newest first

        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <title>📂 Downloadable Images</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                        background: #f4f4f4;
                    }
                    .gallery {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 20px;
                    }
                    .item {
                        background: white;
                        padding: 10px;
                        border-radius: 8px;
                        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                        text-align: center;
                    }
                    .item img {
                        max-width: 100%;
                        height: auto;
                        border-radius: 4px;
                    }
                    .item a {
                        display: inline-block;
                        margin-top: 10px;
                        text-decoration: none;
                        background: #007bff;
                        color: white;
                        padding: 5px 10px;
                        border-radius: 4px;
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                <h1>📂 Downloadable Images</h1>
                <div class="gallery">
                ${filesWithStats.map(({ file }) => {
                    const displayName = file.replace(/^uploaded_image_/, ''); // remove the prefix
                    return `
                        <a class="item" href="/downloads-result/:${file}">
                            <img src="/downloads/${file}" alt="${displayName}" />
                            <p>${displayName}</p>
                            <a href="/downloads/${file}" download>⬇️ Download</a>
                        </a>
                    `;
                }).join('')}
                </div>
            </body>
            </html>
        `;
        res.send(html);
    });
});

app.get('/downloads-result/:file', (req, res) => {
    const file = req.params.file;
    const filePath = path.join(__dirname, 'downloads', file);

    if (!file || !fs.existsSync(filePath)) {
        return res.status(404).send('File not found.');
    }

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <title>📂 Download Image</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background: #f4f4f4;
                margin: 0;
                padding: 40px;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 600px;
                width: 100%;
            }
            img {
                max-width: 100%;
                height: auto;
                border-radius: 6px;
                margin-bottom: 20px;
            }
            button {
                padding: 10px 20px;
                font-size: 16px;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            a {
                text-decoration: none;
            }
            .back-link {
                display: block;
                margin-top: 20px;
                color: #333;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📥 Download File</h1>
            <img src="/downloads/${file}" alt="${file}" />
            <p>Click the button below to download <strong>${file}</strong>:</p>
            <a href="/downloads/${file}" download>
                <button>⬇️ Download</button>
            </a>
            <a href="/" class="back-link">🔙 Go to Gallery</a>
        </div>
    </body>
    </html>
`;
    res.send(html);
});
// New endpoint: accepts multipart/form-data image
app.post('/recieve-file', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ message: 'No file uploaded.' });
        }

        const resultFilename = req.file.filename;
        const downloadUrl = `https://server-photobooth.senimankode.id/downloads-result/${resultFilename}`;

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
app.use('/download', express.static(path.join(__dirname, 'downloads')));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});