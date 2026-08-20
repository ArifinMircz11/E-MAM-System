import React, { useState } from 'react';
import { useSystemStore } from '@/stores/systemStore';
import { RefreshCw, TableProperties, Database, Terminal, Upload, Palette } from 'lucide-react';

export const RefreshCwIcon = RefreshCw;
export const TablePropertiesIcon = TableProperties;
export const DatabaseIcon = Database;
export const TerminalIcon = Terminal;
export const UploadIcon = Upload;
export const SwatchIcon = Palette;

interface IconProps {
  className?: string;
}

// Fix: Defined HeroIconProps interface and used it with React.FC to properly handle children prop and avoid TS errors in JSX
interface HeroIconProps extends IconProps {
  children: React.ReactNode;
  viewBox?: string;
  fill?: string;
  strokeWidth?: number;
}

/**
 * Helper component for consistent Heroicons structure
 * // Fix: Updated to use React.FC and explicit HeroIconProps to fix children prop typing issues across all icon components
 */
const HeroIcon: React.FC<HeroIconProps> = ({
  className,
  children,
  viewBox = '0 0 24 24',
  fill = 'none',
  strokeWidth = 1.5,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill={fill}
    viewBox={viewBox}
    strokeWidth={strokeWidth}
    stroke="currentColor"
    className={className}
  >
    {children}
  </svg>
);

// Fix: Standard branding and social icons
export const GoogleIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 48 48" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
);

export const AppLogo = ({ className }: IconProps) => {
  const customLogo = useSystemStore((state) => state.madrasahInfo?.logoApp);

  return (
    <img
      src={customLogo || 'https://lh3.googleusercontent.com/d/1RGCXWnp19Y3UJe7cUWy-krY6S2KQmt9K'}
      alt="Logo"
      className={`${className} object-cover rounded-lg`}
      referrerPolicy="no-referrer"
      onError={(e) => {
        // Fallback if the URL doesn't work
        (e.target as HTMLImageElement).src =
          'https://lh3.googleusercontent.com/d/1RGCXWnp19Y3UJe7cUWy-krY6S2KQmt9K';
      }}
    />
  );
};

export const EmamLogo = AppLogo;

// Fix: Navigation and basic UI icons
export const HomeIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
    />
  </HeroIcon>
);

export const HouseIcon = HomeIcon;

export const Bars3CenterLeftIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 6.75h16.5M3.75 12h12m-12 5.25h16.5"
    />
  </HeroIcon>
);

export const ArrowLeftIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </HeroIcon>
);

export const ArrowRightIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </HeroIcon>
);

export const ChevronLeft = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </HeroIcon>
);

export const ChevronLeftIcon = ChevronLeft;

export const ChevronRight = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </HeroIcon>
);

export const ChevronRightIcon = ChevronRight;

export const CpuChipIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.25 9.75v-4.5a2.25 2.25 0 1 0-4.5 0v4.5m4.5 0a2.25 2.25 0 0 1 2.25 2.25m-6.75 0a2.25 2.25 0 0 0-2.25 2.25m13.5-2.25a2.25 2.25 0 0 1-2.25-2.25m0 0a2.25 2.25 0 0 0-2.25-2.25m0 0v-4.5a2.25 2.25 0 1 0-4.5 0v4.5m4.5 0a2.25 2.25 0 0 1 2.25 2.25m-6.75 0a2.25 2.25 0 0 0-2.25 2.25m13.5-2.25a2.25 2.25 0 0 1-2.25-2.25m0 0a2.25 2.25 0 0 0-2.25-2.25m0 0v-4.5a2.25 2.25 0 1 0-4.5 0v4.5m4.5 0a2.25 2.25 0 0 1 2.25 2.25m-6.75 0a2.25 2.25 0 0 0-2.25 2.25M6.75 15.75H21v-4.5H6.75m0 0H3v4.5h3.75m0 0v4.5h10.5v-4.5m-10.5 0H3m14.25 0H21v-4.5h-3.75m0 0v4.5m-3.75 0h3.75m-3.75 0h-3.75m3.75 0V12m0 0h-3.75"
    />
  </HeroIcon>
);

export const Bars3Icon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
    />
  </HeroIcon>
);

export const ChevronDownIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </HeroIcon>
);

