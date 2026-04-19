import QRCode from "qrcode";

/**
 * Generate a QR code as a base64 data URL.
 * The QR encodes the qrToken which guards scan at the gate.
 */
export async function generateQRDataURL(qrToken: string): Promise<string> {
  return QRCode.toDataURL(qrToken, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 400,
    color: {
      dark: "#1a1a2e",
      light: "#ffffff",
    },
  });
}

/**
 * Generate a QR code as an SVG string (for server rendering).
 */
export async function generateQRSVG(qrToken: string): Promise<string> {
  return QRCode.toString(qrToken, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 2,
    width: 400,
  });
}
