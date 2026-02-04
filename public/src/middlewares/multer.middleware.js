import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const tempDir = path.join(process.cwd(), "uploads", "temp");

// Ensure temp directory exists
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const safeFilename = `${crypto.randomUUID()}${ext}`;
        cb(null, safeFilename);
    }
});

// File filter (logic kept same, logs removed)
const fileFilter = (req, file, cb) => {
    if (file.fieldname === "videoFile") {
        const allowedVideoTypes = /mp4|avi|mov|mkv|webm/;
        const extname = allowedVideoTypes.test(
            path.extname(file.originalname).toLowerCase()
        );
        const mimetype = allowedVideoTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        }
        return cb(new Error("Invalid file type"), false);
    }

    if (
        file.fieldname === "thumbnail" ||
        file.fieldname === "avatar" ||
        file.fieldname === "coverImage"
    ) {
        const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedImageTypes.test(
            path.extname(file.originalname).toLowerCase()
        );
        const mimetype = allowedImageTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        }
        return cb(new Error("Invalid file type"), false);
    }

    cb(null, true);
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB
    }
});
