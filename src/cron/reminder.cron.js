const cron = require('node-cron');
const moment = require('moment');
const Invitation = require('../models/invitation.model');
const { sendInvitationEmailToGuest } = require('../services/invitation.service');

// Chạy job vào lúc 08:00 sáng mỗi ngày
cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Bắt đầu chạy tiến trình quét email nhắc nhở...');
    try {
        const today = moment().startOf('day');

        // Tìm tất cả thiệp mời có eventDate và mảng emailReminders không rỗng
        const invitations = await Invitation.find({
            'settings.eventDate': { $exists: true, $ne: null },
            'settings.emailReminders': { $exists: true, $not: { $size: 0 } }
        });

        let emailsSentCount = 0;

        for (const invitation of invitations) {
            const eventDate = moment(invitation.settings.eventDate).startOf('day');
            
            // Tính số ngày còn lại đến sự kiện
            const daysUntilEvent = eventDate.diff(today, 'days');

            // Kiểm tra xem có cấu hình nhắc nhở nào khớp với số ngày hiện tại và đang bật không
            const matchingReminder = invitation.settings.emailReminders.find(
                reminder => reminder.daysBefore === daysUntilEvent && reminder.isEnabled
            );

            if (matchingReminder) {
                // Lọc ra những khách mời chưa từ chối (hoặc chỉ những người 'pending')
                const guestsToRemind = invitation.guests.filter(
                    guest => guest.status !== 'declined' && guest.email
                );

                for (const guest of guestsToRemind) {
                    try {
                        // Gọi hàm gửi email có sẵn trong service của bạn
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