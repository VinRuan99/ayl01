import React, { useState } from 'react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useStore, Language } from '../../store/useStore';
import { Trash2, Plus } from 'lucide-react';

export default function AdminLanguages() {
  const { languages } = useStore();
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) return;
    setLoading(true);
    try {
      const langId = newCode.toLowerCase();
      await setDoc(doc(db, 'languages', langId), {
        code: langId,
        name: newName,
        isDefault: languages.length === 0
      });
      setNewCode('');
      setNewName('');
      alert('Thêm ngôn ngữ thành công!');
    } catch (error) {
      console.error('Error adding language', error);
      alert('Thêm thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (lang: Language) => {
    if (lang.isDefault) {
      alert('Không thể xóa ngôn ngữ mặc định!');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa ngôn ngữ ${lang.name}?`)) {
      try {
        await deleteDoc(doc(db, 'languages', lang.id));
      } catch (error) {
        console.error('Error deleting language', error);
        alert('Xóa thất bại.');
      }
    }
  };

  const handleSetDefault = async (lang: Language) => {
    if (lang.isDefault) return;
    try {
      // Set all to false, then this one to true
      const promises = languages.map(l => 
        setDoc(doc(db, 'languages', l.id), { ...l, isDefault: l.id === lang.id })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error setting default language', error);
      alert('Cập nhật thất bại.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Ngôn ngữ</h2>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Thêm ngôn ngữ mới</h3>
        <form onSubmit={handleAddLanguage} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mã ngôn ngữ (VD: en, fr)</label>
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="en"
              required
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên ngôn ngữ (VD: English)</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="English"
              required
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 h-[38px]"
          >
            <Plus className="w-4 h-4" />
            {loading ? 'Đang thêm...' : 'Thêm'}
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Mã
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tên ngôn ngữ
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Trạng thái
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Hành động</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {languages.map((lang) => (
              <tr key={lang.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white uppercase">
                  {lang.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {lang.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {lang.isDefault ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Mặc định
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(lang)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-xs font-medium"
                    >
                      Đặt làm mặc định
                    </button>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {!lang.isDefault && (
                    <button
                      onClick={() => handleDelete(lang)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
