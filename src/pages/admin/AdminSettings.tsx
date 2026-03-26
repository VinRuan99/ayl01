import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useStore, Settings } from '../../store/useStore';
import { Save, Globe, Upload, Trash2, CheckCircle } from 'lucide-react';
import { translateText } from '../../lib/translate';
import { CustomFont, loadCustomFonts, uploadCustomFont, deleteCustomFont, addGoogleFont } from '../../lib/fonts';
import { uploadImage } from '../../lib/storage';

export default function AdminSettings() {
  const { settings, languages } = useStore();
  const [formData, setFormData] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [fonts, setFonts] = useState<CustomFont[]>([]);
  const [uploadingFont, setUploadingFont] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingMascot, setUploadingMascot] = useState<string | null>(null);
  const [deleteConfirmFont, setDeleteConfirmFont] = useState<CustomFont | null>(null);
  const [messageAlert, setMessageAlert] = useState<{title: string, message: string} | null>(null);
  const [fontPrompt, setFontPrompt] = useState<{file: File, resolve: (name: string | null) => void} | null>(null);
  const [googleFontPrompt, setGoogleFontPrompt] = useState(false);
  const [googleFontData, setGoogleFontData] = useState({ name: '', url: '' });
  const [previewAction, setPreviewAction] = useState<'create' | 'update' | 'delete' | 'reorder'>('create');

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
    
    // Check if it's a font file
    const validExtensions = ['.ttf', '.woff', '.woff2', '.otf'];
    const isValidFont = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!isValidFont) {
      setMessageAlert({ title: 'Lỗi', message: 'Định dạng font không hợp lệ. Vui lòng chọn file .ttf, .woff, .woff2, hoặc .otf' });
      return;
    }

    const name = await new Promise<string | null>((resolve) => {
      setFontPrompt({ file, resolve });
    });
    
    if (!name) return;

    setUploadingFont(true);
    try {
      const newFont = await uploadCustomFont(file, name);
      setFonts(prev => [...prev, newFont]);
      setMessageAlert({ title: 'Thành công', message: 'Tải font lên thành công!' });
    } catch (error) {
      console.error('Error uploading font:', error);
      setMessageAlert({ title: 'Lỗi', message: 'Lỗi tải font lên.' });
    } finally {
      setUploadingFont(false);
    }
  };

  const handleFontDelete = (font: CustomFont) => {
    setDeleteConfirmFont(font);
  };

  const handleAddGoogleFont = async () => {
    let finalUrl = googleFontData.url;
    let finalName = googleFontData.name;

    // Extract URL if user pasted the whole <link> tag
    if (finalUrl.includes('<link')) {
      const matches = Array.from(finalUrl.matchAll(/href=["'](.*?)["']/g));
      const cssMatch = matches.find(m => m[1].includes('fonts.googleapis.com/css'));
      if (cssMatch) {
        finalUrl = cssMatch[1];
      } else if (matches.length > 0) {
        finalUrl = matches[matches.length - 1][1];
      }
    }

    // Auto-extract name if empty
    if (!finalName && finalUrl.includes('family=')) {
      const familyMatch = finalUrl.match(/[?&]family=([^:&]+)/);
      if (familyMatch && familyMatch[1]) {
        finalName = familyMatch[1].replace(/\+/g, ' ');
      }
    }

    if (!finalName || !finalUrl) {
      setMessageAlert({ title: 'Lỗi', message: 'Vui lòng nhập đầy đủ tên và URL của Google Font.' });
      return;
    }

    setUploadingFont(true);
    try {
      const newFont = await addGoogleFont(finalName, finalUrl);
      setFonts(prev => [...prev, newFont]);
      setMessageAlert({ title: 'Thành công', message: 'Thêm Google Font thành công!' });
      setGoogleFontPrompt(false);
      setGoogleFontData({ name: '', url: '' });
    } catch (error) {
      console.error('Error adding Google font:', error);
      setMessageAlert({ title: 'Lỗi', message: 'Lỗi thêm Google Font.' });
    } finally {
      setUploadingFont(false);
    }
  };

  const confirmDeleteFont = async () => {
    if (!deleteConfirmFont) return;
    try {
      await deleteCustomFont(deleteConfirmFont);
      setFonts(prev => prev.filter(f => f.id !== deleteConfirmFont.id));
      setMessageAlert({ title: 'Thành công', message: 'Xóa font thành công!' });
      setDeleteConfirmFont(null);
    } catch (error) {
      console.error('Error deleting font:', error);
      setMessageAlert({ title: 'Lỗi', message: 'Lỗi xóa font.' });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const base64 = await uploadImage(file, 'settings');
      setFormData(prev => prev ? { ...prev, logo: base64 } : null);
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessageAlert({ title: 'Lỗi', message: 'Lỗi tải ảnh lên.' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFavicon(true);
    try {
      const base64 = await uploadImage(file, 'settings');
      setFormData(prev => prev ? { ...prev, favicon: base64 } : null);
    } catch (error) {
      console.error('Error uploading favicon:', error);
      setMessageAlert({ title: 'Lỗi', message: 'Lỗi tải ảnh lên.' });
    } finally {
      setUploadingFavicon(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleLogoDrop = async (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setUploadingLogo(true);
    try {
      const base64 = await uploadImage(file, 'settings');
      setFormData(prev => prev ? { ...prev, logo: base64 } : null);
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessageAlert({ title: 'Lỗi', message: 'Lỗi tải ảnh lên.' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFaviconDrop = async (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file || (!file.type.startsWith('image/') && !file.name.endsWith('.ico'))) return;
    setUploadingFavicon(true);
    try {
      const base64 = await uploadImage(file, 'settings');
      setFormData(prev => prev ? { ...prev, favicon: base64 } : null);
    } catch (error) {
      console.error('Error uploading favicon:', error);
      setMessageAlert({ title: 'Lỗi', message: 'Lỗi tải ảnh lên.' });
    } finally {
      setUploadingFavicon(false);
    }
  };

  const handleMascotUpload = async (e: React.ChangeEvent<HTMLInputElement>, action: string, message: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMascot(action);
    try {
      const base64 = await uploadImage(file, 'settings');
      setFormData(prev => prev ? { ...prev, adminNotifications: { ...(prev.adminNotifications || {} as any), [action]: { message, imageUrl: base64 } } } : null);
    } catch (error) {
      console.error('Error uploading mascot:', error);
      setMessageAlert({ title: 'Lỗi', message: 'Lỗi tải ảnh lên.' });
    } finally {
      setUploadingMascot(null);
    }
  };

  const handleMascotDrop = async (e: React.DragEvent<HTMLElement>, action: string, message: string) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setUploadingMascot(action);
    try {
      const base64 = await uploadImage(file, 'settings');
      setFormData(prev => prev ? { ...prev, adminNotifications: { ...(prev.adminNotifications || {} as any), [action]: { message, imageUrl: base64 } } } : null);
    } catch (error) {
      console.error('Error uploading mascot:', error);
      setMessageAlert({ title: 'Lỗi', message: 'Lỗi tải ảnh lên.' });
    } finally {
      setUploadingMascot(null);
    }
  };

  const handleFontDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    // Check if it's a font file
    const validExtensions = ['.ttf', '.woff', '.woff2', '.otf'];
    const isValidFont = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!isValidFont) {
      setMessageAlert({ title: 'Lỗi', message: 'Định dạng font không hợp lệ. Vui lòng chọn file .ttf, .woff, .woff2, hoặc .otf' });
      return;
    }

    const name = await new Promise<string | null>((resolve) => {
      setFontPrompt({ file, resolve });
    });
    
    if (!name) return;

    setUploadingFont(true);
    try {
      const newFont = await uploadCustomFont(file, name);
      setFonts(prev => [...prev, newFont]);
      setMessageAlert({ title: 'Thành công', message: 'Tải font lên thành công!' });
    } catch (error) {
      console.error('Error uploading font:', error);
      setMessageAlert({ title: 'Lỗi', message: 'Lỗi tải font lên.' });
    } finally {
      setUploadingFont(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => prev ? { ...prev, [name]: value } : null);
  };

  const handleHeroChange = (field: 'heroTitle' | 'heroSubtitle' | 'aboutTitle' | 'aboutDescription' | 'aboutStat1Label' | 'aboutStat2Label', langCode: string, value: string) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: {
          ...(prev[field] as Record<string, string>),
          [langCode]: value,
        },
      };
    });
  };

  const handleTranslate = async (targetLangCode: string) => {
    if (!formData?.heroTitle?.['vi']) {
      setMessageAlert({ title: 'Thông báo', message: 'Vui lòng nhập nội dung Tiếng Việt trước khi dịch!' });
      return;
    }
    setTranslating(true);
    try {
      const targetLangName = languages.find(l => l.code === targetLangCode)?.name || targetLangCode;
      
      const translatedTitle = await translateText(formData.heroTitle['vi'], targetLangName);
      const translatedSubtitle = formData.heroSubtitle?.['vi'] ? await translateText(formData.heroSubtitle['vi'], targetLangName) : '';
      const translatedAboutTitle = formData.aboutTitle?.['vi'] ? await translateText(formData.aboutTitle['vi'], targetLangName) : '';
      const translatedAboutDesc = formData.aboutDescription?.['vi'] ? await translateText(formData.aboutDescription['vi'], targetLangName) : '';
      const translatedStat1Label = formData.aboutStat1Label?.['vi'] ? await translateText(formData.aboutStat1Label['vi'], targetLangName) : '';
      const translatedStat2Label = formData.aboutStat2Label?.['vi'] ? await translateText(formData.aboutStat2Label['vi'], targetLangName) : '';

      setFormData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          heroTitle: { ...prev.heroTitle, [targetLangCode]: translatedTitle },
          heroSubtitle: { ...prev.heroSubtitle, [targetLangCode]: translatedSubtitle },
          aboutTitle: { ...prev.aboutTitle, [targetLangCode]: translatedAboutTitle },
          aboutDescription: { ...prev.aboutDescription, [targetLangCode]: translatedAboutDesc },
          aboutStat1Label: { ...(prev.aboutStat1Label || {}), [targetLangCode]: translatedStat1Label },
          aboutStat2Label: { ...(prev.aboutStat2Label || {}), [targetLangCode]: translatedStat2Label },
        };
      });
      
      setMessageAlert({ title: 'Thành công', message: `Đã dịch tự động sang ${targetLangName}. Bạn có thể chỉnh sửa lại nếu cần.` });
    } catch (error) {
      console.error('Translation error', error);
      setMessageAlert({ title: 'Lỗi', message: 'Lỗi dịch tự động.' });
    } finally {
      setTranslating(false);
    }
  };

  const handleSave = async () => {
    if (!formData) return;
    setSaving(true);
    try {
      // Hàm đệ quy để loại bỏ tất cả các giá trị undefined ở mọi cấp độ (nested)
      const removeUndefined = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(removeUndefined).filter(item => item !== undefined);
        } else if (obj !== null && typeof obj === 'object') {
          return Object.keys(obj).reduce((acc, key) => {
            if (obj[key] !== undefined) {
              acc[key] = removeUndefined(obj[key]);
            }
            return acc;
          }, {} as any);
        }
        return obj;
      };

      const cleanFormData = removeUndefined(formData);

      if (cleanFormData.customProjectTypes) {
        cleanFormData.customProjectTypes = cleanFormData.customProjectTypes.map((s: string) => s.trim()).filter(Boolean);
      }
      if (cleanFormData.heroImages) {
        cleanFormData.heroImages = cleanFormData.heroImages.map((s: string) => s.trim()).filter(Boolean);
      }

      await setDoc(doc(db, 'settings', 'general'), cleanFormData);
      setMessageAlert({ title: 'Thành công', message: 'Lưu cấu hình thành công!' });
    } catch (error) {
      console.error('Error saving settings', error);
      setMessageAlert({ title: 'Lỗi', message: 'Lưu thất bại. Vui lòng kiểm tra console để xem chi tiết lỗi.' });
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Logo (URL hoặc Tải lên)</label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                name="logo"
                value={formData.logo}
                onChange={handleChange}
                placeholder="https://example.com/logo.png"
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
              />
              <label 
                className="flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer whitespace-nowrap transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleLogoDrop}
              >
                {uploadingLogo ? 'Đang tải...' : 'Tải ảnh'}
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
              </label>
            </div>
            {formData.logo && (
              <div className="mt-2">
                <img src={formData.logo} alt="Logo preview" className="h-12 object-contain bg-gray-100 dark:bg-gray-800 rounded p-1" />
              </div>
            )}
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Favicon (URL hoặc Tải lên)</label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                name="favicon"
                value={formData.favicon}
                onChange={handleChange}
                placeholder="https://example.com/favicon.ico"
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
              />
              <label 
                className="flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer whitespace-nowrap transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleFaviconDrop}
              >
                {uploadingFavicon ? 'Đang tải...' : 'Tải ảnh'}
                <input type="file" accept="image/*,.ico" className="hidden" onChange={handleFaviconUpload} disabled={uploadingFavicon} />
              </label>
            </div>
            {formData.favicon && (
              <div className="mt-2">
                <img src={formData.favicon} alt="Favicon preview" className="h-8 w-8 object-contain bg-gray-100 dark:bg-gray-800 rounded p-1" />
              </div>
            )}
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
      <div 
        className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700 relative"
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDrop={handleFontDrop}
      >
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
          Font Management (Quản lý Font chữ)
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tải lên các font chữ độc quyền (.ttf, .woff, .woff2) hoặc nhúng từ Google Fonts để sử dụng trong trình soạn thảo. Có thể kéo thả file vào khu vực này.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGoogleFontPrompt(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                disabled={uploadingFont}
              >
                <Globe className="w-4 h-4" />
                Thêm Google Font
              </button>
              <label 
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-md text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                {uploadingFont ? 'Đang tải...' : 'Tải Font mới'}
                <input type="file" accept=".ttf,.woff,.woff2,.otf" className="hidden" onChange={handleFontUpload} disabled={uploadingFont} />
              </label>
            </div>
          </div>
          
          {fonts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {fonts.map(font => (
                <div key={font.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white" style={{ fontFamily: `"${font.name}"` }}>{font.name}</p>
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

      {/* Admin Notifications */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
          Admin Notifications (Thông báo trang quản trị)
        </h3>
        <div className="space-y-6">
          
          {/* Action Specific Settings */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white">Nội dung & Hình ảnh theo hành động</h4>
            
            {['create', 'update', 'delete', 'reorder'].map((action) => {
              const actionLabels: Record<string, string> = {
                create: 'Tạo dự án',
                update: 'Cập nhật dự án',
                delete: 'Xóa dự án',
                reorder: 'Đổi vị trí'
              };
              const defaultMsgs: Record<string, string> = {
                create: 'Đã tạo dự án thành công',
                update: 'Đã cập nhật dự án thành công',
                delete: 'Đã xóa dự án thành công',
                reorder: 'Đã chuyển vị trí thành công'
              };
              
              const currentActionConfig = formData.adminNotifications?.[action as keyof typeof formData.adminNotifications] as any;
              // Handle migration from old format
              const message = typeof currentActionConfig === 'object' ? currentActionConfig?.message : (formData.adminNotifications as any)?.[`${action}Msg`] || defaultMsgs[action];
              const imageUrl = typeof currentActionConfig === 'object' ? currentActionConfig?.imageUrl : '';

              return (
                <div key={action} className="grid grid-cols-1 gap-4 sm:grid-cols-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Thông báo {actionLabels[action]}</label>
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setFormData(prev => prev ? { ...prev, adminNotifications: { ...(prev.adminNotifications || {} as any), [action]: { message: e.target.value, imageUrl } } } : null)}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ảnh linh vật (URL hoặc Tải lên)</label>
                    <div className="mt-1 flex gap-2">
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setFormData(prev => prev ? { ...prev, adminNotifications: { ...(prev.adminNotifications || {} as any), [action]: { message, imageUrl: e.target.value } } } : null)}
                        placeholder="https://example.com/mascot.png"
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
                      />
                      <label 
                        className="flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer whitespace-nowrap transition-colors"
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDrop={(e) => handleMascotDrop(e, action, message)}
                      >
                        {uploadingMascot === action ? 'Đang tải...' : 'Tải ảnh'}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleMascotUpload(e, action, message)} disabled={uploadingMascot === action} />
                      </label>
                    </div>
                    {imageUrl && (
                      <div className="mt-2">
                        <img src={imageUrl} alt="Mascot preview" className="h-12 object-contain bg-gray-100 dark:bg-gray-800 rounded p-1" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Cài đặt hiển thị</h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vị trí thông báo</label>
                <select
                  value={formData.adminNotifications?.position || 'bottom-left'}
                  onChange={(e) => setFormData(prev => prev ? { ...prev, adminNotifications: { ...(prev.adminNotifications || {} as any), position: e.target.value } } : null)}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
                >
                  <option value="top-left">Góc trên trái</option>
                  <option value="top-right">Góc trên phải</option>
                  <option value="top-center">Ở giữa phía trên</option>
                  <option value="bottom-left">Góc dưới trái</option>
                  <option value="bottom-right">Góc dưới phải</option>
                  <option value="bottom-center">Ở giữa phía dưới</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian hiển thị (ms)</label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={formData.adminNotifications?.duration || 3000}
                  onChange={(e) => setFormData(prev => prev ? { ...prev, adminNotifications: { ...(prev.adminNotifications || {} as any), duration: parseInt(e.target.value, 10) } } : null)}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Căn lề chữ</label>
                <select
                  value={formData.adminNotifications?.textAlign || 'left'}
                  onChange={(e) => setFormData(prev => prev ? { ...prev, adminNotifications: { ...(prev.adminNotifications || {} as any), textAlign: e.target.value } } : null)}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
                >
                  <option value="left">Trái</option>
                  <option value="center">Giữa</option>
                  <option value="right">Phải</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Màu sắc & Khung</h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Màu nền</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.adminNotifications?.backgroundColor || '#22c55e'}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, adminNotifications: { ...(prev.adminNotifications || {} as any), backgroundColor: e.target.value } } : null)}
                    className="h-8 w-8 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.adminNotifications?.backgroundColor || '#22c55e'}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, adminNotifications: { ...(prev.adminNotifications || {} as any), backgroundColor: e.target.value } } : null)}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-1.5 border"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Màu chữ</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.adminNotifications?.textColor || '#ffffff'}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, adminNotifications: { ...(prev.adminNotifications || {} as any), textColor: e.target.value } } : null)}
                    className="h-8 w-8 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.adminNotifications?.textColor || '#ffffff'}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, adminNotifications: { ...(prev.adminNotifications || {} as any), textColor: e.target.value } } : null)}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-1.5 border"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Màu viền</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.adminNotifications?.borderColor || '#000000'}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, adminNotifications: { ...(prev.adminNotifications || {} as any), borderColor: e.target.value } } : null)}
                    className="h-8 w-8 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.adminNotifications?.borderColor || '#000000'}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, adminNotifications: { ...(prev.adminNotifications || {} as any), borderColor: e.target.value } } : null)}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-1.5 border"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Độ dày viền (px)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.adminNotifications?.borderWidth || 0}
                  onChange={(e) => setFormData(prev => prev ? { ...prev, adminNotifications: { ...(prev.adminNotifications || {} as any), borderWidth: parseInt(e.target.value, 10) } } : null)}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bo góc</label>
                <select
                  value={formData.adminNotifications?.borderRadius || '8px'}
                  onChange={(e) => setFormData(prev => prev ? { ...prev, adminNotifications: { ...(prev.adminNotifications || {} as any), borderRadius: e.target.value } } : null)}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
                >
                  <option value="0px">Vuông (0px)</option>
                  <option value="4px">Bo nhẹ (4px)</option>
                  <option value="8px">Bo vừa (8px)</option>
                  <option value="16px">Bo nhiều (16px)</option>
                  <option value="9999px">Bo tròn (9999px)</option>
                </select>
              </div>
              <div className="flex items-center gap-4 mt-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="fontBold"
                    checked={formData.adminNotifications?.fontBold || false}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, adminNotifications: { ...(prev.adminNotifications || {} as any), fontBold: e.target.checked } } : null)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="fontBold" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    In đậm chữ
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="textShadow"
                    checked={formData.adminNotifications?.textShadow || false}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, adminNotifications: { ...(prev.adminNotifications || {} as any), textShadow: e.target.checked } } : null)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="textShadow" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Đổ bóng chữ
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Chế độ ảnh</h4>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="showImage"
                checked={formData.adminNotifications?.showImage || false}
                onChange={(e) => setFormData(prev => prev ? { ...prev, adminNotifications: { ...(prev.adminNotifications || {} as any), showImage: e.target.checked } } : null)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="showImage" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Hiển thị ảnh linh vật (Ảnh sẽ nằm dưới chữ)
              </label>
            </div>

            {formData.adminNotifications?.showImage && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vị trí ảnh</label>
                  <select
                    value={formData.adminNotifications?.imagePosition || 'left'}
                    onChange={(e) => setFormData(prev => prev ? { ...prev, adminNotifications: { ...(prev.adminNotifications || {} as any), imagePosition: e.target.value } } : null)}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
                  >
                    <option value="left">Bên trái</option>
                    <option value="right">Bên phải</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">Xem trước (Preview)</h4>
              <select
                value={previewAction}
                onChange={(e) => setPreviewAction(e.target.value as any)}
                className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-1 border"
              >
                <option value="create">Thêm mới</option>
                <option value="update">Cập nhật</option>
                <option value="delete">Xóa</option>
                <option value="reorder">Đổi vị trí</option>
              </select>
            </div>
            <div className="p-8 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 relative overflow-hidden min-h-[200px] flex items-center justify-center">
              <div 
                className="relative shadow-xl overflow-hidden flex items-center"
                style={{ 
                  backgroundColor: formData.adminNotifications?.backgroundColor || '#22c55e',
                  borderRadius: formData.adminNotifications?.borderRadius || '8px',
                  borderWidth: `${formData.adminNotifications?.borderWidth || 0}px`,
                  borderColor: formData.adminNotifications?.borderColor || '#000000',
                  borderStyle: 'solid',
                  minWidth: '250px',
                  minHeight: '60px',
                }}
              >
                {formData.adminNotifications?.showImage && (formData.adminNotifications as any)?.[previewAction]?.imageUrl && (
                  <img 
                    src={(formData.adminNotifications as any)[previewAction].imageUrl} 
                    alt="Preview Mascot" 
                    className="absolute top-0 bottom-0 h-full object-contain opacity-50 pointer-events-none"
                    style={{
                      [formData.adminNotifications?.imagePosition === 'right' ? 'right' : 'left']: 0,
                      zIndex: 0
                    }}
                  />
                )}
                <div 
                  className="relative z-10 w-full px-4 py-3 flex items-center gap-2"
                  style={{
                    color: formData.adminNotifications?.textColor || '#ffffff',
                    fontWeight: formData.adminNotifications?.fontBold ? 'bold' : 'normal',
                    textAlign: formData.adminNotifications?.textAlign as any || 'left',
                    textShadow: formData.adminNotifications?.textShadow ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none',
                    justifyContent: formData.adminNotifications?.textAlign === 'center' ? 'center' : formData.adminNotifications?.textAlign === 'right' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{(formData.adminNotifications as any)?.[previewAction]?.message || 'Đã thực hiện thành công'}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
          Cấu hình Dự án
        </h3>
        
        <div className="space-y-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Các loại hình dự án bổ sung (cách nhau bởi dấu phẩy)
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Mặc định đã có: Căn hộ, Biệt thự, Đất nền, Nhà phố. Bạn có thể thêm các loại hình khác ở đây.
            </p>
            <textarea
              name="customProjectTypes"
              value={(formData.customProjectTypes || []).join(',')}
              onChange={(e) => setFormData(prev => prev ? { ...prev, customProjectTypes: e.target.value.split(',') } : null)}
              rows={2}
              placeholder="VD: Shophouse, Condotel, Officetel"
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
            />
          </div>
        </div>

        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
          Hero Section (Trang chủ)
        </h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ảnh Slider (URLs, cách nhau bởi dấu phẩy)</label>
            <textarea
              name="heroImages"
              value={(formData.heroImages || []).join(',')}
              onChange={(e) => setFormData(prev => prev ? { ...prev, heroImages: e.target.value.split(',') } : null)}
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
                  
                  {/* Stats Settings */}
                  {lang.isDefault && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2 col-span-1">
                      <div className="flex items-center gap-2 mb-4">
                        <input
                          type="checkbox"
                          id="showAboutStats"
                          checked={formData.showAboutStats !== false}
                          onChange={(e) => setFormData(prev => prev ? { ...prev, showAboutStats: e.target.checked } : null)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="showAboutStats" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Hiển thị phần Thống kê (Stats)
                        </label>
                      </div>
                      
                      {formData.showAboutStats !== false && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                            <h6 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase">Thống kê 1</h6>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Giá trị (VD: 10+)</label>
                                <input
                                  type="text"
                                  value={formData.aboutStat1Value || ''}
                                  onChange={(e) => setFormData(prev => prev ? { ...prev, aboutStat1Value: e.target.value } : null)}
                                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-1.5 border"
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                            <h6 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase">Thống kê 2</h6>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Giá trị (VD: 50+)</label>
                                <input
                                  type="text"
                                  value={formData.aboutStat2Value || ''}
                                  onChange={(e) => setFormData(prev => prev ? { ...prev, aboutStat2Value: e.target.value } : null)}
                                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-1.5 border"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {formData.showAboutStats !== false && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Nhãn Thống kê 1 ({lang.name})</label>
                        <input
                          type="text"
                          value={formData.aboutStat1Label?.[lang.code] || ''}
                          onChange={(e) => handleHeroChange('aboutStat1Label', lang.code, e.target.value)}
                          placeholder="VD: Năm kinh nghiệm"
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-1.5 border"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Nhãn Thống kê 2 ({lang.name})</label>
                        <input
                          type="text"
                          value={formData.aboutStat2Label?.[lang.code] || ''}
                          onChange={(e) => handleHeroChange('aboutStat2Label', lang.code, e.target.value)}
                          placeholder="VD: Dự án hoàn thành"
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-1.5 border"
                        />
                      </div>
                    </div>
                  )}

                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmFont && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Xác nhận xóa</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Bạn có chắc chắn muốn xóa font {deleteConfirmFont.name}? Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmFont(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteFont}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {messageAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{messageAlert.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{messageAlert.message}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setMessageAlert(null)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Font Name Prompt Modal */}
      {fontPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Nhập tên font</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Nhập tên cho font chữ này (ví dụ: MyCustomFont):</p>
            <input
              type="text"
              id="fontNameInput"
              className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border mb-6"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value;
                  if (val) {
                    fontPrompt.resolve(val);
                    setFontPrompt(null);
                  }
                }
              }}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  fontPrompt.resolve(null);
                  setFontPrompt(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('fontNameInput') as HTMLInputElement;
                  if (input && input.value) {
                    fontPrompt.resolve(input.value);
                    setFontPrompt(null);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Google Font Prompt Modal */}
      {googleFontPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Thêm Google Font</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên Font (Font Family)</label>
                <input
                  type="text"
                  value={googleFontData.name}
                  onChange={(e) => setGoogleFontData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ví dụ: Roboto"
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL CSS của Google Font</label>
                <input
                  type="text"
                  value={googleFontData.url}
                  onChange={(e) => {
                    const val = e.target.value;
                    let extractedName = googleFontData.name;
                    
                    let tempUrl = val;
                    if (tempUrl.includes('<link')) {
                      const matches = Array.from(tempUrl.matchAll(/href=["'](.*?)["']/g));
                      const cssMatch = matches.find(m => m[1].includes('fonts.googleapis.com/css'));
                      if (cssMatch) {
                        tempUrl = cssMatch[1];
                      }
                    }
                    
                    if (!extractedName && tempUrl.includes('family=')) {
                      const familyMatch = tempUrl.match(/[?&]family=([^:&]+)/);
                      if (familyMatch && familyMatch[1]) {
                        extractedName = familyMatch[1].replace(/\+/g, ' ');
                      }
                    }
                    
                    setGoogleFontData({ name: extractedName, url: val });
                  }}
                  placeholder="Ví dụ: https://fonts.googleapis.com/css2?family=Roboto&display=swap"
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddGoogleFont();
                    }
                  }}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Sao chép link từ thẻ &lt;link href="..."&gt; trên trang Google Fonts.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setGoogleFontPrompt(false);
                  setGoogleFontData({ name: '', url: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
              >
                Hủy
              </button>
              <button
                onClick={handleAddGoogleFont}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
              >
                Thêm Font
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
