import React from 'react';

interface ColorPickerProps {
  selectedColor: string;
  onChange: (color: string) => void;
  label?: string;
}

const PRESET_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#6366f1', // Indigo
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
