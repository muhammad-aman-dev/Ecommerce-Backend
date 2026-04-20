import multer from "multer";
import fs from "fs";

const uploadPath = "/tmp";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // ensure /tmp exists (safe even if already there)
    fs.mkdir(uploadPath, { recursive: true }, (err) => {
      if (err) return cb(err, uploadPath);
      cb(null, uploadPath);
    });
  },
  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // ⚠️ reduce size
});

export default upload;