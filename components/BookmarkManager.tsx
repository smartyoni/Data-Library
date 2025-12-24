import React, { useState, useEffect } from 'react';
import { BookmarkZone as BookmarkZoneType, Bookmark } from '../types';
import { Icons } from './ui/Icons';
import firestoreDb from '../services/firestoreDb';
import BookmarkZone from './BookmarkZone';
import BookmarkModal from './BookmarkModal';

interface BookmarkManagerProps {
  onBack: () => void;
}

const BookmarkManager: React.FC<BookmarkManagerProps> = ({ onBack }) => {
  const [zones, setZones] = useState<BookmarkZoneType[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [selectedZoneForAdd, setSelectedZoneForAdd] = useState<string | null>(null);

  // Initialize zones and load data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Initialize default zones if not exists
        await firestoreDb.bookmarkZones.initializeDefaults();

        // Load zones
        const zonesData = await firestoreDb.bookmarkZones.list();
        setZones(zonesData);

        // Load bookmarks
        const bookmarksData = await firestoreDb.bookmarks.list();
        setBookmarks(bookmarksData);
      } catch (error) {
        console.error('Failed to load bookmark data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAddBookmark = (zoneId: string) => {
    setSelectedZoneForAdd(zoneId);
    setEditingBookmark(null);
    setIsModalOpen(true);
  };

  const handleEditZone = async (id: string, updates: Partial<BookmarkZoneType>) => {
    try {
      await firestoreDb.bookmarkZones.update(id, updates);
      setZones(zones.map(z => z.id === id ? { ...z, ...updates } : z));
    } catch (error) {
      console.error('Failed to update zone:', error);
    }
  };

  const handleEditBookmark = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setSelectedZoneForAdd(bookmark.zone_id);
    setIsModalOpen(true);
  };

  const handleDeleteBookmark = async (id: string) => {
    try {
      await firestoreDb.bookmarks.delete(id);
      setBookmarks(bookmarks.filter(b => b.id !== id));
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
    }
  };

  const handleSaveBookmark = async (data: Partial<Bookmark> & { zone_id: string }) => {
    try {
      if (editingBookmark) {
        // Update existing bookmark
        await firestoreDb.bookmarks.update(editingBookmark.id, {
          name: data.name,
          url: data.url,
          color: data.color,
          zone_id: data.zone_id,
        });

        setBookmarks(
          bookmarks.map(b =>
            b.id === editingBookmark.id
              ? {
                  ...b,
                  name: data.name || b.name,
                  url: data.url || b.url,
                  color: data.color || b.color,
                  zone_id: data.zone_id || b.zone_id,
                }
              : b
          )
        );
      } else {
        // Create new bookmark
        const newBookmark = await firestoreDb.bookmarks.create(
          data.zone_id,
          data.name || '',
          data.url || '',
          data.color || '#ef4444'
        );
        setBookmarks([...bookmarks, newBookmark]);
      }

      setIsModalOpen(false);
      setEditingBookmark(null);
      setSelectedZoneForAdd(null);
    } catch (error) {
      console.error('Failed to save bookmark:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Icons.Bookmark className="w-8 h-8 text-accent" />
          </div>
          <p className="text-sm text-secondary">북마크 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background/50 overflow-hidden animate-in fade-in duration-300">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-border bg-background/50 flex-shrink-0 backdrop-blur-sm gap-2">
        <button
          onClick={onBack}
          className="md:hidden p-1 -ml-2 text-zinc-400 hover:text-white transition-colors"
          title="뒤로가기"
        >
          <Icons.Back className="w-5 h-5" />
        </button>

        <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
          <Icons.Bookmark className="w-5 h-5 text-accent" />
          북마크 관리자
        </h1>

        <button
          onClick={() => handleAddBookmark(zones[0]?.id || '')}
          className="flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium ml-auto"
          disabled={zones.length === 0}
        >
          <Icons.Plus className="w-4 h-4" />
          <span className="hidden sm:inline">북마크 추가</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar">
        {zones.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Icons.Bookmark className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-secondary text-sm">영역을 로드할 수 없습니다.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max">
            {zones.map(zone => (
              <BookmarkZone
                key={zone.id}
                zone={zone}
                bookmarks={bookmarks.filter(b => b.zone_id === zone.id)}
                onEditZone={handleEditZone}
                onAddBookmark={() => handleAddBookmark(zone.id)}
                onEditBookmark={handleEditBookmark}
                onDeleteBookmark={handleDeleteBookmark}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <BookmarkModal
          zones={zones}
          bookmark={editingBookmark}
          onSave={handleSaveBookmark}
          onClose={() => {
            setIsModalOpen(false);
            setEditingBookmark(null);
            setSelectedZoneForAdd(null);
          }}
        />
      )}
    </div>
  );
};

export default BookmarkManager;
