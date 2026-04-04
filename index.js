require('dotenv').config();

const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./src/middleware/errorHandler');
const routes = require('./src/routes');
const passport = require('passport');
const session = require('express-session');
// --- 1. THÊM CÁC THƯ VIỆN CẦN THIẾT CHO SEO ---
const path = require('path');
const fs = require('fs');
const Invitation = require('./src/models/invitation.model'); // Đảm bảo đường dẫn đúng tới Model Invitation

const cron = require('node-cron');
const moment = require('moment');
const { sendInvitationEmailToGuest } = require('./src/services/invitation.service');
// ----------------------------------------------

require('./src/config/passport');
dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: ['https://icards.com.vn', 'https://www.icards.com.vn', 'https://admin.icards.com.vn', 'https://www.admin.icards.com.vn', 'https://icards.vercel.app', 'https://icards-dashboard.vercel.app'], 
  credentials: true, 
};

app.use(session({
  secret: process.env.SESSION_SECRET, 
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

app.use(express.static('public')); // Phục vụ file tĩnh
// --- CẤU HÌNH ĐƯỜNG DẪN TỚI FILE INDEX.HTML ĐÃ BUILD ---
// Giả định file index.js nằm cùng cấp với thư mục public
const indexPath = path.resolve(__dirname, 'public', 'index.html');

// ============================================================
// LOGIC SEO: REPLACE PLACEHOLDERS
// ============================================================
app.get('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Kiểm tra ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('SEO: Invalid ID, serving default');
      return serveDefaultHtml(res);
    }

    // 2. Lấy dữ liệu thiệp
    const invitation = await Invitation.findById(id);
    
    // 3. Chuẩn bị dữ liệu Meta
    const title = invitation?.settings?.title || 'Thiệp Mời Online - iCards.com.vn';
    const description = invitation?.settings?.description || 'Trân trọng kính mời bạn đến tham dự sự kiện đặc biệt này.';
    const image = invitation?.imgSrc 
                  || invitation?.settings?.heroImages?.main 
                  || 'https://imagedelivery.net/mYCNH6-2h27PJijuhYd-fw/32c7501a-ed3b-4466-876b-48bcfb13d600/public';
    const url = `https://icards.com.vn/events/${id}`;

    // 4. Đọc và thay thế nội dung
    fs.readFile(indexPath, 'utf8', (err, htmlData) => {
      if (err) {
        console.error('Lỗi đọc index.html:', err);
        return res.status(500).send('Server Error');
      }

      // Thay thế các Placeholder bằng dữ liệu thật
      // Sử dụng replaceAll để thay thế tất cả vị trí xuất hiện
      const injectedHtml = htmlData
        .replaceAll('__META_TITLE__', title)
        .replaceAll('__META_DESCRIPTION__', description)
        .replaceAll('__META_IMAGE__', image)
        .replaceAll('__META_URL__', url);

      console.log(`SEO Success: ${id} - Image: ${image}`);
      res.send(injectedHtml);
    });

  } catch (error) {
    console.error("SEO Error:", error);
    serveDefaultHtml(res);
  }
});

// Hàm phụ trợ để trả về HTML gốc (chưa thay thế hoặc thay bằng default)
const serveDefaultHtml = (res) => {
  fs.readFile(indexPath, 'utf8', (err, htmlData) => {
    if (err) return res.status(500).send("Error loading page");
    
    // Nếu lỗi, thay placeholder bằng thông tin mặc định của web
    const defaultHtml = htmlData
      .replaceAll('__META_TITLE__', 'iCards.com.vn')
      .replaceAll('__META_DESCRIPTION__', 'Nền tảng tạo thiệp mời online.')
      .replaceAll('__META_IMAGE__', 'https://imagedelivery.net/mYCNH6-2h27PJijuhYd-fw/32c7501a-ed3b-4466-876b-48bcfb13d600/public')
      .replaceAll('__META_URL__', 'https://icards.com.vn');
      
    res.send(defaultHtml);
  });
};
// ============================================================

app.use('/api', routes);
app.use(errorHandler);

// --- 3. LOGIC CATCH-ALL CHO REACT ROUTER (ĐẶT CUỐI CÙNG) ---
// Để khi F5 trang con không bị lỗi 404
app.get(/(.*)/, (req, res) => {
    serveDefaultHtml(res);
});
cron.schedule('0 8 * * *', async () => { // Chạy vào 08:00 sáng mỗi ngày
  console.log('[CRON] Bắt đầu chạy tiến trình quét email nhắc nhở...');
  try {
      const today = moment().startOf('day');

      // Tìm thiệp mời có eventDate và có cấu hình emailReminders
      const invitations = await Invitation.find({
          'settings.eventDate': { $exists: true, $ne: null },
          'settings.emailReminders': { $exists: true, $not: { $size: 0 } }
      });

      let emailsSentCount = 0;

      for (const invitation of invitations) {
          const eventDate = moment(invitation.settings.eventDate).startOf('day');
          
          // Tính số ngày còn lại đến sự kiện
          const daysUntilEvent = eventDate.diff(today, 'days');

          // Tìm cấu hình nhắc nhở khớp với số ngày và đang bật (isEnabled: true)
          const matchingReminder = invitation.settings.emailReminders.find(
              reminder => reminder.daysBefore === daysUntilEvent && reminder.isEnabled
          );

          if (matchingReminder) {
              // Lọc ra khách mời chưa từ chối và có email
              const guestsToRemind = invitation.guests.filter(
                  guest => guest.status !== 'declined' && guest.email
              );

              for (const guest of guestsToRemind) {
                  try {
                      // Tận dụng hàm sendInvitationEmailToGuest đã có trong service
                      await sendInvitationEmailToGuest(invitation._id, guest._id, invitation.user);
                      emailsSentCount++;
                  } catch (err) {
                      console.error(`[CRON] Lỗi gửi email cho guest ${guest.email}:`, err.message);
                  }
              }
          }
      }
      console.log(`[CRON] Hoàn thành. Đã gửi ${emailsSentCount} email nhắc nhở.`);
  } catch (error) {
      console.error('[CRON] Lỗi tiến trình quét email:', error);
  }
});
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connect Db success!")
  })
  .catch((err) => {
    console.log(err)
  })

app.listen(port, () => {
  console.log("Server is running in port: " + port);
});
