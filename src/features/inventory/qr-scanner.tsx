"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  isQRScannerSupported,
  requestCameraPermission,
  startContinuousScan,
  parseProductQR,
} from "@/lib/qr";
import { Camera, Keyboard, X, QrCode, Loader2 } from "lucide-react";

interface QRScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (data: {
    sku?: string;
    name?: string;
    quantity?: number;
    expiryDate?: Date;
    batchNumber?: string;
  }) => void;
}

type ScanMode = "camera" | "manual";

export function QRScanner({ open, onOpenChange, onScan }: QRScannerProps) {
  const [mode, setMode] = React.useState<ScanMode>("camera");
  const [isScanning, setIsScanning] = React.useState(false);
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [manualInput, setManualInput] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const stopScanRef = React.useRef<(() => void) | null>(null);

  // Check camera support
  const isCameraSupported = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    return isQRScannerSupported() && "mediaDevices" in navigator;
  }, []);

  // Start camera scanning
  const startCamera = React.useCallback(async () => {
    if (!videoRef.current) return;

    setError(null);
    setIsScanning(true);

    try {
      const permission = await requestCameraPermission();
      setHasPermission(permission);

      if (!permission) {
        setError("Доступ до камери заборонено");
        setIsScanning(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // Start scanning
      stopScanRef.current = startContinuousScan(
        videoRef.current,
        (result) => {
          if (result.success && result.data) {
            const parsedData = parseProductQR(result.data);
            onScan(parsedData);
            handleClose();
          }
        },
        300
      );
    } catch (err) {
      setError("Помилка камери. Спробуйте ручне введення.");
      setIsScanning(false);
    }
  }, [onScan]);

  // Stop camera
  const stopCamera = React.useCallback(() => {
    if (stopScanRef.current) {
      stopScanRef.current();
      stopScanRef.current = null;
    }

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  }, []);

  // Handle close
  const handleClose = React.useCallback(() => {
    stopCamera();
    setManualInput("");
    setError(null);
    onOpenChange(false);
  }, [stopCamera, onOpenChange]);

  // Handle manual submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      const parsedData = parseProductQR(manualInput.trim());
      onScan(parsedData);
      handleClose();
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Start camera when mode changes
  React.useEffect(() => {
    if (open && mode === "camera" && isCameraSupported) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [open, mode, isCameraSupported, startCamera, stopCamera]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Сканування QR/штрих-коду
          </DialogTitle>
          <DialogDescription>
            Наведіть камеру на код або введіть дані вручну
          </DialogDescription>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="flex gap-2">
          <Button
            variant={mode === "camera" ? "default" : "outline"}
            className="flex-1 gap-2"
            onClick={() => setMode("camera")}
            disabled={!isCameraSupported}
          >
            <Camera className="h-4 w-4" />
            Камера
          </Button>
          <Button
            variant={mode === "manual" ? "default" : "outline"}
            className="flex-1 gap-2"
            onClick={() => setMode("manual")}
          >
            <Keyboard className="h-4 w-4" />
            Вручну
          </Button>
        </div>

        {/* Camera mode */}
        {mode === "camera" && (
          <div className="space-y-3">
            {!isCameraSupported ? (
              <div className="text-center py-8 text-muted-foreground">
                <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Камера не підтримується у цьому браузері</p>
                <p className="text-sm">Використайте ручне введення</p>
              </div>
            ) : (
              <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />

                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white rounded-lg opacity-75" />
                </div>

                {/* Loading indicator */}
                {isScanning && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Сканування...
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="absolute bottom-4 left-4 right-4 bg-danger text-white px-3 py-2 rounded-lg text-sm text-center">
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Manual mode */}
        {mode === "manual" && (
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <label
                htmlFor="manual-code"
                className="text-sm font-medium mb-1 block"
              >
                SKU або штрих-код
              </label>
              <Input
                id="manual-code"
                type="text"
                placeholder="Введіть код товару..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={!manualInput.trim()}>
              Підтвердити
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
