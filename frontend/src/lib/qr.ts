// QR Code Scanner Utility
// Uses native browser APIs with fallback to manual input

interface QRScanResult {
  success: boolean;
  data?: string;
  error?: string;
}

interface ParsedProductData {
  sku?: string;
  name?: string;
  quantity?: number;
  expiryDate?: Date;
  batchNumber?: string;
}

// Check if BarcodeDetector API is available
export function isQRScannerSupported(): boolean {
  return "BarcodeDetector" in window;
}

// Request camera permission
export async function requestCameraPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch {
    return false;
  }
}

// Scan QR code from video stream
export async function scanQRFromVideo(videoElement: HTMLVideoElement): Promise<QRScanResult> {
  if (!isQRScannerSupported()) {
    return { success: false, error: "QR Scanner not supported in this browser" };
  }

  try {
    // @ts-expect-error - BarcodeDetector is not in TypeScript types yet
    const barcodeDetector = new BarcodeDetector({ formats: ["qr_code", "ean_13", "ean_8", "code_128"] });
    const barcodes = await barcodeDetector.detect(videoElement);

    if (barcodes.length > 0) {
      return { success: true, data: barcodes[0].rawValue };
    }

    return { success: false, error: "No QR code detected" };
  } catch (error) {
    return { success: false, error: `Scan failed: ${error}` };
  }
}

// Parse scanned data into product info
export function parseProductQR(rawData: string): ParsedProductData {
  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(rawData);
    return {
      sku: parsed.sku || parsed.code,
      name: parsed.name || parsed.product,
      quantity: parsed.quantity || parsed.qty,
      expiryDate: parsed.expiryDate ? new Date(parsed.expiryDate) : undefined,
      batchNumber: parsed.batch || parsed.batchNumber,
    };
  } catch {
    // Not JSON, try other formats
  }

  // GS1 DataMatrix / GS1-128 format (common in food industry)
  // Example: (01)04012345678901(17)241231(10)BATCH123
  const gs1Regex = /\(01\)(\d{14})(?:\(17\)(\d{6}))?(?:\(10\)(.+?))?(?:\(|$)/;
  const gs1Match = rawData.match(gs1Regex);

  if (gs1Match) {
    const [, gtin, expiryYYMMDD, batch] = gs1Match;
    return {
      sku: gtin,
      expiryDate: expiryYYMMDD
        ? new Date(`20${expiryYYMMDD.slice(0, 2)}-${expiryYYMMDD.slice(2, 4)}-${expiryYYMMDD.slice(4, 6)}`)
        : undefined,
      batchNumber: batch,
    };
  }

  // Simple barcode - just SKU
  if (/^\d{8,14}$/.test(rawData)) {
    return { sku: rawData };
  }

  // Fallback - return raw data as SKU
  return { sku: rawData };
}

// Start continuous QR scanning
export function startContinuousScan(
  videoElement: HTMLVideoElement,
  onScan: (result: QRScanResult) => void,
  intervalMs = 500
): () => void {
  let scanning = true;

  const scan = async () => {
    if (!scanning) return;

    const result = await scanQRFromVideo(videoElement);
    if (result.success) {
      onScan(result);
    }

    if (scanning) {
      setTimeout(scan, intervalMs);
    }
  };

  scan();

  // Return stop function
  return () => {
    scanning = false;
  };
}

// Generate QR code data for a product (for testing)
export function generateProductQR(product: ParsedProductData): string {
  return JSON.stringify({
    sku: product.sku,
    name: product.name,
    quantity: product.quantity,
    expiryDate: product.expiryDate?.toISOString(),
    batch: product.batchNumber,
  });
}
