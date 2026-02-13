/**
 * PDF Handler Service
 * Handles PDF generation, saving, and opening across Web, Android, and iOS
 * ✅ Scoped Storage Compliant (Android 10+)
 * ✅ Play Store Safe (No MANAGE_EXTERNAL_STORAGE required)
 * ✅ Uses app-private Documents folder via Capacitor Filesystem
 */

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { FileOpener } from '@awesome-cordova-plugins/file-opener';

export interface PDFSaveResult {
  success: boolean;
  uri?: string;
  message: string;
  filename: string;
  opened?: boolean;
}

/**
 * Main PDF Handler - Works across Web, Android, and iOS
 */
export const handlePDFDownload = async (
  pdfDoc: any, // jsPDF document object
  filename: string
): Promise<PDFSaveResult> => {
  try {
    const pdfBlob = pdfDoc.output('blob');
    const reader = new FileReader();

    return new Promise((resolve) => {
      reader.onload = async () => {
        try {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1]; // Remove data:application/pdf;base64, prefix

          if (!base64Data || base64Data.length === 0) {
            resolve({
              success: false,
              message: 'PDF data is empty',
              filename
            });
            return;
          }

          // Detect platform and handle accordingly
          if (Capacitor.isNativePlatform()) {
            const result = await handleNativePDF(base64Data, filename);
            resolve(result);
          } else {
            const result = await handleWebPDF(pdfBlob, filename);
            resolve(result);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error('❌ PDF handling error:', error);
          resolve({
            success: false,
            message: `Failed to process PDF: ${errorMsg}`,
            filename
          });
        }
      };

      reader.onerror = () => {
        resolve({
          success: false,
          message: 'Failed to read PDF data',
          filename
        });
      };

      reader.readAsDataURL(pdfBlob);
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ PDF download error:', error);
    return {
      success: false,
      message: `Error: ${errorMsg}`,
      filename
    };
  }
};

/**
 * Handle PDF on Native (Android/iOS) platforms
 * ✅ Uses Scoped Storage via Directory.Documents (app-private)
 * ✅ No external storage permissions needed
 */
async function handleNativePDF(
  base64Data: string,
  filename: string
): Promise<PDFSaveResult> {
  try {
    // Step 1: Save PDF to app-private Documents folder
    console.log(`📁 Saving PDF to app Documents: ${filename}`);
    
    const writeResult = await Filesystem.writeFile({
      path: filename,
      data: base64Data,
      directory: Directory.Documents,
      recursive: true
    });

    console.log('✅ PDF write successful:', writeResult);

    // Step 2: Get the proper file URI using Filesystem API
    let fileUri = '';
    try {
      const uriResult = await Filesystem.getUri({
        directory: Directory.Documents,
        path: filename
      });
      fileUri = uriResult.uri;
      console.log('✅ Got file URI:', fileUri);
    } catch (uriError) {
      console.warn('⚠️ getUri failed, constructing URI manually:', uriError);
      // Fallback: For app-private docs folder, use this pattern
      fileUri = `file://${(await Filesystem.getUri({ directory: Directory.Documents, path: '' })).uri}${filename}`;
    }

    if (!fileUri) {
      throw new Error('Failed to obtain file URI');
    }

    // Step 3: Try to open the PDF
    let opened = false;
    let openError: Error | null = null;

    // Method 1: Try FileOpener for direct PDF opening
    try {
      console.log('🔍 Method 1: Attempting FileOpener...');
      await FileOpener.open(fileUri, 'application/pdf');
      opened = true;
      console.log('✅ PDF opened with FileOpener');
    } catch (method1Error) {
      console.warn('⚠️ FileOpener failed:', method1Error);
      openError = method1Error instanceof Error ? method1Error : new Error(String(method1Error));

      // Method 2: Fall back to Share dialog (user selects which app to open with)
      try {
        console.log('🔍 Method 2: Attempting Share dialog...');
        await Share.share({
          title: filename.replace('.pdf', ''),
          text: 'Open this PDF report from Files app',
          url: fileUri,
          dialogTitle: 'Open PDF with'
        });
        opened = true;
        console.log('✅ PDF shared successfully');
      } catch (method2Error) {
        console.warn('⚠️ Share dialog failed:', method2Error);
        // Method 3: File is saved, user can open from Files app
        console.log('ℹ️ PDF saved to Documents folder (open from Files app)');
      }
    }

    return {
      success: true,
      uri: fileUri,
      filename,
      message: opened
        ? '✅ PDF downloaded and opened successfully'
        : '✅ PDF saved to Documents folder',
      opened
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Native PDF handling failed:', error);
    return {
      success: false,
      message: `Failed to save PDF: ${errorMsg}`,
      filename,
      opened: false
    };
  }
}

/**
 * Handle PDF on Web platform
 * Uses traditional browser download mechanism
 */
async function handleWebPDF(pdfBlob: Blob, filename: string): Promise<PDFSaveResult> {
  try {
    console.log('🌐 Web download: Creating download link');
    
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    console.log('✅ Download triggered successfully');
    
    return {
      success: true,
      filename,
      message: '✅ PDF downloaded successfully',
      opened: true
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Web PDF download failed:', error);
    return {
      success: false,
      message: `Failed to download PDF: ${errorMsg}`,
      filename
    };
  }
}

/**
 * Utility: Open an existing PDF file from Documents folder
 */
export const openPDFFromDocuments = async (filename: string): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    console.warn('⚠️ openPDFFromDocuments only works on native platforms');
    return false;
  }

  try {
    const uriResult = await Filesystem.getUri({
      directory: Directory.Documents,
      path: filename
    });

    await FileOpener.open(uriResult.uri, 'application/pdf');
    return true;
  } catch (error) {
    console.error('❌ Failed to open PDF:', error);
    return false;
  }
};

/**
 * Utility: List all PDFs in Documents folder
 */
export const listPDFsInDocuments = async (): Promise<string[]> => {
  if (!Capacitor.isNativePlatform()) {
    return [];
  }

  try {
    const result = await Filesystem.readdir({
      path: '',
      directory: Directory.Documents
    });

    return result.files
      .filter(file => file.name.endsWith('.pdf'))
      .map(file => file.name);
  } catch (error) {
    console.error('❌ Failed to list PDFs:', error);
    return [];
  }
};

/**
 * Utility: Delete a PDF from Documents folder
 */
export const deletePDFFromDocuments = async (filename: string): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    await Filesystem.deleteFile({
      directory: Directory.Documents,
      path: filename
    });
    return true;
  } catch (error) {
    console.error('❌ Failed to delete PDF:', error);
    return false;
  }
};
