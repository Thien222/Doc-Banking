DocBanking

Ứng dụng quản lý hồ sơ, chat nội bộ, dashboard tài chính. Frontend React (CRA) + Backend Express + MongoDB + Socket.IO + Firebase Email Link Auth.

1) Yêu cầu môi trường
- Node.js 18+
- MongoDB 6+
- PM2 (production)
- Nginx (reverse proxy, production)

2) Cấu trúc
- client: React app (Create React App)
- server: Express API, Socket.IO, Firebase Admin

3) Cài đặt
```
# Tại thư mục gốc
cd client && npm i
cd ../server && npm i
```

4) Biến môi trường (server/.env)
```
# Mongo
MONGODB_URI=mongodb://127.0.0.1:27017/hoso_db

# JWT
JWT_SECRET=change_me
SESSION_SECRET=change_me

# Firebase Admin SDK (khuyên dùng biến env)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Mail (tùy chọn)
SENDGRID_API_KEY=your_key
MAIL_FROM="DocBanking <no-reply@yourdomain.com>"

# CORS
NODE_ENV=production
```

5) Firebase (client)
- Firebase Console → Authentication → enable Email link (passwordless)
- Authorized domains: localhost, domain/IP production
- Lấy Web config và cập nhật `client/src/utils/firebase.js`

6) Chạy dev
```
# Terminal 1
cd server
npm start

# Terminal 2
cd client
npm start
```
- Server: http://localhost:3001
- Client: http://localhost:3000

7) Build & Deploy (tham khảo)
- Build client: `cd client && npm run build`
- Nginx proxy ví dụ:
```
location /api/ { proxy_pass http://127.0.0.1:3001/; }
location /socket.io/ { proxy_pass http://127.0.0.1:3001/socket.io/; }
try_files $uri /index.html;
```
- PM2 (server): `pm2 start server/bin/www --name docbanking-server`

8) Đăng ký/Đăng nhập
- Đăng ký: Email link (Firebase). Sau khi click link, backend tạo user chờ duyệt (isActive:false, role:null).
- Admin duyệt user tại trang Admin → Pending users.

9) Realtime chat & Notifications
- Socket.IO path `/socket.io`. Client tự join sau đăng nhập.

10) Dashboard tài chính
- Endpoint: `/api/financial/dashboard` (prod) | `/financial/dashboard` (local)
- Header yêu cầu: `user-role: quan-tri-tin-dung`

11) Responsive & Theme
- Responsive utilities: `client/src/styles/responsive.css`
- Global theme: `client/src/styles/theme.css`

12) Sự cố thường gặp
- Firebase quota email-link: chờ reset (≤24h) hoặc dùng project mới/bật billing.
- 404/Unexpected token '<' trên VPS: dùng `/api/financial/*` và alias `app.use('/api/financial', ...)`.


