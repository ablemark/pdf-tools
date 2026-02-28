import React, { useState, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { Upload, FileText, Download, X } from 'lucide-react';
import { renderPdfPage, embedSignature } from '../utils/pdfUtils';
import { SignaturePad } from './SignaturePad';

export const PdfSigner: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfImage, setPdfImage] = useState<string | null>(null);
  const [pdfDimensions, setPdfDimensions] = useState<{ width: number; height: number } | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  
  // Signature position and size in the UI
  const [sigPosition, setSigPosition] = useState({ x: 100, y: 100 });
  const [sigSize, setSigSize] = useState({ width: 200, height: 100 });

  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      try {
        const { image, width, height } = await renderPdfPage(file, 1);
        setPdfImage(image);
        setPdfDimensions({ width, height });
      } catch (error) {
        console.error('Error rendering PDF:', error);
        alert('Failed to render PDF. Please try another file.');
      }
    }
  };

  const handleSignatureCreated = (base64Image: string) => {
    setSignature(base64Image);
    setShowSignaturePad(false);
    // Reset position to center or a visible spot
    setSigPosition({ x: 50, y: 50 });
  };

  const handleDownload = async () => {
    if (!pdfFile || !signature || !pdfDimensions) return;

    try {
      const signedPdfBytes = await embedSignature(
        pdfFile,
        signature,
        1, // Assuming page 1 for now
        sigPosition.x,
        sigPosition.y,
        sigSize.width,
        sigSize.height,
        pdfDimensions.width,
        pdfDimensions.height
      );

      const blob = new Blob([signedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `signed_${pdfFile.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error saving PDF:', error);
      alert('Failed to save signed PDF.');
    }
  };

  const removeSignature = () => {
    setSignature(null);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">PDF Signer</h1>
        <p className="text-gray-500">Upload a PDF, sign it, and place your signature.</p>
      </div>

      {/* Upload Section */}
      {!pdfFile && (
        <div className="w-full max-w-xl">
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
              <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
              <p className="text-xs text-gray-500">PDF files only</p>
            </div>
            <input type="file" className="hidden" accept="application/pdf" onChange={handleFileUpload} />
          </label>
        </div>
      )}

      {/* PDF Preview & Signature Area */}
      {pdfFile && pdfImage && (
        <div className="w-full flex flex-col items-center space-y-6">
          <div className="flex items-center gap-4 w-full justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <FileText className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{pdfFile.name}</p>
                <p className="text-xs text-gray-500">Page 1 Preview</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setPdfFile(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Change PDF
              </button>
              {!signature && (
                <button
                  onClick={() => setShowSignaturePad(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                >
                  Create Signature
                </button>
              )}
              {signature && (
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Signed PDF
                </button>
              )}
            </div>
          </div>

          <div className="relative border shadow-2xl rounded-sm overflow-hidden bg-gray-500" ref={containerRef}>
            <img 
              src={pdfImage} 
              alt="PDF Preview" 
              className="max-w-full h-auto block select-none pointer-events-none" 
              style={{ maxHeight: '70vh' }}
            />
            
            {signature && (
              <Rnd
                key={signature}
                default={{
                  x: sigPosition.x,
                  y: sigPosition.y,
                  width: sigSize.width,
                  height: sigSize.height,
                }}
                bounds="parent"
                onDragStop={(e, d) => setSigPosition({ x: d.x, y: d.y })}
                onResizeStop={(e, direction, ref, delta, position) => {
                  setSigSize({
                    width: parseInt(ref.style.width),
                    height: parseInt(ref.style.height),
                  });
                  setSigPosition(position);
                }}
                className="border-2 border-blue-500 bg-blue-500/10 hover:bg-blue-500/20 transition-colors group"
                lockAspectRatio={true}
              >
                <div className="w-full h-full relative group">
                  <img 
                    src={signature} 
                    alt="Signature" 
                    className="w-full h-full object-contain pointer-events-none select-none" 
                  />
                  <button 
                    onClick={removeSignature}
                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Remove signature"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </Rnd>
            )}
          </div>
        </div>
      )}

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md">
            <SignaturePad 
              onSignatureCreated={handleSignatureCreated} 
              onCancel={() => setShowSignaturePad(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
};
