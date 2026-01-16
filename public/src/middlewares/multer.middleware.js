import multer from "multer";

const storage = multer.diskStorage({        // Tells Multer Where and how should I store uploaded files
    destination: function(req, file, cb) {  // saving files in local folder on your server inside ./public/temp folder  
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
})

export const upload = multer({  // middleware function called upload created 
    storage,
})

