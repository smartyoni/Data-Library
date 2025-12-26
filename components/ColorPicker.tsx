import React from 'react';

interface ColorPickerProps {
  selectedColor: string;
  onChange: (color: string) => void;
  label?: string;
}

const PRESET_COLORS = [
  '#F3F3F1', // Gray
  '#FCEAE3', // Brown
  '#FADCC4', // Orange
  '#FDF7DE', // Yellow
  '#F0F7E4', // Green
  '#DDEDDA', // Sage
  '#DFEAFF', // Blue
  '#EBE5FA', // Purple
  '#F5DEEF', // Pink
  '#FDECED', // Red
  '#F2F2F0', // Warm Gray
  '#E8E0D5', // Taupe
  '#F4EDDE', // Cream
  '#E7F2EE', // Teal
  '#E3E8FF', // Lavender
  '#FFF0F0', // Light Red
  '#FCF0E4', // Light Orange
  '#FFFAE6', // Light Yellow
  '#F5FFF0', // Light Mint
  '#E8F5F0', // Light Cyan
  '#E8ECFF', // Light Periwinkle
  '#F8E4F5', // Light Magenta
  '#FFE8E8', // Light Coral
  '#E4F0FF', // Light Sky Blue
  '#F0E8FF', // Light Iris
  '#FFF5E8', // Light Sand
  '#E8FFF5', // Light Aqua
  '#F5E8FF', // Light Grape
  '#FFE8F5', // Light Rose
  '#E8F8FF', // Light Ice
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
