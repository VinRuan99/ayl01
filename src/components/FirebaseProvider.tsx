import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useStore, Settings, Language, AppUser } from '../store/useStore';

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setUser, setSettings, setLanguages, setAuthReady } = useStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user role
        const userDocRef = doc(db, 'users', firebaseUser.email!);
        let userDoc = await getDoc(userDocRef);
        
        // Auto-bootstrap root admin if it's the specified email
        if (!userDoc.exists() && firebaseUser.email === 'vin.oit99@gmail.com') {
          await setDoc(userDocRef, {
            email: firebaseUser.email,
            role: 'root',
            createdAt: new Date().toISOString()
          });
          userDoc = await getDoc(userDocRef);
        }

        const role = userDoc.exists() ? userDoc.data().role : null;
        const appUser: AppUser = Object.assign(firebaseUser, { role });
        setUser(appUser);
      } else {
        setUser(null);
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, [setUser, setAuthReady]);

  useEffect(() => {
    // Listen to global settings
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Settings;
        setSettings(data);
        // Update document title and favicon dynamically
        document.title = data.title || data.brandName || 'Ayaland';
        if (data.favicon) {
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = data.favicon;
        }
      } else {
        // Set default settings if none exist
        const defaultSettings: Settings = {
          brandName: 'Ayaland',
          hotline: '0911 223 344',
          zalo: '0911 223 344',
          title: 'Ayaland - Nhà phát triển Bất động sản',
          favicon: '',
          logo: '',
          heroTitle: { vi: 'Kiến tạo giá trị bền vững' },
          heroSubtitle: { vi: 'Chúng tôi là nhà phát triển bất động sản hàng đầu, mang đến những dự án đẳng cấp và không gian sống hoàn mỹ.' },
          heroImages: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80'],
          aboutTitle: { vi: 'Về Ayaland' },
          aboutDescription: { vi: 'Với hơn 10 năm kinh nghiệm, Ayaland tự hào là đơn vị tiên phong trong lĩnh vực phát triển và quản lý bất động sản cao cấp. Chúng tôi cam kết mang lại những giá trị vượt trội cho khách hàng và đối tác.' }
        };
        setSettings(defaultSettings);
      }
    }, (error) => {
      console.error("Error fetching settings:", error);
    });

    // Listen to languages
    const unsubscribeLanguages = onSnapshot(collection(db, 'languages'), (snapshot) => {
      const langs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Language));
      if (langs.length === 0) {
        // Default language
        setLanguages([{ id: 'default', code: 'vi', name: 'Tiếng Việt', isDefault: true }]);
      } else {
        setLanguages(langs);
      }
    }, (error) => {
      console.error("Error fetching languages:", error);
    });

    return () => {
      unsubscribeSettings();
      unsubscribeLanguages();
    };
  }, [setSettings, setLanguages]);

  return <>{children}</>;
};
