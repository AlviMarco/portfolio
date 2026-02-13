/**
 * PDF Handler Service
 * Handles PDF generation, saving, and opening
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

export const handlePDFDownload = async (
    pdfDoc: any,
    filename: string
): Promise<PDFSaveResult> => {
    try {
        const pdfBlob = pdfDoc.output('blob');

        if (Capacitor.isNativePlatform()) {
            const reader = new FileReader();
            return new Promise((resolve) => {
                reader.onload = async () => {
                    try {
                        const base64String = reader.result as string;
                        const base64Data = base64String.split(',')[1];

                        const writeResult = await Filesystem.writeFile({
                            path: filename,
                            data: base64Data,
                            directory: Directory.Documents,
                            recursive: true
                        });

                        const uriResult = await Filesystem.getUri({
                            directory: Directory.Documents,
                            path: filename
                        });
                        const fileUri = uriResult.uri;

                        let opened = false;
                        try {
                            await FileOpener.open(fileUri, 'application/pdf');
                            opened = true;
                        } catch (err) {
                            await Share.share({
                                title: filename,
                                url: fileUri
                            });
                            opened = true;
                        }

                        resolve({
                            success: true,
                            uri: fileUri,
                            filename,
                            message: '✅ PDF processed',
                            opened
                        });
                    } catch (err) {
                        resolve({ success: false, message: 'Failed to write file', filename });
                    }
                };
                reader.readAsDataURL(pdfBlob);
            });
        } else {
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 100);

            return {
                success: true,
                filename,
                message: '✅ PDF downloaded',
                opened: true
            };
        }
    } catch (error) {
        return {
            success: false,
            message: 'Error downloading PDF',
            filename
        };
    }
};
