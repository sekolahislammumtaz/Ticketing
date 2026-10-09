import { LOGO_DATA_URL } from '@/lib/logo';

export default function AppLogo({ className = 'w-10 h-10 object-contain drop-shadow' }) {
  return (
    <img
      src={LOGO_DATA_URL}
      alt="Logo Yayasan Munazarah"
      className={className}
    />
  );
}

export { LOGO_DATA_URL };
