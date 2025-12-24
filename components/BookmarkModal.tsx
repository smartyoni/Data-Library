import React, { useState, useEffect } from 'react';
import { Bookmark, BookmarkZone } from '../types';
import ColorPicker from './ColorPicker';

interface BookmarkModalProps {
  zones: BookmarkZone[];
  bookmark: Bookmark | null;
  onSave: (data: Partial<Bookmark> & { zone_id: string }) => void;
  onClose: () => void;
}

const BookmarkModal: React.FC<BookmarkModalProps> = ({
  zones,
  bookmark,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [color, setColor] = useState('#ef4444');
  const [error, setError] = useState('');

  useEffect(() => {
    if (zones.length > 0) {
      const zoneId = bookmark?.zone_id || zones[0].id;
      const defaultColor = zones.find(z => z.id === zoneId)?.default_color || '#ef4444';

      setSelectedZoneId(zoneId);
      setColor(bookmark?.color || defaultColor);
    }

    if (bookmark) {
      setName(bookmark.name);
      setUrl(bookmark.url);
    } else {
      setName('');
      setUrl('');
    }
    setError('');
  }, [bookmark, zones]);

  const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const zoneId = e.target.value;
    setSelectedZoneId(zoneId);

    // Auto-set color to zone's default color
    const zone = zones.find(z => z.id === zoneId);
    if (zone) {
      setColor(zone.default_color);
    }
  };

  const validateUrl = (urlStr: string): boolean => {
    try {
      const url = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
      return true;
    } catch {
      return false;
    }
  };

  const normalizeUrl = (urlStr: string): string => {
    if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
      return `https://${urlStr}`;
    }
    return urlStr;
  };

  const handleSave = () => {
    setError('');

    // Validation
    if (!name.trim()) {
      setError('북마크 이름을 입력해주세요.');
      return;
    }

    if (!url.trim()) {
      setError('URL을 입력해주세요.');
      return;
    }

    if (!validateUrl(url)) {
      setError('유효한 URL을 입력해주세요.');
      return;
    }

    if (!selectedZoneId) {
      setError('영역을 선택해주세요.');
      return;
    }

    const normalizedUrl = normalizeUrl(url);

    onSave({
      id: bookmark?.id,
      name: name.trim(),
      url: normalizedUrl,
      zone_id: selectedZoneId,
      color,
    } as any);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-lg shadow-lg max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-white">
            {bookmark ? '북마크 수정' : '북마크 추가'}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Name Input */}
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">
              이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="북마크 이름"
              className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
            />
          </div>

          {/* URL Input */}
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">
              URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
            />
          </div>

          {/* Zone Dropdown */}
          <div>
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 block">
              영역
            </label>
            <select
              value={selectedZoneId}
              onChange={handleZoneChange}
              className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
            >
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>

          {/* Color Picker */}
          <ColorPicker selectedColor={color} onChange={setColor} />

          {/* Error Message */}
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors text-sm font-medium"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors text-sm font-medium"
          >
            {bookmark ? '수정' : '추가'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookmarkModal;
