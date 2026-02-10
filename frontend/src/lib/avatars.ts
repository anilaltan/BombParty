export const AVATAR_OPTIONS = [
  { id: '1', emoji: '😀' },
  { id: '2', emoji: '🎮' },
  { id: '3', emoji: '💣' },
  { id: '4', emoji: '🔥' },
  { id: '5', emoji: '⭐' },
  { id: '6', emoji: '🎯' },
] as const;

export function getAvatarEmoji(avatarId: string | undefined): string {
  if (!avatarId) return '👤';
  const a = AVATAR_OPTIONS.find((x) => x.id === avatarId);
  return a?.emoji ?? '👤';
}
