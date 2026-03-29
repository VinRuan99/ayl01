import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useStore } from '../../store/useStore';
import { Plus, Edit, Trash2, Globe, X, GripVertical, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { translateText } from '../../lib/translate';
import BlockEditor from '../../components/BlockEditor';
import BlockRenderer from '../../components/BlockRenderer';
import { Project, ContentBlock } from '../../types';
import { uploadImage } from '../../lib/storage';

const OrderInput = ({ index, projectId, onReorder, max }: { index: number, projectId: string, onReorder: (id: string, pos: number) => void, max: number }) => {
  const [value, setValue] = useState((index + 1).toString());

  useEffect(() => {
    setValue((index + 1).toString());
  }, [index]);

  return (
    <input
      type="number"
      min="1"
      max={max}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          const newPos = parseInt(value, 10);
          if (!isNaN(newPos) && newPos !== index + 1) {
            onReorder(projectId, newPos);
          }
        }
      }}
      onBlur={() => setValue((index + 1).toString())}
      className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 text-center"
    />
  );
};

export default function AdminProjects() {
  const { user, languages, showAdminNotification, settings } = useStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState<Partial<Project>>({});
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('vi'); // Default to Vietnamese tab
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [messageAlert, setMessageAlert] = useState<{title: string, message: string} | null>(null);
  const [showBasicInfo, setShowBasicInfo] = useState(false);

  const fetchProjects = async () => {
    const q = query(collection(db, 'projects'));
    const snap = await getDocs(q);
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
    data.sort((a, b) => {
      const orderA = a.order ?? -1;
      const orderB = b.order ?? -1;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
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
      hideDetails: true,
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

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      await deleteDoc(doc(db, 'projects', deleteConfirmId));
      showAdminNotification('Đã xóa dự án thành công', 'delete');
      fetchProjects();
      setDeleteConfirmId(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const projectId = currentProject.id || `proj_${Date.now()}`;
      const projectData = {
        ...currentProject,
        id: projectId,
        createdAt: currentProject.createdAt || new Date().toISOString(),
        createdBy: currentProject.createdBy || user?.email || 'admin',
        order: currentProject.order ?? -1,
      };
      
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

      const cleanProjectData = removeUndefined(projectData);

      // Kiểm tra dung lượng trước khi lưu (Firestore limit là 1MB = 1,048,576 bytes)
      const dataString = JSON.stringify(cleanProjectData);
      const sizeInBytes = new Blob([dataString]).size;
      const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
      
      if (sizeInBytes > 800000) { // Cảnh báo ở mức ~800KB
        setMessageAlert({ title: 'Lưu thất bại', message: `Dung lượng dự án quá lớn (${sizeInMB}MB). Giới hạn an toàn của cơ sở dữ liệu là ~0.8MB. Vui lòng xóa bớt ảnh hoặc sử dụng ảnh có dung lượng nhỏ hơn (hoặc dùng link URL).` });
        setLoading(false);
        return;
      }

      await setDoc(doc(db, 'projects', projectId), cleanProjectData);
      showAdminNotification(currentProject.id ? 'Đã cập nhật dự án thành công' : 'Đã tạo dự án thành công', currentProject.id ? 'update' : 'create');
      setIsEditing(false);
      fetchProjects();
    } catch (error) {
      console.error('Error saving project', error);
      setMessageAlert({ title: 'Lỗi', message: 'Lưu thất bại. Vui lòng kiểm tra console để xem chi tiết lỗi.' });
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async (targetLangCode: string) => {
    if (!currentProject.title?.['vi']) {
      setMessageAlert({ title: 'Thông báo', message: 'Vui lòng nhập nội dung Tiếng Việt trước khi dịch!' });
      return;
    }
    setTranslating(true);
    try {
      const targetLangName = languages.find(l => l.code === targetLangCode)?.name || targetLangCode;
      
      const translatedTitle = await translateText(currentProject.title['vi'], targetLangName);
      const translatedLoc = currentProject.location?.['vi'] ? await translateText(currentProject.location['vi'], targetLangName) : '';

      const viDesc = currentProject.description?.['vi'];
      let translatedDesc: string | ContentBlock[] = '';
      
      if (typeof viDesc === 'string') {
        translatedDesc = await translateText(viDesc, targetLangName);
      } else if (Array.isArray(viDesc)) {
        translatedDesc = await Promise.all(viDesc.map(async (block) => {
          if (block.type === 'rich-text') {
            return {
              ...block,
              content: await translateText(block.content, targetLangName)
            };
          } else if (block.type === 'image-text') {
            return {
              ...block,
              text: await translateText(block.text, targetLangName)
            };
          }
          return block;
        }));
      }
      
      setCurrentProject(prev => ({
        ...prev,
        title: { ...prev.title, [targetLangCode]: translatedTitle },
        location: { ...prev.location, [targetLangCode]: translatedLoc },
        description: { ...prev.description, [targetLangCode]: translatedDesc }
      }));
      
      setMessageAlert({ title: 'Thành công', message: `Đã dịch tự động sang ${targetLangName}. Bạn có thể chỉnh sửa lại nếu cần.` });
    } catch (error) {
      console.error('Translation error', error);
      setMessageAlert({ title: 'Lỗi', message: 'Lỗi dịch tự động.' });
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
      setMessageAlert({ title: 'Lỗi', message: 'Lỗi tải ảnh lên' });
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleImageDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    try {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith('image/')) {
          const url = await uploadImage(files[i]);
          newImages.push(url);
        }
      }
      
      setCurrentProject(prev => ({
        ...prev,
        images: [...(prev.images || []), ...newImages]
      }));
    } catch (error) {
      setMessageAlert({ title: 'Lỗi', message: 'Lỗi tải ảnh lên' });
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index: number) => {
    setCurrentProject(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || []
    }));
  };

  const handleDragStartRow = (e: React.DragEvent<HTMLTableRowElement>, id: string) => {
    setDraggedProjectId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverRow = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const updateProjectsOrder = async (updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    try {
      const chunkSize = 500;
      for (let i = 0; i < updatedProjects.length; i += chunkSize) {
        const chunk = updatedProjects.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach(p => {
          const docRef = doc(db, 'projects', p.id);
          batch.set(docRef, { order: p.order }, { merge: true });
        });
        await batch.commit();
      }
      showAdminNotification('Đã chuyển vị trí thành công', 'reorder');
    } catch (error) {
      console.error('Error updating order', error);
      setMessageAlert({ title: 'Lỗi', message: 'Lỗi khi cập nhật thứ tự' });
      fetchProjects();
    }
  };

  const handleManualReorder = async (projectId: string, newPosition: number) => {
    const targetIndex = Math.max(0, Math.min(projects.length - 1, newPosition - 1));
    const draggedIndex = projects.findIndex(p => p.id === projectId);
    
    if (draggedIndex === -1 || targetIndex === draggedIndex) return;

    const newProjects = [...projects];
    const [draggedProject] = newProjects.splice(draggedIndex, 1);
    newProjects.splice(targetIndex, 0, draggedProject);

    const updatedProjects = newProjects.map((p, index) => ({
      ...p,
      order: index
    }));

    await updateProjectsOrder(updatedProjects);
  };

  const handleDropRow = async (e: React.DragEvent<HTMLTableRowElement>, targetId: string) => {
    e.preventDefault();
    if (!draggedProjectId || draggedProjectId === targetId) return;

    const draggedIndex = projects.findIndex(p => p.id === draggedProjectId);
    const targetIndex = projects.findIndex(p => p.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newProjects = [...projects];
    const [draggedProject] = newProjects.splice(draggedIndex, 1);
    newProjects.splice(targetIndex, 0, draggedProject);

    const updatedProjects = newProjects.map((p, index) => ({
      ...p,
      order: index
    }));

    setDraggedProjectId(null);
    await updateProjectsOrder(updatedProjects);
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
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Thông tin cơ bản
            </h3>
            <button 
              type="button" 
              onClick={() => setShowBasicInfo(!showBasicInfo)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 rounded-md transition-colors"
            >
              {showBasicInfo ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Thu gọn để soạn thảo
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Mở rộng thông tin
                </>
              )}
            </button>
          </div>

          {showBasicInfo && (
            <>
              <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentProject.hideDetails || false}
                    onChange={(e) => setCurrentProject({ ...currentProject, hideDetails: e.target.checked })}
                    className="mr-2 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  Ẩn bảng "Thông tin chi tiết" (Giá, Diện tích, Loại hình, Vị trí) trên trang dự án
                </label>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-6">
                  Khi chọn tùy chọn này, bảng thông tin ở cột bên phải trên trang chi tiết dự án sẽ bị ẩn đi.
                </p>
              </div>
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
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Diện tích (m2)</label>
                  <label className="flex items-center text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentProject.hideArea || false}
                      onChange={(e) => setCurrentProject({ ...currentProject, hideArea: e.target.checked })}
                      className="mr-2 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Ẩn
                  </label>
                </div>
                <input
                  type="text"
                  value={currentProject.area || ''}
                  onChange={(e) => setCurrentProject({ ...currentProject, area: e.target.value })}
                  placeholder="VD: 205 - 300"
                  disabled={currentProject.hideArea}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border disabled:opacity-50"
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
                  {settings?.customProjectTypes?.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                  {currentProject.type && 
                   !['Căn hộ', 'Biệt thự', 'Đất nền', 'Nhà phố'].includes(currentProject.type) && 
                   !(settings?.customProjectTypes || []).includes(currentProject.type) && (
                    <option value={currentProject.type}>{currentProject.type}</option>
                  )}
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hình ảnh dự án</label>
                <div className="space-y-4">
                  <div 
                    className="flex flex-col sm:flex-row items-center gap-4 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={handleImageDrop}
                  >
                    <label className="flex-shrink-0 cursor-pointer">
                      <span className="px-4 py-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-md text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors inline-block">
                        {loading ? 'Đang tải...' : 'Chọn ảnh hoặc Kéo thả vào đây'}
                      </span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={loading}
                      />
                    </label>
                    <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">hoặc nhập URL:</span>
                    <div className="flex w-full gap-2">
                      <input
                        type="text"
                        id="imageUrlInput"
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
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('imageUrlInput') as HTMLInputElement;
                          const url = input?.value.trim();
                          if (url) {
                            setCurrentProject(prev => ({ ...prev, images: [...(prev.images || []), url] }));
                            if (input) input.value = '';
                          }
                        }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium whitespace-nowrap"
                      >
                        Thêm URL
                      </button>
                    </div>
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
            </>
          )}

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

              {showBasicInfo && (
                <>
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
                </>
              )}
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
              <th scope="col" className="w-10 px-6 py-3">
                <span className="sr-only">Kéo thả</span>
              </th>
              <th scope="col" className="w-24 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Thứ tự
              </th>
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
            {projects.map((project, index) => (
              <tr 
                key={project.id}
                draggable
                onDragStart={(e) => handleDragStartRow(e, project.id)}
                onDragOver={handleDragOverRow}
                onDrop={(e) => handleDropRow(e, project.id)}
                className={`${draggedProjectId === project.id ? 'opacity-50 bg-gray-50 dark:bg-gray-700/50' : ''} hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}
              >
                <td className="px-6 py-4 whitespace-nowrap cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <GripVertical className="w-5 h-5" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <OrderInput 
                    index={index} 
                    projectId={project.id} 
                    onReorder={handleManualReorder} 
                    max={projects.length} 
                  />
                </td>
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
                  {!project.hideArea && (
                    <>
                      <br />
                      <span className="text-xs">{String(project.area).match(/m2|m²|ha/i) ? project.area : `${project.area} m²`}</span>
                    </>
                  )}
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Xác nhận xóa</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Bạn có chắc chắn muốn xóa dự án này? Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
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
    </div>
  );
}
