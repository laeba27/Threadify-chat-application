import { Request, Router } from "express";
import multer from "multer";
import { cloudinary } from "../config/cloudinary.js";

export const uploadRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 10 * 1024 * 1024,
  },
});

uploadRouter.post(
  "/image-upload",
  upload.single("file"),
  async (req: Request, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const file = req.file;

      if (!file.mimetype.startsWith("image/")) {
        return res.status(400).json({ error: "Only image files are allowed!" });
      }

      console.log("Processing file upload:", {
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      });

      const result = await new Promise<{
        secure_url: string;
        width: number;
        height: number;
      }>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "real_time_chat_threads_app",
            resource_type: "auto",
          },
          (err, uploaded) => {
            if (err) {
              console.error("Cloudinary upload error:", err);
              return reject(err);
            }

            if (!uploaded) {
              console.error("Cloudinary returned no result");
              return reject(new Error("Image upload failed - no result from Cloudinary"));
            }

            console.log("Cloudinary upload success:", {
              url: uploaded.secure_url,
              width: uploaded.width,
              height: uploaded.height,
            });

            resolve({
              secure_url: uploaded.secure_url,
              width: uploaded.width,
              height: uploaded.height,
            });
          }
        );

        uploadStream.on("error", (error) => {
          console.error("Upload stream error:", error);
          reject(error);
        });

        uploadStream.end(file.buffer);
      });

      return res.status(200).json({
        url: result.secure_url,
        width: result.width,
        height: result.height,
      });
    } catch (err) {
      console.error("Upload endpoint error:", err);
      next(err);
    }
  }
);
