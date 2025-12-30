import multer from "multer";

const storage = multer.diskStorage({
    destination: function(req, file, cb) {  // saving files in local folder of server 
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
})

export const upload = multer({
    storage,
})