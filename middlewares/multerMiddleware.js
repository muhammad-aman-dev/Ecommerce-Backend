import multer from "multer";
import fs from "fs";
import path from "path";

const uploadPath = path.resolve("./tmp/my-uploads");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // create folder if it doesn't exist
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
  limits: { fileSize: 10 * 1024 * 1024 },
});

export default upload;