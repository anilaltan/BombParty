export const AVATAR_PRESETS = [
  { id: '1', seed: 'Aysenur',    bgColor: '#FFD600' },
  { id: '2', seed: 'Mehmetcan',  bgColor: '#FF5C1A' },
  { id: '3', seed: 'Zeynepberk', bgColor: '#ffb98a' },
  { id: '4', seed: 'Cengiz',     bgColor: '#6ed5cf' },
  { id: '5', seed: 'Elif88',     bgColor: '#c7c0ff' },
  { id: '6', seed: 'Ibrahim',    bgColor: '#9be3b6' },
  { id: '7', seed: 'Selen22',    bgColor: '#ff8a8a' },
  { id: '8', seed: 'Bora',       bgColor: '#363A5C' },
];

export function getAvatarPreset(avatarId: string | undefined) {
  return AVATAR_PRESETS.find(a => a.id === avatarId) ?? AVATAR_PRESETS[0];
}

// Keep for any callers not yet migrated
export const AVATAR_OPTIONS = AVATAR_PRESETS;
export function getAvatarEmoji(_avatarId: string | undefined): string { return ''; }
