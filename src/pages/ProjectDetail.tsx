import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { MapPin, Maximize, Building2, ArrowLeft, Phone, Mail, DollarSign } from 'lucide-react';
import { Project, ContentBlock } from '../types';
import BlockRenderer from '../components/BlockRenderer';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentLanguage, settings } = useStore();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'projects', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProject({ id: docSnap.id, ...docSnap.data() } as Project);
        }
      } catch (error) {
        console.error('Error fetching project', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  const getLocalizedText = (obj: Record<string, string> | undefined, fallback: string = '') => {
    if (!obj) return fallback;
    return obj[currentLanguage] || obj['vi'] || fallback;
  };

  const getLocalizedBlocks = (obj: Record<string, string | ContentBlock[]> | undefined): ContentBlock[] | string => {
    if (!obj) return [];
    return obj[currentLanguage] || obj['vi'] || [];
  };

  const formatPrice = (price: number) => {
    if (!price) return '0 VNĐ';
    if (price >= 1000000000) {
      return `${(price / 1000000000).toFixed(1)} Tỷ`;
    }
    return `${(price / 1000000).toFixed(0)} Triệu`;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Dự án không tồn tại</h2>
        <Link to="/" className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen pb-24">
      {/* Hero Image Header */}
      <div className="relative h-[50vh] min-h-[400px] w-full bg-gray-900">
        <img
          src={project.images?.[activeImage] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80'}
          alt={getLocalizedText(project.title)}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <Link to="/#portfolio" className="inline-flex items-center text-gray-300 hover:text-white mb-6 transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              {currentLanguage === 'vi' ? 'Quay lại danh sách' : 'Back to portfolio'}
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-indigo-600 text-white">
                {project.type}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-4 drop-shadow-lg">
              {getLocalizedText(project.title)}
            </h1>
            <div className="flex items-center text-gray-300 text-lg">
              <MapPin className="w-5 h-5 mr-2" />
              {getLocalizedText(project.location)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            <div className="prose prose-lg prose-indigo dark:prose-invert max-w-none">
              <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                {currentLanguage === 'vi' ? 'Tổng quan dự án' : 'Project Overview'}
              </h3>
              <BlockRenderer blocks={getLocalizedBlocks(project.description)} />
            </div>

            {/* Image Gallery */}
            {project.images && project.images.length > 1 && (
              <div>
                <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                  {currentLanguage === 'vi' ? 'Thư viện hình ảnh' : 'Gallery'}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {project.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`relative rounded-xl overflow-hidden aspect-[4/3] ${activeImage === idx ? 'ring-2 ring-indigo-600 ring-offset-2 dark:ring-offset-gray-900' : 'opacity-80 hover:opacity-100 transition-opacity'}`}
                    >
                      <img src={img || undefined} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 sticky top-24 border border-gray-100 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                {currentLanguage === 'vi' ? 'Thông tin chi tiết' : 'Project Details'}
              </h3>
              
              <div className="space-y-6 mb-8">
                {!project.hideArea && (
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                      <Maximize className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{currentLanguage === 'vi' ? 'Quy mô diện tích' : 'Total Area'}</p>
                      <p className="font-semibold text-gray-900 dark:text-white text-lg">
                        {String(project.area).match(/m2|m²|ha/i) ? project.area : `${project.area} m²`}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                    <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{currentLanguage === 'vi' ? 'Loại hình phát triển' : 'Property Type'}</p>
                    <p className="font-semibold text-gray-900 dark:text-white text-lg">{project.type}</p>
                  </div>
                </div>

                {project.price > 0 && (
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                      <DollarSign className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{currentLanguage === 'vi' ? 'Quy mô đầu tư' : 'Investment Scale'}</p>
                      <p className="font-semibold text-gray-900 dark:text-white text-lg">{formatPrice(project.price)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  {currentLanguage === 'vi' ? 'Liên hệ hợp tác' : 'Contact for Partnership'}
                </h4>
                <div className="space-y-4">
                  <a
                    href={`tel:${settings?.hotline}`}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
                  >
                    <Phone className="w-5 h-5" />
                    {settings?.hotline}
                  </a>
                  <a
                    href={`https://zalo.me/${settings?.zalo}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    {currentLanguage === 'vi' ? 'Gửi tin nhắn' : 'Send Message'}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
