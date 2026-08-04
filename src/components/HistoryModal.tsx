import React, { useState, useEffect } from 'react';
import { HistoryItem } from '../types';
import { getHistoryList, deleteFromHistory, clearAllHistory } from '../utils/historyManager';
import { generateContentPlanPDF } from '../utils/pdfGenerator';
import { useAuth } from '../context/AuthContext';
import { History, X, Download, Eye, Trash2, Search, Calendar, Layers } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectHistoryItem: (item: HistoryItem) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectHistoryItem,
}) => {
  const { user } = useAuth();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      setHistoryItems(getHistoryList(user?.id));
    }
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Apakah Anda yakin ingin menghapus item riwayat ini?')) {
      const updated = deleteFromHistory(id, user?.id);
      setHistoryItems(updated);
    }
  };

  const handleClearAll = () => {
    if (confirm('Hapus seluruh riwayat simpanan Anda? Tindakan ini tidak dapat dibatalkan.')) {
      clearAllHistory(user?.id);
      setHistoryItems([]);
    }
  };

  const handleDownloadPDF = (item: HistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    generateContentPlanPDF(item.result, item.input);
  };

  const filteredItems = historyItems.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      item.productName.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.platform.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Riwayat Perencanaan Konten</h2>
                <span className="px-2.5 py-0.5 text-xs font-black bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-full">
                  {historyItems.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Akses hasil generate sebelumnya & download PDF secara instan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Actions Bar */}
        {historyItems.length > 0 && (
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama produk / kategori..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-rose-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
              />
            </div>

            <button
              onClick={handleClearAll}
              className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-bold flex items-center gap-1 self-end sm:self-center cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan Semua</span>
            </button>
          </div>
        )}

        {/* Body List */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
          {historyItems.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Belum Ada Riwayat Saved</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  Setiap kali Anda membuat perencanaan konten baru, hasilnya akan otomatis tersimpan di sini.
                </p>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              Tidak ada riwayat yang cocok dengan kata kunci "{searchTerm}".
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-slate-600 rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1 cursor-pointer" onClick={() => { onSelectHistoryItem(item); onClose(); }}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                      {item.productName}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-md">
                      {item.category}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded-md uppercase">
                      {item.platform === 'both' ? 'Dual Platform' : item.platform}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.createdAt}</span>
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.result?.contentIdeas?.length || 7} Ide Konten</span>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => { onSelectHistoryItem(item); onClose(); }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                    title="Buka dan lihat strategi konten ini"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-rose-400" />
                    <span>Lihat</span>
                  </button>

                  <button
                    onClick={(e) => handleDownloadPDF(item, e)}
                    className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-black text-white bg-gradient-to-r from-indigo-600 to-rose-500 hover:from-indigo-700 hover:to-rose-600 rounded-lg shadow-xs transition-colors cursor-pointer"
                    title="Download langsung sebagai dokumen PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-white" />
                    <span>PDF</span>
                  </button>

                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                    title="Hapus dari riwayat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex justify-end rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
