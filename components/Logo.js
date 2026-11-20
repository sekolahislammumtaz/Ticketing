import { LOGO_DATA_URL } from '@/lib/logo';

export const YAYASAN_LOGO = '/munazarah.png';

export const DIVISION_LOGOS = {
  'TK Islam Nazhirah': '/Logo TK.png',
  'SD Islam Nazhirah': '/Logo SD.png',
  'SMP & SMA Islam Nazhirah': '/nazhirah.png',
  'Sekolah Islam Mumtaz': '/mumtaz.png',
};

export function DivisionLogo({
  division,
  className = 'w-10 h-10 object-contain',
  alt,
  fallback = null,
}) {
  const logoPath = division ? DIVISION_LOGOS[division] : null;
  if (!logoPath) return fallback;

  return (
    <img
      src={encodeURI(logoPath)}
      alt={alt || `Logo ${division}`}
      className={className}
      loading="lazy"
    />
  );
}

export default function AppLogo({
  className = 'w-10 h-10 object-contain drop-shadow',
  alt = 'Logo Yayasan Munazarah',
}) {
  return (
    <img
      src={encodeURI(YAYASAN_LOGO)}
      alt={alt}
      onError={(e) => {
        e.currentTarget.src = LOGO_DATA_URL;
      }}
      className={className}
    />
  );
}

export { LOGO_DATA_URL };
