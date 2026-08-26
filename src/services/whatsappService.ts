export const sendWhatsAppMessage = async (phone: string, message: string): Promise<boolean> => {
  return true;
};

export const sendRegistrationLink = async (phone: string, link: string): Promise<boolean> => {
  return true;
};

export const whatsappService = {
  sendWhatsAppMessage,
  sendRegistrationLink,
};