export const ChevronUpIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
  </HeroIcon>
);

export const XMarkIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </HeroIcon>
);

export const XCircleIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </HeroIcon>
);

export const PlusIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </HeroIcon>
);

export const MinusIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
  </HeroIcon>
);

export const TrashIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
    />
  </HeroIcon>
);

export const PencilIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
    />
  </HeroIcon>
);

export const SaveIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
    />
  </HeroIcon>
);

// Fix: Users and Identity icons
export const UserIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
    />
  </HeroIcon>
);

export const UsersIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
    />
  </HeroIcon>
);

export const UsersGroupIcon = UsersIcon;

export const UserPlusIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
    />
  </HeroIcon>
);

export const IdentificationIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z"
    />
  </HeroIcon>
);

// Fix: Academic and Schedule icons
export const AcademicCapIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.26 10.174L11.24 14.5a.75.75 0 00.76 0l6.98-4.326M12 13.5v6m0 0l3-2m-3 2l-3-2m13.36-4.524l-3.36 2.083a.75.75 0 01-.76 0l-3.36-2.083M2.64 10.174l3.36 2.083a.75.75 0 00.76 0l3.36-2.083M12 2.25l9.75 5.625-9.75 5.625-9.75-5.625L12 2.25z"
    />
  </HeroIcon>
);

export const GraduationCapIcon = AcademicCapIcon;

export const BookOpenIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25"
    />
  </HeroIcon>
);

export const CalendarIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 3h.008v.008H12V18Zm-3-6h.008v.008H9v-.008ZM9 15h.008v.008H9V15Zm0 3h.008v.008H9V18Zm6-6h.008v.008H15v-.008ZM15 15h.008v.008H15V15Zm0 3h.008v.008H15V18Z"
    />
  </HeroIcon>
);

export const CalendarDaysIcon = CalendarIcon;

export const ClockIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </HeroIcon>
);

export const ClipboardDocumentListIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .415.162.793.425 1.076a1.498 1.498 0 0 0 2.15 0 1.498 1.498 0 0 1 1.076-.425c.231 0 .454.035.664.1m-5.801 0c-1.132.094-1.976 1.057-1.976 2.192V16.5A2.25 2.25 0 0 0 5.25 18.75h1.341m0 0c.192.934.93 1.65 1.83 1.83m0 0a2.25 2.25 0 0 0 2.25-2.25v-1.141c0-.415.162-.793.425-1.076a1.498 1.498 0 0 0 2.15 0 1.498 1.498 0 0 1 1.076-.425c.231 0 .454.035.664.1m-5.801 0c-1.132.094-1.976 1.057-1.976 2.192V16.5A2.25 2.25 0 0 0 5.25 18.75h1.341"
    />
  </HeroIcon>
);

export const RectangleStackIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m-15 0A2.25 2.25 0 0 0 3 12.122V13.5a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 13.5v-1.378a2.25 2.25 0 0 0-1.5-2.122m-15 3A2.25 2.25 0 0 0 3 15.122v.878A2.25 2.25 0 0 0 5.25 18.25h13.5A2.25 2.25 0 0 0 21 16v-.878A2.25 2.25 0 0 0 19.5 13"
    />
  </HeroIcon>
);

// Fix: Utilities and Status icons
export const Search = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
    />
  </HeroIcon>
);
export const SearchIcon = Search;

export const FilterListIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
    />
  </HeroIcon>
);

export const BellIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
    />
  </HeroIcon>
);

export const CheckCircleIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </HeroIcon>
);

export const ExclamationCircleIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </HeroIcon>
);

export const ExclamationTriangleIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 12.376Z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75h.007v.008H12v-.008Z" />
  </HeroIcon>
);

export const ShieldCheckIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751A11.959 11.959 0 0 1 12 5.714Z"
    />
  </HeroIcon>
);

export const ShieldExclamationIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m0 3.75h.008v.008H12v-.008ZM3.598 6a11.99 11.99 0 0 0-.598 3.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751A11.959 11.959 0 0 1 12 5.714Z"
    />
  </HeroIcon>
);

export const SparklesIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
    />
  </HeroIcon>
);

export const StarIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
    />
  </HeroIcon>
);

