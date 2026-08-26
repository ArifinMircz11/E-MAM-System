export const getPlaceholderAvatar = (name: string = 'User'): string => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D9488&color=fff`;
};

export const avatarHelper = {
  getPlaceholderAvatar,
};
