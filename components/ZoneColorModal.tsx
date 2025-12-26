import React from 'react';
import { Icons } from './ui/Icons';

interface ZoneColorModalProps {
  isOpen: boolean;
  currentColor: string;
  onColorSelect: (color: string) => void;
  onClose: () => void;
}

// Color palette - same as BookmarkZone
const COLOR_PALETTE = [
  '#C0C0BD', // Gray
  '#D9A891', // Brown
  '#D99B71', // Orange
  '#D9C659', // Yellow
  '#C5E6A5', // Green
  '#A8D5B8', // Sage
  '#9CBFF5', // Blue
  '#C9B3E6', // Purple
  '#E6B3D9', // Pink
  '#E67A7A', // Red
  '#B8B8B3', // Warm Gray
  '#C9B8A3', // Taupe
  '#D9C9A3', // Cream
  '#A3D9D1', // Teal
  '#B3C9FF', // Lavender
  '#FF8080', // Light Red
  '#E8B8A3', // Light Orange
  '#FFDE71', // Light Yellow
  '#C9FF99', // Light Mint
  '#99D9D1', // Light Cyan
  '#B3D9FF', // Light Periwinkle
  '#E6B3D9', // Light Magenta
  '#FF9999', // Light Coral
  '#99CCFF', // Light Sky Blue
  '#D9B3FF', // Light Iris
  '#FFCC99', // Light Sand
  '#99FFD9', // Light Aqua
  '#D9B3FF', // Light Grape
  '#FFB3D9', // Light Rose
  '#99E6FF', // Light Ice
];

const ZoneColorModal: React.FC<ZoneColorModalProps> = ({
  isOpen,
  currentColor,
  onColorSelect,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleColorClick = (color: string) => {
    onColorSelect(color);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-lg shadow-lg w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">영역 색상 변경</h2>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white transition-colors"
            title="닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Color Grid */}
        <div className="p-6">
          <div className="grid grid-cols-6 gap-2">
            {COLOR_PALETTE.map((color) => (
              <button
                key={color}
                onClick={() => handleColorClick(color)}
                className={`w-10 h-10 rounded-lg border-2 transition-all transform hover:scale-110 ${
                  color === currentColor
                    ? 'border-white scale-110 shadow-lg'
                    : 'border-transparent hover:border-zinc-600'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneColorModal;