export const TrophyIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18V6M12 2l-3.5 3.5M12 2l3.5 3.5" />
  </HeroIcon>
);

export const HeartIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
    />
  </HeroIcon>
);

// Fix: Media and Device icons
export const CameraIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
    />
  </HeroIcon>
);

export const PhotoIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
    />
  </HeroIcon>
);

export const PaletteIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1-3.388-1.62m9.19 9.19a2.25 2.25 0 0 0 2.245-2.245 4.5 4.5 0 0 0-8.4-2.245c0 .399.078.78.22 1.128m0 0a15.998 15.998 0 0 1-3.388 1.62m5.043.025a15.994 15.994 0 0 0 3.388 1.62M15 18.75h-.007v.008H15v-.008Zm0-6h-.007v.008H15v-.008Zm-3-3h-.007v.008H12V9.75Zm-3 0h-.007v.008H9V9.75Zm-3 3h-.007v.008H6v-.008Z"
    />
  </HeroIcon>
);

export const RobotIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25"
    />
  </HeroIcon>
);

export const HeadsetIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
    />
  </HeroIcon>
);

export const ZapIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
    />
  </HeroIcon>
);

export const MonitorIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25"
    />
  </HeroIcon>
);

export const DevicePhoneIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
    />
  </HeroIcon>
);

// Fix: Data and Infrastructure icons
export const QrCodeIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 6.75h.008v.008H6.75V6.75Zm0 9.75h.008v.008H6.75v-.008Zm9.75-9.75h.008v.008h-.008V6.75ZM13.5 13.5h.008v.008H13.5V13.5Zm3.375 3.375h.008v.008h-.008v-.008Zm3.375-3.375h.008v.008H20.25v-.008Zm0 3.375h.008v.008H20.25v-.008ZM16.875 20.25h.008v.008h-.008v-.008Z"
    />
  </HeroIcon>
);

export const ChartBarIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
    />
  </HeroIcon>
);

export const ArrowTrendingUpIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.5 4.5L21.75 7.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 7.5H21.75V10.5" />
  </HeroIcon>
);

export const ArrowTrendingDownIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6l6.75 6.75 4.5-4.5L21.75 16.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 16.5V13.5h-3" />
  </HeroIcon>
);

export const EnvelopeIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
    />
  </HeroIcon>
);

export const LogOutIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
    />
  </HeroIcon>
);

export const BriefcaseIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.25 14.15v4.25c0 .621-.504 1.125-1.125 1.125H4.875c-.621 0-1.125-.504-1.125-1.125v-4.25m16.5 0a2.25 2.25 0 0 0-2.25-2.25H4.875a2.25 2.25 0 0 0-2.25 2.25m16.5 0V9.45c0-.621-.504-1.125-1.125-1.125H4.875c-.621 0-1.125.504-1.125 1.125V14.15m16.5 0a2.25 2.25 0 0 1-2.25 2.25H4.875a2.25 2.25 0 0 1-2.25-2.25M15 8.25V7.125A2.625 2.625 0 0 0 12.375 4.5h-.75A2.625 2.625 0 0 0 9 7.125V8.25"
    />
  </HeroIcon>
);

export const BuildingLibraryIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z"
    />
  </HeroIcon>
);

// Fix: System status and control icons
export const ArrowPathIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
    />
  </HeroIcon>
);

export const Loader2 = ({ className }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export const LockIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0V10.5m-2.25 10.5h13.5c.621 0 1.125-.504 1.125-1.125V11.625c0-.621-.504-1.125-1.125-1.125H5.25c-.621 0-1.125.504-1.125 1.125v8.25c0 .621.504 1.125 1.125 1.125Z"
    />
  </HeroIcon>
);

export const KeyIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.432L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l4.999-4.999c.406-.404.529-1 .432-1.563A6 6 0 1 1 21.75 8.25Z"
    />
  </HeroIcon>
);

export const FileText = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
    />
  </HeroIcon>
);

export const FileSpreadsheet = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5a1.125 1.125 0 0 0 1.125 1.125H9.75V8.25H3.375m17.25 11.25a1.125 1.125 0 0 0 1.125-1.125M20.625 19.5a1.125 1.125 0 0 1-1.125 1.125H14.25V8.25h6.375m-17.25 0V5.625c0-.621.504-1.125 1.125-1.125h15c.621 0 1.125.504 1.125 1.125V8.25m-17.25 0h17.25"
    />
  </HeroIcon>
);

