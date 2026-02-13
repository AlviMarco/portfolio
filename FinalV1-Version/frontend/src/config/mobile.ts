import { Capacitor, CapacitorException } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

/**
 * Mobile utilities for Capacitor
 * Provides cross-platform functionality for iOS and Android
 */

export const isMobileApp = () => {
  return Capacitor.isNativePlatform();
};

export const getPlatform = async () => {
  const info = await Device.getInfo();
  return info.platform; // 'android' or 'ios'
};

export const getDeviceInfo = async () => {
  return await Device.getInfo();
};

export const shareFile = async (
  title: string,
  text: string,
  url?: string
) => {
  try {
    await Share.share({
      title,
      text,
      url,
      dialogTitle: 'Share via'
    });
  } catch (error) {
    console.error('Share error:', error);
  }
};

export const saveFileToDevice = async (
  fileName: string,
  content: string,
  directory: Directory = Directory.Documents
) => {
  try {
    const result = await Filesystem.writeFile({
      path: fileName,
      data: content,
      directory,
      encoding: Encoding.UTF8
    });
    return result;
  } catch (error) {
    console.error('File save error:', error);
    throw error;
  }
};

export const readFileFromDevice = async (
  fileName: string,
  directory: Directory = Directory.Documents
) => {
  try {
    const contents = await Filesystem.readFile({
      path: fileName,
      directory,
      encoding: Encoding.UTF8
    });
    return contents.data;
  } catch (error) {
    console.error('File read error:', error);
    throw error;
  }
};

export const deleteFileFromDevice = async (
  fileName: string,
  directory: Directory = Directory.Documents
) => {
  try {
    await Filesystem.deleteFile({
      path: fileName,
      directory
    });
  } catch (error) {
    console.error('File delete error:', error);
    throw error;
  }
};

export const listFilesInDirectory = async (
  directory: Directory = Directory.Documents
) => {
  try {
    const result = await Filesystem.readdir({
      path: '',
      directory
    });
    return result.files;
  } catch (error) {
    console.error('Directory read error:', error);
    throw error;
  }
};
