import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Building2, Briefcase, ShieldCheck } from 'lucide-react';
import { ContentBlock } from '../types';

interface Project {
  id: string;
  title: Record<string, string>;
  description: Record<string, ContentBlock[]>;
  location: Record<string, string>;
  price: number;
  area: number;
  type: string;
  images: string[];
  createdAt: string;
  createdBy: string;
  order?: number;
}

export default function Home() {
  const { settings, currentLanguage } = useStore();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
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
    fetchProjects();
  }, []);

  const getLocalizedText = (obj: Record<string, string> | undefined, fallback: string = '') => {
    if (!obj) return fallback;
    return obj[currentLanguage] || obj['vi'] || fallback;
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="relative bg-gray-900 h-[700px]">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover opacity-60"
            src={settings?.heroImages?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80'}
            alt="Hero Background"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center items-center text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-7xl mb-6 drop-shadow-lg">
            {getLocalizedText(settings?.heroTitle, 'Kiến tạo giá trị bền vững')}
          </h1>
          <p className="mt-4 text-xl text-gray-200 max-w-3xl drop-shadow-md">
            {getLocalizedText(settings?.heroSubtitle, 'Chúng tôi là nhà phát triển bất động sản hàng đầu, mang đến những dự án đẳng cấp và không gian sống hoàn mỹ.')}
          </p>
          <div className="mt-10 flex gap-4">
            <a href="#portfolio" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-indigo-500/30">
              {currentLanguage === 'vi' ? 'Khám phá Dự án' : 'Discover Projects'}
            </a>
            <a href={`tel:${settings?.hotline}`} className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 px-8 py-4 rounded-full font-semibold text-lg transition-all">
              {currentLanguage === 'vi' ? 'Liên hệ ngay' : 'Contact Us'}
            </a>
          </div>
        </div>
      </div>

      {/* About Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl mb-6">
                {getLocalizedText(settings?.aboutTitle, 'Về Ayaland')}
              </h2>
              <div className="w-20 h-1 bg-indigo-600 mb-8"></div>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {getLocalizedText(settings?.aboutDescription, 'Với hơn 10 năm kinh nghiệm, Ayaland tự hào là đơn vị tiên phong trong lĩnh vực phát triển và quản lý bất động sản cao cấp. Chúng tôi cam kết mang lại những giá trị vượt trội cho khách hàng và đối tác.')}
              </p>
              <div className="mt-10 grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">10+</h4>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">{currentLanguage === 'vi' ? 'Năm kinh nghiệm' : 'Years Experience'}</p>
                </div>
                <div>
                  <h4 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">{projects.length}+</h4>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">{currentLanguage === 'vi' ? 'Dự án hoàn thành' : 'Completed Projects'}</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
                <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80" alt="Corporate Building" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{currentLanguage === 'vi' ? 'Uy tín hàng đầu' : 'Top Reputation'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{currentLanguage === 'vi' ? 'Cam kết chất lượng' : 'Quality Commitment'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl mb-4">
              {currentLanguage === 'vi' ? 'Lĩnh vực hoạt động' : 'Our Expertise'}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {currentLanguage === 'vi' ? 'Cung cấp các giải pháp toàn diện trong lĩnh vực bất động sản, từ phát triển dự án đến quản lý vận hành.' : 'Providing comprehensive real estate solutions, from project development to operational management.'}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Building2,
                title: currentLanguage === 'vi' ? 'Phát triển dự án' : 'Project Development',
                desc: currentLanguage === 'vi' ? 'Kiến tạo những công trình biểu tượng, mang lại không gian sống và làm việc đẳng cấp.' : 'Creating iconic buildings, providing world-class living and working spaces.'
              },
              {
                icon: Briefcase,
                title: currentLanguage === 'vi' ? 'Tư vấn đầu tư' : 'Investment Consulting',
                desc: currentLanguage === 'vi' ? 'Đội ngũ chuyên gia giàu kinh nghiệm giúp tối ưu hóa lợi nhuận cho các nhà đầu tư.' : 'Experienced experts helping optimize returns for investors.'
              },
              {
                icon: ShieldCheck,
                title: currentLanguage === 'vi' ? 'Quản lý vận hành' : 'Property Management',
                desc: currentLanguage === 'vi' ? 'Cung cấp dịch vụ quản lý chuyên nghiệp, đảm bảo tài sản luôn duy trì giá trị cao nhất.' : 'Providing professional management services, ensuring assets maintain highest value.'
              }
            ].map((service, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-6">
                  <service.icon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{service.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl mb-4">
                {currentLanguage === 'vi' ? 'Dự án tiêu biểu' : 'Featured Portfolio'}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
                {currentLanguage === 'vi' ? 'Khám phá những dấu ấn kiến trúc và các dự án trọng điểm do Ayaland phát triển.' : 'Explore the architectural landmarks and key projects developed by Ayaland.'}
              </p>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {currentLanguage === 'vi' ? 'Đang cập nhật dự án.' : 'Projects are being updated.'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {projects.slice(0, 3).map((project) => (
                  <Link key={project.id} to={`/projects/${project.id}`} className="group block">
                    <div className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-[4/3]">
                      <img
                        src={project.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80'}
                        alt={getLocalizedText(project.title)}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent opacity-80"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider rounded-full">
                            {project.type}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                          {getLocalizedText(project.title)}
                        </h3>
                        <div className="flex items-center text-gray-300 text-sm">
                          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span className="line-clamp-1">{getLocalizedText(project.location)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {projects.length > 3 && (
                <div className="mt-12 text-center">
                  <Link
                    to="/projects"
                    className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-full text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:text-indigo-300 dark:bg-indigo-900/50 dark:hover:bg-indigo-900/80 transition-colors"
                  >
                    {currentLanguage === 'vi' ? 'Xem thêm tất cả dự án' : 'View all projects'}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
