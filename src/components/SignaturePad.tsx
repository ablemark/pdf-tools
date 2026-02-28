import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, Check, Pen } from 'lucide-react';
import { clsx } from 'clsx';

interface SignaturePadProps {
  onSignatureCreated: (base64Image: string) => void;
  onCancel?: () => void;
}

const COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'Blue', value: '#0000FF' },
  { name: 'Red', value: '#FF0000' },
];

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSignatureCreated, onCancel }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [penColor, setPenColor] = useState('#000000');

  const clear = () => {
    sigCanvas.current?.clear();
  };

  const confirm = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert('Please provide a signature first.');
      return;
    }
    // Get the base64 PNG image
    const dataURL = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    if (dataURL) {
      onSignatureCreated(dataURL);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md mx-auto border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Pen className="w-5 h-5" />
          Sign Here
        </h3>
        <div className="flex gap-2">
          {COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => setPenColor(color.value)}
              className={clsx(
                "w-6 h-6 rounded-full border-2 transition-all",
                penColor === color.value ? "border-gray-400 scale-110" : "border-transparent"
              )}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 mb-4 overflow-hidden">
        <SignatureCanvas
          ref={sigCanvas}
          penColor={penColor}
          canvasProps={{
            className: 'w-full h-64 cursor-crosshair touch-none',
          }}
          backgroundColor="rgba(0,0,0,0)"
        />
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={clear}
          className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Eraser className="w-4 h-4" />
          Clear
        </button>
        <button
          onClick={confirm}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Check className="w-4 h-4" />
          Use Signature
        </button>
      </div>
    </div>
  );
};
