import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useStore, Settings } from '../../store/useStore';
import { Save, Globe, Upload, Trash2 } from 'lucide-react';
import { translateText } from '../../lib/translate';
import { CustomFont, loadCustomFonts, uploadCustomFont, deleteCustomFont } from '../../lib/fonts';

export default function AdminSettings() {
  const { settings, languages } = useStore();
  const [formData, setFormData] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [fonts, setFonts] = useState<CustomFont[]>([]);
  const [uploadingFont, setUploadingFont] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  useEffect(() => {
    loadCustomFonts().then(setFonts);
  }, []);

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const name = prompt('Nhập tên cho font chữ này (ví dụ: MyCustomFont):');
    if (!name) return;

    setUploadingFont(true);
    try {
      const newFont = await uploadCustomFont(file, name);
      setFonts(prev => [...prev, newFont]);
      alert('Tải font lên thành công!');
    } catch (error) {
      console.error('Error uploading font:', error);
      alert('Lỗi tải font lên.');
    } finally {
      setUploadingFont(false);
    }
  };

  const handleFontDelete = async (font: CustomFont) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa font ${font.name}?`)) return;
    try {
      await deleteCustomFont(font);
      setFonts(prev => prev.filter(f => f.id !== font.id));
      alert('Xóa font thành công!');
    } catch (error) {
      console.error('Error deleting font:', error);
      alert('Lỗi xóa font.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => prev ? { ...prev, [name]: value } : null);
  };

  const handleHeroChange = (field: 'heroTitle' | 'heroSubtitle' | 'aboutTitle' | 'aboutDescription', langCode: string, value: string) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: {
          ...prev[field],
          [langCode]: value,
        },
      };
    });
  };

  const handleTranslate = async (targetLangCode: string) => {
    if (!formData?.heroTitle?.['vi']) {
      alert('Vui lòng nhập nội dung Tiếng Việt trước khi dịch!');
      return;
    }
    setTranslating(true);
    try {
      const targetLangName = languages.find(l => l.code === targetLangCode)?.name || targetLangCode;
      
      const translatedTitle = await translateText(formData.heroTitle['vi'], targetLangName);
      const translatedSubtitle = formData.heroSubtitle?.['vi'] ? await translateText(formData.heroSubtitle['vi'], targetLangName) : '';
      const translatedAboutTitle = formData.aboutTitle?.['vi'] ? await translateText(formData.aboutTitle['vi'], targetLangName) : '';
      const translatedAboutDesc = formData.aboutDescription?.['vi'] ? await translateText(formData.aboutDescription['vi'], targetLangName) : '';

      setFormData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          heroTitle: { ...prev.heroTitle, [targetLangCode]: translatedTitle },
          heroSubtitle: { ...prev.heroSubtitle, [targetLangCode]: translatedSubtitle },
          aboutTitle: { ...prev.aboutTitle, [targetLangCode]: translatedAboutTitle },
          aboutDescription: { ...prev.aboutDescription, [targetLangCode]: translatedAboutDesc },
        };
      });
      
      alert(`Đã dịch tự động sang ${targetLangName}. Bạn có thể chỉnh sửa lại nếu cần.`);
    } catch (error) {
      console.error('Translation error', error);
      alert('Lỗi dịch tự động.');
    } finally {
      setTranslating(false);
    }
  };

  const handleSave = async () => {
    if (!formData) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'general'), formData);
      alert('Lưu cấu hình thành công!');
    } catch (error) {
      console.error('Error saving settings', error);
      alert('Lưu thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  if (!formData) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cấu hình chung</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>

      {/* Brand Identity */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
          Brand Identity (Nhận diện thương hiệu)
        </h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tên thương hiệu</label>
            <input
              type="text"
              name="brandName"
              value={formData.brandName}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Logo URL</label>
            <input
              type="text"
              name="logo"
              value={formData.logo}
              onChange={handleChange}
              placeholder="https://example.com/logo.png"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
            />
          </div>
        </div>
      </div>

      {/* Browser Metadata */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
          Browser Metadata (SEO)
        </h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tiêu đề trình duyệt (Title)</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Favicon URL</label>
            <input
              type="text"
              name="favicon"
              value={formData.favicon}
              onChange={handleChange}
              placeholder="https://example.com/favicon.ico"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
            />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
          Contact Info (Thông tin liên hệ)
        </h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hotline</label>
            <input
              type="text"
              name="hotline"
              value={formData.hotline}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Zalo</label>
            <input
              type="text"
              name="zalo"
              value={formData.zalo}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
            />
          </div>
        </div>
      </div>

      {/* Font Management */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
          Font Management (Quản lý Font chữ)
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tải lên các font chữ độc quyền (.ttf, .woff, .woff2) để sử dụng trong trình soạn thảo.
            </p>
            <label className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-md text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              {uploadingFont ? 'Đang tải...' : 'Tải Font mới'}
              <input type="file" accept=".ttf,.woff,.woff2,.otf" className="hidden" onChange={handleFontUpload} disabled={uploadingFont} />
            </label>
          </div>
          
          {fonts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {fonts.map(font => (
                <div key={font.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white" style={{ fontFamily: font.name }}>{font.name}</p>
                    <p className="text-xs text-gray-500 uppercase">{font.format}</p>
                  </div>
                  <button onClick={() => handleFontDelete(font)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              Chưa có font chữ nào được tải lên.
            </div>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
          Hero Section (Trang chủ)
        </h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ảnh Slider (URLs, cách nhau bởi dấu phẩy)</label>
            <textarea
              name="heroImages"
              value={formData.heroImages.join(', ')}
              onChange={(e) => setFormData(prev => prev ? { ...prev, heroImages: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : null)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
            />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Nội dung đa ngôn ngữ</h4>
            {languages.map((lang) => (
              <div key={lang.code} className="mb-6 bg-gray-50 dark:bg-gray-900 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase flex items-center gap-2">
                    {lang.name} {lang.isDefault && <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">Mặc định</span>}
                  </h5>
                  {!lang.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleTranslate(lang.code)}
                      disabled={translating}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-md text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                    >
                      <Globe className="w-4 h-4" />
                      {translating ? 'Đang dịch...' : 'Dịch máy từ Tiếng Việt'}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Tiêu đề chính</label>
                    <input
                      type="text"
                      value={formData.heroTitle[lang.code] || ''}
                      onChange={(e) => handleHeroChange('heroTitle', lang.code, e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Mô tả phụ</label>
                    <textarea
                      value={formData.heroSubtitle[lang.code] || ''}
                      onChange={(e) => handleHeroChange('heroSubtitle', lang.code, e.target.value)}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
                    />
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Tiêu đề "Về chúng tôi"</label>
                    <input
                      type="text"
                      value={formData.aboutTitle?.[lang.code] || ''}
                      onChange={(e) => handleHeroChange('aboutTitle', lang.code, e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Nội dung "Về chúng tôi"</label>
                    <textarea
                      value={formData.aboutDescription?.[lang.code] || ''}
                      onChange={(e) => handleHeroChange('aboutDescription', lang.code, e.target.value)}
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
