// Frontend: File Upload Handling
document.addEventListener("DOMContentLoaded", function () {
    const fileInput = document.getElementById("fileInput");
    const uploadBtn = document.getElementById("uploadBtn");
    const progressBar = document.getElementById("progressBar");

    uploadBtn.addEventListener("click", function () {
        if (fileInput.files.length === 0) {
            alert("Please select files to upload.");
            return;
        }

        const formData = new FormData();
        for (let i = 0; i < fileInput.files.length; i++) {
            if (fileInput.files[i].size > 150 * 1024 * 1024) {
                alert(`File "${fileInput.files[i].name}" exceeds 150MB and cannot be uploaded.`);
                return;
            }
            formData.append("media", fileInput.files[i]);
        }

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/upload", true);

        // Progress event
        xhr.upload.onprogress = function (event) {
            if (event.lengthComputable) {
                let progress = (event.loaded / event.total) * 100;
                progressBar.style.width = progress + "%";
                progressBar.style.background = "#00ff00";
            }
        };

        // Upload complete
        xhr.onload = function () {
            if (xhr.status === 200) {
                alert("Upload Complete!");
                progressBar.style.width = "100%";
            } else {
                alert("Upload Failed: " + xhr.responseText);
                progressBar.style.background = "red";
            }
        };

        // Error handling
        xhr.onerror = function () {
            alert("An error occurred while uploading.");
            progressBar.style.background = "red";
        };

        // Send the request
        xhr.send(formData);
    });
});

// Backend: Express.js Server with Multer for File Uploads
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 3000;

// Ensure the "uploads" directory exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Function to sanitize filenames
const sanitizeFilename = (filename) => {
    return filename.replace(/[^a-zA-Z0-9._-]/g, "");
};

// Set up Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Save files in the "uploads" folder
    },
    filename: (req, file, cb) => {
        // Sanitize the filename and add a timestamp to avoid conflicts
        const sanitizedFilename = sanitizeFilename(file.originalname);
        cb(null, Date.now() + "-" + sanitizedFilename);
    },
});

// Allow only images and videos to be uploaded
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
        cb(null, true); // Accept the file
    } else {
        cb(new Error("Only images and videos are allowed!"), false); // Reject the file
    }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 150 * 1024 * 1024 } }); // 150MB limit

// Serve static files (e.g., HTML, CSS, JS)
app.use(express.static("public"));

// Handle media uploads (both images and videos)
app.post("/upload", upload.array("media", 10), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).send("No files uploaded.");
    }

    // Respond with the list of uploaded files
    const uploadedFiles = req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
    }));

    res.send({
        message: "Files uploaded successfully!",
        files: uploadedFiles,
    });
});

// Error handling for file uploads
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Handle Multer errors (e.g., file size limit exceeded)
        return res.status(400).send(`Multer error: ${err.message}`);
    } else if (err) {
        // Handle other errors (e.g., invalid file type)
        return res.status(400).send(`Error: ${err.message}`);
    }
    next();
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