export const HandThumbUpIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V3a.75.75 0 0 1 .75-.75A2.25 2.25 0 0 1 16.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.508c-.208 0-.414-.047-.604-.139a.75.75 0 0 1-.365-.662v-7.2c0-.361.26-.665.62-.705.185-.021.37-.035.556-.04a48.56 48.56 0 0 1 1.554.004c.186.005.37.019.556.04.36.04.62.344.62.705v7.2a.75.75 0 0 1-.365.662c-.19.092-.396.139-.604.139h-.508c-.445 0-.72-.498-.523-.898.097-.197.187-.397.27-.602"
    />
  </HeroIcon>
);

export const HandThumbDownIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.367 13.5c-.806 0-1.533.446-2.031 1.08a9.041 9.041 0 0 1-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.498 4.498 0 0 0-.322 1.672V21a.75.75 0 0 1-.75.75A2.25 2.25 0 0 1 7.5 19.5c0-1.152.26-2.243.723-3.218.266-.558-.107-1.282-.725-1.282H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 0 1-.068-1.285c0-2.848.994-5.463 2.649-7.521.388-.482.987-.729 1.605-.729H10.52c.483 0 .964.078 1.423.23l3.114 1.04a4.501 4.501 0 0 0 1.423.23H18.096M9.75 15h-2.25M18.096 5.25c-.083-.205-.173-.405-.27-.602-.197-.4.078-.898.523-.898h.508c.208 0 .414.047.604.139a.75.75 0 0 1 .365.662v7.2c0 .361-.26.665-.62.705-.185.021-.37.035-.556.04a48.56 48.56 0 0 1-1.554-.004c-.186-.005-.37-.019-.556-.04a.75.75 0 0 1-.62-.705v-7.2a.75.75 0 0 1 .365-.662c.19-.092.396-.139.604-.139h.508c.445 0 .72.498.523.898-.097.197-.187.397-.27.602"
    />
  </HeroIcon>
);

export const EyeIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.036 12.322a1.012 1.012 0 0 1 0-.644C3.399 8.049 7.21 5 12 5c4.79 0 8.601 3.049 9.964 6.678.045.122.045.264 0 .386-1.363 3.629-5.174 6.678-9.964 6.678-4.79 0-8.601-3.049-9.964-6.678Z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </HeroIcon>
);

export const EyeOffIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.22 8.223A10.477 10.477 0 0 1 8.266 12m0 0c.93 3.076 3.738 5.25 7.133 5.25.75 0 1.478-.095 2.162-.271M12 12a2.98 2.98 0 0 1-1.363-.335m0 0C6.398 9.333 4.29 5.25 4.29 5.25"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 3.75 16.5 16.5" />
  </HeroIcon>
);

export const PrinterIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.72 6.72c1.24-1.24 3.248-1.24 4.488 0L19.5 15.012v4.25c0 .621-.504 1.125-1.125 1.125H5.625c-.621 0-1.125-.504-1.125-1.125v-4.25l8.22-8.292Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 11.25l3.75 3.75m0 0l-3.75 3.75M15.75 15H5.25"
    />
  </HeroIcon>
);

export const CogIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.5 12a7.5 7.5 0 0 0 15 0m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m16.5 0h1.5m-11.25 4.5l-.375.375m1.5-1.5L9.375 15m6-6l-.375.375m1.5-1.5l.375-.375M12 3v1.5m0 15V21m4.5-11.25l.375-.375m-1.5 1.5l.375.375m-6 6l.375.375m-1.5-1.5l-.375.375"
    />
  </HeroIcon>
);

export const SettingsIcon = CogIcon;

export const AlertCircleIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
    />
  </HeroIcon>
);

export const CheckIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </HeroIcon>
);

export const DownloadIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
    />
  </HeroIcon>
);

export const ShareIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
    />
  </HeroIcon>
);

export const CheckCheckIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m4.5 12.75 6 6 9-13.5m-15 0L10.5 18l9-13.5"
    />
  </HeroIcon>
);

export const InfoIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
    />
  </HeroIcon>
);

