import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useStore } from '../../store/useStore';
import { Building2, Users, Globe } from 'lucide-react';

export default function AdminDashboard() {
  const { user, settings, languages } = useStore();
  const [stats, setStats] = useState({ projects: 0, users: 0, languages: languages.length });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const projectsSnap = await getDocs(collection(db, 'projects'));
        const usersSnap = await getDocs(collection(db, 'users'));
        setStats({
          projects: projectsSnap.size,
          users: usersSnap.size,
          languages: languages.length,
        });
      } catch (error) {
        console.error('Error fetching stats', error);
      }
    };

    fetchStats();
  }, [languages.length]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
        Tổng quan
      </h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Projects Stat */}
        <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 py-5 shadow sm:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-md bg-indigo-500 p-3">
              <Building2 className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Tổng số dự án</dt>
                <dd>
                  <div className="text-lg font-medium text-gray-900 dark:text-white">{stats.projects}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>

        {/* Users Stat */}
        {user?.role === 'root' && (
          <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 py-5 shadow sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-green-500 p-3">
                <Users className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Tài khoản quản trị</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">{stats.users}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        )}

        {/* Languages Stat */}
        {user?.role === 'root' && (
          <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 py-5 shadow sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-yellow-500 p-3">
                <Globe className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">Ngôn ngữ hỗ trợ</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">{stats.languages}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
