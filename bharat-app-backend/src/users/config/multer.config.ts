/// <reference types="multer" />
import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

/**
 * Reusable Multer options for profile image uploads.
 *
 * - memoryStorage(): keeps the file as an in-memory Buffer (file.buffer),
 *   which is exactly what CloudinaryService.uploadImage() needs. No temp
 *   files are written to disk.
 * - limits.fileSize: hard 5 MB cap, enforced before the file is fully
 *   buffered (protects the server from huge uploads).
 * - fileFilter: rejects anything that is not an allowed image type with a
 *   clean 400 Bad Request.
 */
export const profileImageMulterOptions: MulterOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (req, file, callback) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          'Invalid file type. Only jpg, jpeg, png and webp images are allowed.',
        ),
        false,
      );
    }

    callback(null, true);
  },
};
