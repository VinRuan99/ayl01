import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useStore } from '../../store/useStore';
import { Trash2, UserPlus } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminUsers() {
  const { user } = useStore();
  const [users, setUsers] = useState<UserData[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<string | null>(null);
  const [messageAlert, setMessageAlert] = useState<{title: string, message: string} | null>(null);

  const fetchUsers = async () => {
    const snap = await getDocs(collection(db, 'users'));
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
    setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    setLoading(true);
    try {
      // Create a dummy ID for the user since they haven't logged in yet
      // When they log in, Firebase Auth will create a real UID.
      // Wait, if we use email as ID or a random ID, when they log in, how do we link them?
      // We can't easily link them if we don't know their UID.
      // Alternatively, we can use their email as the document ID, but Firebase Auth uses UID.
      // Let's use email as the document ID for simplicity, and update our login logic to check by email.
      // Wait, `firestore.rules` uses `request.auth.uid`.
      // Let's just create a document with their email. When they login, if their email exists in a "pending_users" or we just check by email.
      // Actually, since we are using Google Auth, we can use the email as the document ID.
      // Let's change the `users` collection to use `email` as the document ID.
      
      const emailId = newEmail.toLowerCase();
      await setDoc(doc(db, 'users', emailId), {
        email: emailId,
        role: 'sub-admin',
        createdAt: new Date().toISOString()
      });
      setNewEmail('');
      fetchUsers();
      setMessageAlert({ title: 'Thành công', message: 'Thêm tài khoản thành công!' });
    } catch (error) {
      console.error('Error adding user', error);
      setMessageAlert({ title: 'Lỗi', message: 'Thêm thất bại.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string, role: string) => {
    if (role === 'root') {
      setMessageAlert({ title: 'Cảnh báo', message: 'Không thể xóa tài khoản Root!' });
      return;
    }
    setDeleteConfirmUser(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmUser) {
      try {
        await deleteDoc(doc(db, 'users', deleteConfirmUser));
        fetchUsers();
        setDeleteConfirmUser(null);
      } catch (error) {
        console.error('Error deleting user', error);
        setMessageAlert({ title: 'Lỗi', message: 'Xóa thất bại.' });
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Tài khoản</h2>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Thêm Sub-Admin mới</h3>
        <form onSubmit={handleAddUser} className="flex gap-4">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Nhập email tài khoản..."
            required
            className="flex-1 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white px-3 py-2 border"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            {loading ? 'Đang thêm...' : 'Thêm tài khoản'}
          </button>
        </form>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Người dùng sẽ đăng nhập bằng Google với email này để truy cập quyền Sub-Admin.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Vai trò
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ngày tạo
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Hành động</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {u.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'root' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {u.role !== 'root' && (
                    <button
                      onClick={() => handleDelete(u.id, u.role)}
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Xác nhận xóa</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Bạn có chắc chắn muốn xóa tài khoản này? Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmUser(null)}
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
