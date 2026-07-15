import cron from 'node-cron';
import Member from '../models/Member.js';
import User from '../models/User.js';
import { formatDate, addDays } from './dateHelpers.js';
import { sendWhatsAppMessage } from './reminderService.js';

export const checkAndSendReminders = async () => {
  console.log('⏳ Running automated payment reminder scanner...');
  
  const todayStr = formatDate(new Date());
  const sevenDaysBeforeStr = addDays(todayStr, 7);
  const threeDaysOverdueStr = addDays(todayStr, -3);
  const sevenDaysOverdueStr = addDays(todayStr, -7);
  const tenDaysOverdueStr = addDays(todayStr, -10);

  try {
    // Query members whose due date is today, 7 days before, or 3, 7, 10 days overdue
    const members = await Member.find({
      nextDueDate: { $in: [sevenDaysBeforeStr, todayStr, threeDaysOverdueStr, sevenDaysOverdueStr, tenDaysOverdueStr] }
    });

    console.log(`🔍 Found ${members.length} members matching reminder criteria.`);

    for (const member of members) {
      // Fetch gym owner settings dynamically
      const owner = await User.findById(member.ownerId);
      const gymName = owner?.businessName || 'Your Gym';
      const upiId = owner?.settings?.upiId || 'goldsgym@okaxis';
      const qrCode = owner?.settings?.qrCode;

      let messageIntro = '';
      if (member.nextDueDate === sevenDaysBeforeStr) {
        messageIntro = `Hello ${member.name}, this is a heads-up reminder from *${gymName}*. Your subscription fee of *₹${member.amount}* will be due in 7 days, on *${member.nextDueDate}*.`;
      } else if (member.nextDueDate === todayStr) {
        messageIntro = `Hello ${member.name}, this is a friendly reminder from *${gymName}*. Your subscription fee of *₹${member.amount}* is due today on *${member.nextDueDate}*.`;
      } else if (member.nextDueDate === threeDaysOverdueStr) {
        messageIntro = `Hello ${member.name}, this is an urgent reminder from *${gymName}*. Your subscription fee of *₹${member.amount}* is 3 days overdue (due was *${member.nextDueDate}*).`;
      } else if (member.nextDueDate === sevenDaysOverdueStr) {
        messageIntro = `Hello ${member.name}, this is a strong warning from *${gymName}*. Your subscription fee of *₹${member.amount}* is 7 days overdue (due was *${member.nextDueDate}*).`;
      } else if (member.nextDueDate === tenDaysOverdueStr) {
        messageIntro = `Hello ${member.name}, this is a final warning from *${gymName}*. Your subscription fee of *₹${member.amount}* is 10 days overdue (due was *${member.nextDueDate}*).`;
      }

      if (messageIntro) {
        // Build full message template with payment details (matching settings dashboard)
        const fullMessage = `${messageIntro}\n\nPlease pay via UPI using ID: *${upiId}* (QR attached) and *send a screenshot* of the transaction receipt to this chat to confirm your payment.\n\nThank you!`;

        // Implement anti-spam delay of 3 to 5 seconds per message
        const delay = Math.floor(Math.random() * 2000) + 3000;
        console.log(`Waiting ${delay}ms before sending message to ${member.name}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        const success = await sendWhatsAppMessage(member.phoneNumber, fullMessage, qrCode);
        if (success) {
          // Only mark inactive after 10 days overdue (final warning sent)
          if (member.nextDueDate === tenDaysOverdueStr) {
            member.status = 'inactive';
            await member.save();
            console.log(`✅ Member ${member.name} marked inactive after 10 days overdue`);
          }
        }
      }
    }
    console.log('✅ Automated payment reminder scan completed.');
    return members.length;
  } catch (error) {
    console.error('❌ Error running payment reminder scan:', error);
    throw error;
  }
};

export const startScheduler = () => {
  console.log('📅 Starting cron scheduler...');
  
  // Run daily at 8:00 AM
  cron.schedule('0 8 * * *', () => {
    checkAndSendReminders();
  });
  
  console.log('📅 Cron scheduler started! Job scheduled daily at 8:00 AM.');
};
