
# 📸 Photobooth Image Upload API

This is an Express.js-based API that allows users to upload images either as base64-encoded strings or as file uploads. After the image is saved on the server, a QR code is generated linking to the downloadable image URL.

---

## 🚀 Features

- Upload image via base64 (`POST /upload`)
- Upload image via file (`POST /recieve-file`)
- Automatically generates a QR code pointing to the download link
- Serves uploaded files at `/downloads/<filename>`

---

## 📦 Requirements

- Node.js (v14 or above)
- npm

### 📁 Dependencies

Install the required packages:

```bash
npm install express body-parser multer qrcode
```

---

## 🛠️ Setup

1. Clone this repository or copy the files into your project.
2. Create a folder named `downloads` or let the server auto-create it.
3. Start the server:

```bash
node index.js
```

The server will run on:

```
http://localhost:3265
```

---

## 📤 API Endpoints

### 1. **Upload Image via Base64**

- **URL:** `/upload`
- **Method:** `POST`
- **Content-Type:** `application/json`

#### Request Body:

```json
{
  "image": "<base64_encoded_image_string_without_prefix>"
}
```

> ⚠️ Do not include `data:image/png;base64,` prefix in the image string.

#### Response:

```json
{
  "qrCodeDataURL": "data:image/png;base64,...",
  "resultFilename": "uploaded_image_1715612345678.png",
  "download_url": "https://server-photobooth.senimankode.id/downloads/uploaded_image_1715612345678.png",
  "message": "File successfully uploaded and processed."
}
```

---

### 2. **Upload Image via File**

- **URL:** `/recieve-file`
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`

#### Form Field:

| Key   | Type | Description        |
|-------|------|--------------------|
| image | File | Upload PNG/JPG/etc |

#### Response:

```json
{
  "qrCodeDataURL": "data:image/png;base64,...",
  "resultFilename": "uploaded_image_1715612345678.jpg",
  "download_url": "https://server-photobooth.senimankode.id/downloads/uploaded_image_1715612345678.jpg",
  "message": "File successfully uploaded and processed."
}
```

---

## 🌐 Static Files

- Uploaded images are accessible via:
  ```
  http://localhost:3265/downloads/<filename>
  ```
  Or using your live domain:
  ```
  https://server-photobooth.senimankode.id/downloads/<filename>
  ```

---

## 📁 Directory Structure

```
.
├── downloads/               # Saved uploaded images
├── index.js                 # Main server file
└── README.md                # Documentation
```

---

## 🧪 Testing

Use [Postman](https://www.postman.com/) or [curl](https://curl.se/) to test the endpoints.

### Example using `curl` for file upload:

```bash
curl -X POST http://localhost:3265/upload-file \
  -F "image=@/path/to/your/image.png"
```

---

## 🛡️ Notes

- File names are auto-generated using a timestamp.
- Ensure your hosting provider supports static file serving from `/downloads`.

---

## 📬 License

MIT — free to use and modify.
