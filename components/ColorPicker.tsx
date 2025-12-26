import React from 'react';

interface ColorPickerProps {
  selectedColor: string;
  onChange: (color: string) => void;
  label?: string;
}

const PRESET_COLORS = [
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

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onChange, label = '색상' }) => {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        {label}
      </label>

      {/* Preset Colors Grid */}
      <div className="grid grid-cols-6 gap-2">
        {PRESET_COLORS.map(color => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={`w-10 h-10 rounded-lg border-2 transition-all transform hover:scale-110 ${
              selectedColor === color
                ? 'border-white scale-110 shadow-lg'
                : 'border-transparent hover:border-zinc-600'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* Custom Color Input */}
      <div className="mt-3">
        <label className="text-xs text-zinc-400 mb-1.5 block">
          커스텀 색상
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => onChange(e.target.value)}
            className="w-12 h-10 rounded border border-border cursor-pointer"
          />
          <input
            type="text"
            value={selectedColor}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
            className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
          />
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
