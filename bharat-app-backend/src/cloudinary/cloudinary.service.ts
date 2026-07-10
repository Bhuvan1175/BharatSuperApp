import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiErrorResponse,
  UploadApiResponse,
} from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    // Configure the Cloudinary SDK once, from environment variables.
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Streams an in-memory image buffer to Cloudinary.
   * Accepts a plain Buffer so this service stays decoupled from Express/Multer.
   * Returns the full Cloudinary response (contains secure_url, public_id, ...).
   */
  uploadImage(
    fileBuffer: Buffer,
    folder = 'profile-images',
  ): Promise<UploadApiResponse> {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            return reject(
              new InternalServerErrorException(
                'Failed to upload image to Cloudinary',
              ),
            );
          }
          if (!result) {
            return reject(
              new InternalServerErrorException(
                'Cloudinary did not return a valid response',
              ),
            );
          }
          resolve(result);
        },
      );

      // Convert the buffer into a readable stream and pipe it to Cloudinary.
      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  }

  /**
   * Deletes an image from Cloudinary by its public_id.
   */
  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
      });
    } catch {
      throw new InternalServerErrorException(
        'Failed to delete image from Cloudinary',
      );
    }
  }
}
