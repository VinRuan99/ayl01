import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { CheckCircle } from 'lucide-react';

export default function AdminNotification() {
  const { adminNotification, hideAdminNotification, settings } = useStore();

  useEffect(() => {
    if (adminNotification) {
      const duration = settings?.adminNotifications?.duration || 3000;
      const timer = setTimeout(() => {
        hideAdminNotification();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [adminNotification, hideAdminNotification, settings]);

  if (!adminNotification) return null;

  const config = settings?.adminNotifications || {
    create: { message: 'Đã tạo dự án thành công', imageUrl: '' },
    update: { message: 'Đã cập nhật dự án thành công', imageUrl: '' },
    delete: { message: 'Đã xóa dự án thành công', imageUrl: '' },
    reorder: { message: 'Đã chuyển vị trí thành công', imageUrl: '' },
    position: 'bottom-left',
    duration: 3000,
    showImage: false,
    imagePosition: 'left',
    fontBold: false,
    textAlign: 'left',
    textShadow: false,
    textColor: '#ffffff',
    borderRadius: '8px',
    borderWidth: 0,
    borderColor: '#000000',
    backgroundColor: '#22c55e',
  };

  const getPositionClasses = () => {
    switch (config.position) {
      case 'top-left': return 'top-4 left-4 slide-in-from-top-4';
      case 'top-right': return 'top-4 right-4 slide-in-from-top-4';
      case 'bottom-left': return 'bottom-4 left-4 slide-in-from-bottom-4';
      case 'bottom-right': return 'bottom-4 right-4 slide-in-from-bottom-4';
      case 'top-center': return 'top-4 left-1/2 -translate-x-1/2 slide-in-from-top-4';
      case 'bottom-center': return 'bottom-4 left-1/2 -translate-x-1/2 slide-in-from-bottom-4';
      default: return 'bottom-4 left-4 slide-in-from-bottom-4';
    }
  };

  const actionConfig = config[adminNotification.type as keyof typeof config] as any;
  const message = actionConfig?.message || adminNotification.message;
  const globalImageUrl = (config as any).imageUrl || '';
  const imageUrl = typeof actionConfig === 'object' ? (actionConfig?.imageUrl || '') : globalImageUrl;

  const hasImage = config.showImage && imageUrl;

  return (
    <div 
      className={`fixed z-50 animate-in fade-in ${getPositionClasses()} shadow-xl overflow-hidden flex items-center`}
      style={{ 
        backgroundColor: config.backgroundColor || '#22c55e',
        borderRadius: config.borderRadius || '8px',
        borderWidth: `${config.borderWidth || 0}px`,
        borderColor: config.borderColor || '#000000',
        borderStyle: 'solid',
        minWidth: '250px',
        minHeight: '60px',
      }}
    >
      {hasImage && (
        <img 
          src={imageUrl} 
          alt="Notification Mascot" 
          className="absolute top-1/2 -translate-y-1/2 h-[60px] object-contain opacity-50 pointer-events-none"
          style={{
            [config.imagePosition === 'right' ? 'right' : 'left']: 0,
            zIndex: 0
          }}
        />
      )}
      <div 
        className="relative z-10 w-full px-4 py-3 flex items-center gap-2"
        style={{
          color: config.textColor || '#ffffff',
          fontWeight: config.fontBold ? 'bold' : 'normal',
          textAlign: config.textAlign as any || 'left',
          textShadow: config.textShadow ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none',
          justifyContent: config.textAlign === 'center' ? 'center' : config.textAlign === 'right' ? 'flex-end' : 'flex-start'
        }}
      >
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
        <span className="flex-1">{message}</span>
      </div>
    </div>
  );
}
