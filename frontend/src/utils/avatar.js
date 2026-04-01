import { STATIC_BASE } from './api';

export const PRESETS = {
  default: '🤖',
  hacker1: '💀',
  hacker2: '🐱',
  hacker3: '👾',
  hacker4: '🕵️',
  hacker5: '🦊',
  hacker6: '🐉',
};

export const getAvatarDisplay = (user) => {
  // if (user?.avatar_type === 'upload' && user?.avatar_url) {
  //   return {
  //     type: 'img',
  //     src: `${STATIC_BASE}${user.avatar_url}`,
  //   };
  // }
  if (user?.avatar_type === 'preset' && user?.avatar_preset) {
    return {
      type: 'emoji',
      emoji: PRESETS[user.avatar_preset] || '🤖',
    };
  }
  return { type: 'emoji', emoji: '🤖' };
};