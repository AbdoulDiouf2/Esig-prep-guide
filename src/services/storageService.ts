import { uploadToR2 } from '../utils/r2Utils';

/**
 * Upload une photo de profil alumni vers Cloudflare R2
 */
export const uploadAlumniPhoto = async (uid: string, file: File): Promise<string> => {
  const { url } = await uploadToR2(file, `alumni/photos`);
  return url;
};
