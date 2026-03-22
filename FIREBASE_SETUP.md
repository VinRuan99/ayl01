# 🔥 Firebase Configuration Guide

## Vấn đề hiện tại
Lỗi "Đăng nhập thất bại" thường do Firebase Console chưa được cấu hình đúng.

## ✅ Các bước cấu hình Firebase Console

### 1. **Thiết lập Google Sign-In**
   - Vào [Firebase Console](https://console.firebase.google.com/)
   - Chọn project: `gen-lang-client-0457546637`
   - Đi đến **Authentication** > **Sign-in method**
   - Bật **Google** provider
   - Điền **Support email** (tài khoản email hỗ trợ)

### 2. **Cấu hình Authorized Redirect URIs**
   - Đi đến **Authentication** > **Settings** > **Authorized domains**
   - Thêm các domain sau:
     ```
     localhost:3000
     localhost:3001
     localhost:3002
     localhost:3003
     localhost:3004
     localhost:3005
     192.168.1.138
     ```

### 3. **Cấu hình Firestore**
   - Đi đến **Firestore Database**
   - Tạo các collections:
     - `settings` → document `general`
     - `languages`
     - `users`
     - `projects`
     - `fonts`

### 4. **Cấu hình Storage Rules**
   - Đi đến **Storage** > **Rules**
   - Đảm bảo quy tắc cho phép upload ảnh

### 5. **Kiểm tra API Keys**
   - API Key: `AIzaSyCkMvPoJ0PYWZYpdmDqoFUJj3j2BU_RPyA` ✅

## 🔍 Debug Steps

Mở **Developer Console** (F12) và kiểm tra:
1. Firebase initialization logs (🔥 Initializing Firebase...)
2. Google Sign-in attempt (🔐 Attempting Google Sign-in...)
3. Xem lỗi cụ thể dưới tab **Console**

## 📝 Lỗi phổ biến

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-----------|--------|
| `auth/operation-not-supported-in-this-environment` | Popup bị block | Kiểm tra browser allow popups |
| `auth/configuration-not-found` | Google Sign-in chưa enable | Enable ở Firebase Console |
| `auth/unauthorized-domain` | Domain chưa được thêm | Thêm domain vào Authorized domains |
| `auth/app-not-initialized` | Firebase không khởi tạo đúng | Kiểm tra firebase-applet-config.json |

## 🚀 Test Login

```bash
npm run dev
# Vào http://localhost:3002
# Nhấp "Đăng nhập với Google"
# Mở F12 xem console logs
```
