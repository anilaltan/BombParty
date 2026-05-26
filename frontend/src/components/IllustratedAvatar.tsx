interface Props {
  seed: string;
  bgColor: string;
  size?: number;
}

export function IllustratedAvatar({ seed, bgColor, size = 44 }: Props) {
  const url = `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `${bgColor} url("${url}") center 6% / 110% no-repeat`,
        flexShrink: 0,
      }}
    />
  );
}
