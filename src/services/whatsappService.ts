export const sendWhatsAppMessage = async (target: string, message: string) => {
  try {
    const response = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ target, message }),
    });

    if (!response.ok) {
      throw new Error('Gagal mengirim pesan WhatsApp');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending WhatsApp:', error);
    throw error;
  }
};

/**
 * Automates sending registration links to students or teachers
 */
export const sendRegistrationLink = async (
  target: string,
  name: string,
  idUnik: string,
  role: 'student' | 'teacher' = 'student',
) => {
  const appUrl = window.location.origin;
  const registrationLink = `${appUrl}/?idUnik=${idUnik}&role=${role}`;

  const message = `Halo ${name},\n\nAnda telah terdaftar di database e-Mam System. Silakan buat akun anda untuk mengakses dashboard madrasah melalui link pendaftaran berikut:\n\n${registrationLink}\n\nTerima kasih.`;

  return sendWhatsAppMessage(target, message);
};
