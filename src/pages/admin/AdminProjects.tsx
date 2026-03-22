import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useStore } from '../../store/useStore';
import { Plus, Edit, Trash2, Globe, X } from 'lucide-react';
import { translateText } from '../../lib/translate';
import BlockEditor from '../../components/BlockEditor';
import BlockRenderer from '../../components/BlockRenderer';
import { Project, ContentBlock } from '../../types';
import { uploadImage } from '../../lib/storage';

export default function AdminProjects() {
  const { user, languages } = useStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState<Partial<Project>>({});
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('vi'); // Default to Vietnamese tab

  const fetchProjects = async () => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
    setProjects(data);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAddNew = () => {
    setCurrentProject({
      title: {},
      description: {},
      location: {},
      price: 0,
      area: 0,
      type: 'Căn hộ',
      images: [],
    });
    setIsEditing(true);
    setActiveTab('vi');
  };

  const handleEdit = (project: Project) => {
    setCurrentProject(project);
    setIsEditing(true);
    setActiveTab('vi');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa dự án này?')) {
      await deleteDoc(doc(db, 'projects', id));
      fetchProjects();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const projectId = currentProject.id || `proj_${Date.now()}`;
      const projectData = {
        ...currentProject,
        createdAt: currentProject.createdAt || new Date().toISOString(),
        createdBy: currentProject.createdBy || user?.email,
      };
      await setDoc(doc(db, 'projects', projectId), projectData);
      setIsEditing(false);
      fetchProjects();
    } catch (error) {
      console.error('Error saving project', error);
      alert('Lưu thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async (targetLangCode: string) => {
    if (!currentProject.title?.['vi']) {
      alert('Vui lòng nhập nội dung Tiếng Việt trước khi dịch!');
      return;
    }
    setTranslating(true);
    try {
      const targetLangName = languages.find(l => l.code === targetLangCode)?.name || targetLangCode;
      
      const translatedTitle = await translateText(currentProject.title['vi'], targetLangName);
      const translatedLoc = currentProject.location?.['vi'] ? await translateText(currentProject.location['vi'], targetLangName) : '';

      // We don't auto-translate blocks yet as it's complex, just copy or leave empty
      const viDesc = currentProject.description?.['vi'];
      
      setCurrentProject(prev => ({
        ...prev,
        title: { ...prev.title, [targetLangCode]: translatedTitle },
        location: { ...prev.location, [targetLangCode]: translatedLoc },
        description: { ...prev.description, [targetLangCode]: viDesc } // Copy blocks for now
      }));
      
      alert(`Đã dịch tự động sang ${targetLangName}. Bạn có thể chỉnh sửa lại nếu cần.`);
    } catch (error) {
      console.error('Translation error', error);
      alert('Lỗi dịch tự động.');
    } finally {
      setTranslating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setLoading(true);
    try {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImage(files[i]);
        newImages.push(url);
      }
      
      setCurrentProject(prev => ({
        ...prev,
        images: [...(prev.images || []), ...newImages]
      }));
    } catch (error) {
      alert('Lỗi tải ảnh lên');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setCurrentProject(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || []
    }));
  };

  const formatPrice = (price: number) => {
    if (!price) return '0 VNĐ';
    if (price >= 1000000000) {
      return `${(price / 1000000000).toFixed(1)} Tỷ VNĐ`;
    }
    return `${(price / 1000000).toFixed(0)} Triệu VNĐ`;
  };

  const getCurrentBlocks = (): ContentBlock[] => {
    const desc = currentProject.description?.[activeTab];
    if (!desc) return [];
    if (typeof desc === 'string') {
      return [{ id: 'legacy', type: 'rich-text', content: desc } as ContentBlock];
    }
    return desc as ContentBlock[];
  };

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {currentProject.id ? 'Sửa dự án' : 'Thêm dự án mới'}
          </h2>
          <div className="flex gap-3">
            <button
              onClick={() => setPreviewing(true)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Xem trước
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : 'Lưu dự án'}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quy mô đầu tư (VNĐ)</label>
              <input
                type="number"
                value={currentProject.price || 0}
                onChange={(e) => setCurrentProject({ ...currentProject, price: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Diện tích (m2)</label>
              <input
                type="number"
                value={currentProject.area || 0}
                onChange={(e) => setCurrentProject({ ...currentProject, area: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Loại hình</label>
              <select
                value={currentProject.type || 'Căn hộ'}
                onChange={(e) => setCurrentProject({ ...currentProject, type: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
              >
                <option value="Căn hộ">Căn hộ</option>
                <option value="Biệt thự">Biệt thự</option>
                <option value="Đất nền">Đất nền</option>
                <option value="Nhà phố">Nhà phố</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hình ảnh dự án</label>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-gray-500 dark:text-gray-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-medium
                      file:bg-indigo-50 file:text-indigo-700
                      dark:file:bg-indigo-900/30 dark:file:text-indigo-400
                      hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50
                      transition-colors cursor-pointer"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">hoặc nhập URL:</span>
                  <input
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const url = e.currentTarget.value.trim();
                        if (url) {
                          setCurrentProject(prev => ({ ...prev, images: [...(prev.images || []), url] }));
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
                  />
                </div>
                
                {currentProject.images && currentProject.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                    {currentProject.images.map((img, idx) => (
                      <div key={idx} className="relative group aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <img src={img || undefined} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nội dung đa ngôn ngữ</h3>
              <div className="flex space-x-2">
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setActiveTab(lang.code)}
                    className={`px-3 py-1 text-sm font-medium rounded-md ${
                      activeTab === lang.code
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                        : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {activeTab !== 'vi' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleTranslate(activeTab)}
                    disabled={translating}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-md text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
                  >
                    <Globe className="w-4 h-4" />
                    {translating ? 'Đang dịch...' : 'Dịch máy từ Tiếng Việt'}
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tên dự án ({activeTab})</label>
                <input
                  type="text"
                  value={currentProject.title?.[activeTab] || ''}
                  onChange={(e) => setCurrentProject({ ...currentProject, title: { ...currentProject.title, [activeTab]: e.target.value } })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vị trí ({activeTab})</label>
                <input
                  type="text"
                  value={currentProject.location?.[activeTab] || ''}
                  onChange={(e) => setCurrentProject({ ...currentProject, location: { ...currentProject.location, [activeTab]: e.target.value } })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mô tả chi tiết ({activeTab})</label>
                <BlockEditor
                  blocks={getCurrentBlocks()}
                  onChange={(blocks) => setCurrentProject({ ...currentProject, description: { ...currentProject.description, [activeTab]: blocks } })}
                />
              </div>
            </div>
          </div>
        </div>

        {previewing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6">
            <div className="bg-white dark:bg-gray-900 w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Xem trước dự án</h3>
                <button
                  onClick={() => setPreviewing(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 sm:p-10">
                <div className="max-w-3xl mx-auto">
                  <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                    {currentProject.title?.[activeTab] || 'Tên dự án'}
                  </h1>
                  <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400 mb-8">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-full text-sm font-medium">
                      {currentProject.type || 'Loại hình'}
                    </span>
                    <span>{currentProject.location?.[activeTab] || 'Vị trí'}</span>
                    <span>•</span>
                    <span>{formatPrice(currentProject.price || 0)}</span>
                  </div>
                  
                  {currentProject.images && currentProject.images.length > 0 && (
                    <div className="mb-10 rounded-xl overflow-hidden aspect-[16/9] shadow-lg">
                      <img src={currentProject.images[0] || undefined} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="mt-8">
                    <BlockRenderer blocks={currentProject.description?.[activeTab] || []} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Dự án</h2>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm dự án
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Dự án
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Loại hình
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Quy mô đầu tư / Diện tích
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Người tạo
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Hành động</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {projects.map((project) => (
              <tr key={project.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <img className="h-10 w-10 rounded-md object-cover" src={project.images?.[0] || 'https://via.placeholder.com/150'} alt="" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{project.title?.['vi'] || 'Chưa có tên'}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{project.location?.['vi'] || 'Chưa có vị trí'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {project.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-gray-900 dark:text-white">{formatPrice(project.price)}</span>
                  <br />
                  <span className="text-xs">{project.area} m²</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {project.createdBy}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(project)}
                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