export const CommandLineIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
    />
  </HeroIcon>
);

export const PhoneIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.154-5.111-3.441-6.265-6.265l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
    />
  </HeroIcon>
);

export const WhatsAppIcon = ({ className }: IconProps) => (
  <HeroIcon className={className} strokeWidth={0} fill="currentColor">
    <path d="M12.007 2a10 10 0 0 0-7.75 16.33L3 21l3.05-1.55A10 10 0 1 0 12.007 2zm5.82 14a1.88 1.88 0 0 1-1.3 1.2c-.36.08-.83.15-2.42-.51-2-1-3.23-3-3.33-3.15-.1-.13-.73-.97-.73-1.85a2 2 0 0 1 .6-1.5c.18-.18.39-.23.53-.23h.36c.11 0 .26-.04.41.31.15.36.52 1.25.56 1.34.04.1.07.2.04.28-.01.12-.08.2-.18.31s-.2.23-.29.35c-.1.1-.2.22-.08.43a8.1 8.1 0 0 0 1.51 1.86a6 6 0 0 0 2.18 1.34c.22.11.35.09.48-.06s.54-.62.68-.83c.14-.21.28-.18.47-.11s1.2.56 1.4.67.35.15.4.24a1.37 1.37 0 0 1-.16.92z" />
  </HeroIcon>
);

export const MapPinIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
    />
  </HeroIcon>
);

export const GlobeAltIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A11.952 11.952 0 0 1 12 13.5c-2.998 0-5.74 1.1-7.843 2.918"
    />
  </HeroIcon>
);

// Fix: Added missing Icons used in various components
export const Squares2x2Icon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25a2.25 2.25 0 0 1-2.25 2.25h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z"
    />
  </HeroIcon>
);

export const MegaphoneIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.062.51.115.77.16l2.25.405a2.25 2.25 0 0 1 2.453 2.996L16.082 20.5a2.25 2.25 0 0 1-2.453 2.996l-2.25-.405a2.25 2.25 0 0 1-1.04-3.411L10.34 15.84Zm0-9.18c.253-.062.51-.115.77-.16l2.25-.405a2.25 2.25 0 0 0 2.453-2.996L16.082 3.5a2.25 2.25 0 0 0-2.453-2.996l-2.25.405a2.25 2.25 0 0 0-1.04 3.411L10.34 6.66Zm0 9.18V6.66M13.5 10.5h.008v.008H13.5V10.5Zm3 0h.008v.008H16.5V10.5Z"
    />
  </HeroIcon>
);

export const ArrowDownTrayIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
    />
  </HeroIcon>
);

export const CloudIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z"
    />
  </HeroIcon>
);

export const CloudOffIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 3.75 16.5 16.5" />
  </HeroIcon>
);

export const CloudArrowUpIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
    />
  </HeroIcon>
);

export const BanknotesIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5c.621 0 1.125.504 1.125 1.125v12.75c0 .621-.504 1.125-1.125 1.125H3.75A1.125 1.125 0 0 1 2.625 18.375V5.625c0-.621.504-1.125 1.125-1.125Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 11.25a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V11.25M12 18.75a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
    />
  </HeroIcon>
);

export const SunIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M3 12h2.25m.386-6.364 1.591 1.591M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
    />
  </HeroIcon>
);

export const MoonIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21.75 12.75A9 9 0 0 1 12.45 3a9.03 9.03 0 0 0 2.1 18.6 9.003 9.003 0 0 0 7.2-8.85Z"
    />
  </HeroIcon>
);

export const PlayIcon = ({ className }: IconProps) => (
  <HeroIcon className={className} fill="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653z"
    />
  </HeroIcon>
);

export const CheckBadgeIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
    />
  </HeroIcon>
);

export const MagnifyingGlassIcon = Search;

export const TableCellsIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5a1.125 1.125 0 0 0 1.125 1.125H9.75V8.25H3.375m17.25 11.25a1.125 1.125 0 0 0 1.125-1.125M20.625 19.5a1.125 1.125 0 0 1-1.125 1.125H14.25V8.25h6.375m-17.25 0V5.625c0-.621.504-1.125 1.125-1.125h15c.621 0 1.125.504 1.125 1.125V8.25m-17.25 0h17.25"
    />
  </HeroIcon>
);

