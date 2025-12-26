import React, { useState, useEffect } from 'react';
import { Bookmark, BookmarkZone } from '../types';
import ColorPicker from './ColorPicker';

interface BookmarkModalProps {
  zones: BookmarkZone[];
  bookmark: Bookmark | null;
  defaultZoneId?: string;
  onSave: (data: Partial<Bookmark> & { zone_id: string }) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

const BookmarkModal: React.FC<BookmarkModalProps> = ({
  zones,
  bookmark,
  defaultZoneId,
  onSave,
  onDelete,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [color, setColor] = useState('#ef4444');
  const [error, setError] = useState('');

  useEffect(() => {
    if (zones.length > 0) {
      const zoneId = bookmark?.zone_id || defaultZoneId || zones[0].id;
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
  }, [bookmark, defaultZoneId, zones]);

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
        className="bg-surface rounded-lg shadow-lg w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title and Buttons */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">
            {bookmark ? '북마크 수정' : '북마크 추가'}
          </h2>
          <div className="flex gap-2">
            {bookmark && (
              <button
                onClick={() => {
                  if (window.confirm(`'${bookmark.name}' 북마크를 삭제하시겠습니까?`)) {
                    onDelete?.(bookmark.id);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded bg-red-500/90 text-white hover:bg-red-600 transition-colors text-xs font-medium"
              >
                삭제
              </button>
            )}
            <button
              onClick={handleSave}
              className="px-3 py-1.5 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors text-xs font-bold"
            >
              {bookmark ? '수정' : '저장'}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-zinc-700 text-white hover:bg-zinc-600 transition-colors text-xs font-medium"
            >
              취소
            </button>
          </div>
        </div>

        {/* Content - Two Column Layout */}
        <div className="p-6 flex gap-6">
          {/* Left Column - Form Inputs */}
          <div className="flex-1 space-y-4">
            {/* Name Input */}
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
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
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
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
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
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

            {/* Error Message */}
            {error && (
              <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                {error}
              </div>
            )}
          </div>

          {/* Right Column - Color Picker */}
          <div className="flex flex-col items-center gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 block text-center">
                색상
              </label>
              <ColorPicker selectedColor={color} onChange={setColor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookmarkModal;
