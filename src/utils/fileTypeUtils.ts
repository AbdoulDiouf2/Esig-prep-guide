export type DetectedFileType =
  | 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'ppt' | 'pptx' | 'txt'
  | 'image' | 'video' | 'audio' | 'zip' | 'link';

export function detectFileTypeFromName(fileName: string): DetectedFileType {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  if (extension === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(extension)) return 'docx';
  if (['xls', 'xlsx'].includes(extension)) return 'xlsx';
  if (['ppt', 'pptx'].includes(extension)) return 'pptx';
  if (extension === 'txt') return 'txt';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
  if (['mp4', 'webm', 'avi', 'mov'].includes(extension)) return 'video';
  if (['mp3', 'wav', 'ogg'].includes(extension)) return 'audio';
  if (['zip', 'rar', 'tar', 'gz'].includes(extension)) return 'zip';
  return 'link';
}
