import { v2 as cloudinary } from "cloudinary";

import fs from "fs";

// Configuration
cloudinary.config({   
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async function (localFilePath) {
  const options = {
    use_filename: true,
    unique_filename: true,
    resource_type: "auto",
  };
  try {
    if (!localFilePath) return null;
    // uplaod the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath,options);    // note 52
    // file has been uploaded successfully
    console.log("file is uploaded on cloudinary", response.url);
    fs.unlinkSync(localFilePath)
    return response;
  } catch (error) {
    // note 35 to 37
    fs.unlinkSync (localFilePath); // remove the locally saved temporary file as the upload operation got faild.
    console.log('the errr',error)
  }
};

export {uploadOnCloudinary}