export const PlusCircleIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </HeroIcon>
);

export const SignalIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
    />
  </HeroIcon>
);

export const WifiIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856a8.25 8.25 0 0 1 13.788 0M1.924 8.674a11.25 11.25 0 0 1 20.152 0M12.53 18.22a.75.75 0 0 1-1.06 0L11.22 17.97a.75.75 0 0 1 1.06 0l.25.25Z"
    />
  </HeroIcon>
);

export const BatteryIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="1" y="6" width="18" height="12" rx="2" ry="2" />
    <path d="M23 13V11" />
    <path d="M5 10H15" />
  </svg>
);

export const SendIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
    />
  </HeroIcon>
);

export const PaperAirplaneIcon = SendIcon;

export const CreditCardIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
    />
  </HeroIcon>
);

export const MessageSquareIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
    />
  </HeroIcon>
);

export const MessageCircleIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.596.596 0 0 1-.474-.065.412.412 0 0 1-.205-.35c0-1.07.411-2.071 1.146-2.91A8.204 8.204 0 0 1 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
    />
  </HeroIcon>
);

export const ArrowsPointingOutIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
    />
  </HeroIcon>
);

export const ArrowsPointingInIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
    />
  </HeroIcon>
);

export const HelpCircleIcon = ({ className }: IconProps) => (
  <HeroIcon className={className}>
    <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3V13"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
  </HeroIcon>
);

// Fix: Kemenag and related logo placeholders (Mapped from Google Drive)
const SmartDriveIcon = ({
  fileId,
  FallbackIcon,
  className,
}: {
  fileId: string;
  FallbackIcon: React.FC<IconProps>;
  className?: string;
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <FallbackIcon className={className} />;
  }

  // lh3.googleusercontent.com/d/ID is generally more reliable for embedding public drive images
  return (
    <img
      src={`https://lh3.googleusercontent.com/d/${fileId}`}
      alt="Logo"
      onError={() => setHasError(true)}
      className={`${className || 'w-5 h-5'} object-contain drop-shadow-sm border-0`}
      referrerPolicy="no-referrer"
    />
  );
};

export const RdmIcon = (props: IconProps) => (
  <SmartDriveIcon
    fileId="1LaNh2QMfdsfdIARzRqO9z28kmHdwXVYK"
    FallbackIcon={AcademicCapIcon}
    {...props}
  />
);
export const EmisGtkIcon = (props: IconProps) => (
  <SmartDriveIcon
    fileId="1h2S3ic5k_RFaJBOSK9EGpZm6xhHEXQtL"
    FallbackIcon={IdentificationIcon}
    {...props}
  />
);
export const PintarIcon = (props: IconProps) => (
  <SmartDriveIcon
    fileId="16huzm5CuNdDF91_wIndGgnJTGHXUM2kU"
    FallbackIcon={SparklesIcon}
    {...props}
  />
);
export const AsnDigitalIcon = (props: IconProps) => (
  <SmartDriveIcon
    fileId="10KEBDQ0zxpPo9tYKHBOXuLPt3wgXBvhM"
    FallbackIcon={ShieldCheckIcon}
    {...props}
  />
);
export const PusakaIcon = (props: IconProps) => (
  <SmartDriveIcon
    fileId="1bRX-yogRsfbDeAzpdDxP9Hj9OaEv88Nd"
    FallbackIcon={BuildingLibraryIcon}
    {...props}
  />
);
export const Emis40Icon = (props: IconProps) => (
  <SmartDriveIcon
    fileId="1LC86T4WSlUzIwxQEFQDV2hoR--zpe0bi"
    FallbackIcon={CommandLineIcon}
    {...props}
  />
);
export const SimsdmIcon = (props: IconProps) => (
  <SmartDriveIcon
    fileId="10TbuMUaaspE8HBDYCI6VimGrdRNf614j"
    FallbackIcon={ClipboardDocumentListIcon}
    {...props}
  />
);
export const AbsensiKemenagIcon = (props: IconProps) => (
  <SmartDriveIcon fileId="1gd2SoKrr0nDhCfSFwQr6rUdR6ZPyXUMt" FallbackIcon={ClockIcon} {...props} />
);
export const EmisIcon = Emis40Icon;



