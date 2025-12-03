import QRCode from "qrcode";

/**
 * Generate QR Code as Data URL (base64)
 */
export const generateQR = async (payload: any): Promise<string> => {
  try {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    
    const qrCode = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
    });

    return qrCode;
  } catch (error) {
    console.error("Generate QR Code error:", error);
    throw new Error("Gagal membuat QR Code");
  }
};

/**
 * Generate QR Code as Buffer (for file storage)
 */
export const generateQRBuffer = async (payload: any): Promise<Buffer> => {
  try {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    
    const qrBuffer = await QRCode.toBuffer(data, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
    });

    return qrBuffer;
  } catch (error) {
    console.error("Generate QR Buffer error:", error);
    throw new Error("Gagal membuat QR Code buffer");
  }
};

/**
 * Generate QR Code for peminjaman
 */
export const generatePeminjamanQR = async (peminjamanId: number): Promise<string> => {
  const payload = {
    type: 'PEMINJAMAN',
    id: peminjamanId,
    timestamp: new Date().toISOString(),
  };

  return generateQR(payload);
};

/**
 * Generate QR Code for barang unit
 */
export const generateBarangQR = async (nup: string): Promise<string> => {
  const payload = {
    type: 'BARANG',
    nup: nup,
    timestamp: new Date().toISOString(),
  };

  return generateQR(payload);
};
