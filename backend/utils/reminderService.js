import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from 'qrcode-terminal';

let client = null;
let isReady = false;

// Initialize WhatsApp Web Client
export const initWhatsApp = () => {
  console.log('🚀 Initializing WhatsApp Web Client...');

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-canvas-path-rendering',
        '--disable-web-security',
        '--disable-extensions',
        '--disable-speech-api',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-domain-reliability',
        '--disable-features=AudioServiceOutOfProcess',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-notifications',
        '--disable-offer-store-unmasked-wallet-cards',
        '--disable-popup-blocking',
        '--disable-print-preview',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--disable-sync',
        '--hide-scrollbars',
        '--ignore-gpu-blacklist',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-experiments',
        '--no-pings',
        '--password-store=basic',
        '--use-gl=swiftshader',
        '--use-mock-keychain',
        '--js-flags=--max-old-space-size=120'
      ]
    }

  });

  client.on('qr', (qr) => {
    console.log('\n======================================================');
    console.log('👇 SCAN THIS QR CODE WITH YOUR WHATSAPP APP 👇');
    console.log('Go to WhatsApp > Linked Devices > Link a Device');
    console.log('======================================================\n');
    qrcode.generate(qr, { small: true });
    console.log('\n======================================================\n');
  });

  client.on('ready', () => {
    console.log('🚀 WhatsApp Client is Ready and Authenticated!');
    isReady = true;
  });

  client.on('auth_failure', (msg) => {
    console.error('❌ WhatsApp Auth failure:', msg);
  });

  client.on('disconnected', (reason) => {
    console.log('❌ WhatsApp was disconnected:', reason);
    isReady = false;
    // Attempt re-initialization
    setTimeout(() => {
      console.log('🔄 Attempting to re-initialize WhatsApp client...');
      initWhatsApp();
    }, 10000);
  });

  try {
    client.initialize();
  } catch (err) {
    console.error('❌ Error initializing whatsapp-web.js:', err);
  }
};

// Send message to a phone number (optionally with a base64 QR Code image attachment)
export const sendWhatsAppMessage = async (phoneNumber, message, qrCodeBase64) => {
  if (!isReady || !client) {
    console.warn(`⚠️ WhatsApp client is not ready. Skip sending message to ${phoneNumber}`);
    return false;
  }

  try {
    // Sanitize phone number to keep only digits
    let sanitized = phoneNumber.replace(/\D/g, '');

    // Default country code to India (91) if it's a 10 digit number
    if (sanitized.length === 10) {
      sanitized = '91' + sanitized;
    }

    const chatId = `${sanitized}@c.us`;

    if (qrCodeBase64) {
      // Parse data URI (e.g. data:image/png;base64,iVBORw0KGgo...)
      const matches = qrCodeBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-+.]+);base64,(.+)$/);
      let media;
      if (matches) {
        media = new MessageMedia(matches[1], matches[2], 'upi_qr.jpg');
      } else {
        media = new MessageMedia('image/jpeg', qrCodeBase64, 'upi_qr.jpg');
      }

      // Send image with caption text
      await client.sendMessage(chatId, media, { caption: message });
    } else {
      // Send plain text message
      await client.sendMessage(chatId, message);
    }

    console.log(`✅ WhatsApp message sent to ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send WhatsApp message to ${phoneNumber}:`, error);
    return false;
  }
};

// Get the readiness state of the WhatsApp client
export const getWhatsAppStatus = () => {
  return isReady;
};
