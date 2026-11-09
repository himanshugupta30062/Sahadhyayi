export const SAHADHYAYI_PHONE = '+91 8920785645';
export const SAHADHYAYI_PHONE_RAW = '918920785645';
export const SAHADHYAYI_EMAIL = 'gyan@sahadhyayi.com';

export const SUPPORT_TOPICS = [
  { id: 'books', label: 'Book & PDF Help', message: 'Namaste! I need help finding a book or PDF in the Sahadhyayi library.' },
  { id: 'author', label: 'Author Publishing', message: 'Namaste! I have questions about submitting an article or publishing on Sahadhyayi.' },
  { id: 'groups', label: 'Reading Groups', message: 'Namaste! I would like guidance on creating or joining a Reading Group.' },
  { id: 'general', label: 'General Helpline', message: 'Namaste Sahadhyayi Support! I would like to speak with an advisor.' },
];

export const openSahadhyayiWhatsApp = (customMessage?: string) => {
  const defaultMsg = 'Namaste Sahadhyayi! I would like some assistance with the platform.';
  const message = customMessage || defaultMsg;
  const url = `https://wa.me/${SAHADHYAYI_PHONE_RAW}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

