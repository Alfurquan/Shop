const multer = require("multer");

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/images");
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString().replace(/:/g, "-") + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/jpeg"
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const upload = multer({
    storage: fileStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
})

module.exports = upload