import React from 'react';
import * as LucideIcons from 'lucide-react';
import {
  User,
  Users,
  Trophy,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  Plus,
  Trash2,
  Edit,
  Printer,
  FileText,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Search,
  Settings,
  Bell,
  Home,
  BookOpen,
  GraduationCap,
  Award,
  Layers,
  Database,
  Key,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  LogOut,
  LogIn,
  Upload,
  Download,
  Filter,
  Check,
  Zap,
  Info,
  Phone,
  Mail,
  MapPin,
  Building,
  School,
  Sparkles,
  QrCode,
  Camera,
  Activity,
  Sliders,
  Send,
  HelpCircle,
  Archive,
  BarChart2,
  Folder,
  Tag,
  Star,
  Compass,
  Banknote,
  Megaphone,
  MessageSquare,
  CloudUpload,
  Wifi,
  Cpu,
  Table,
  Smartphone,
} from 'lucide-react';

export * from 'lucide-react';

// Common aliases used across e-MAM codebase
export const UserIcon = User;
export const UsersIcon = Users;
export const TrophyIcon = Trophy;
export const ShieldCheckIcon = ShieldCheck;
export const ShieldExclamationIcon = ShieldAlert;
export const AlertCircleIcon = AlertCircle;
export const AlertTriangleIcon = AlertTriangle;
export const CheckCircleIcon = CheckCircle;
export const CheckBadgeIcon = ShieldCheck;
export const XCircleIcon = XCircle;
export const XMarkIcon = X;
export const PlusIcon = Plus;
export const TrashIcon = Trash2;
export const EditIcon = Edit;
export const PencilIcon = Edit;
export const PrinterIcon = Printer;
export const FileTextIcon = FileText;
export const ClockIcon = Clock;
export const CalendarIcon = Calendar;
export const ChevronDownIcon = ChevronDown;
export const ChevronUpIcon = ChevronUp;
export const ChevronLeftIcon = ChevronLeft;
export const ChevronRightIcon = ChevronRight;
export const ArrowLeftIcon = ArrowLeft;
export const ArrowRightIcon = ArrowRight;
export const ArrowPathIcon = RefreshCw;
export const SearchIcon = Search;
export const CogIcon = Settings;
export const SettingsIcon = Settings;
export const BellIcon = Bell;
export const HomeIcon = Home;
export const BookOpenIcon = BookOpen;
export const AcademicCapIcon = GraduationCap;
export const AwardIcon = Award;
export const LayersIcon = Layers;
export const DatabaseIcon = Database;
export const KeyIcon = Key;
export const LockIcon = Lock;
export const LockClosedIcon = Lock;
export const LockOpenIcon = Unlock;
export const EyeIcon = Eye;
export const EyeSlashIcon = EyeOff;
export const EyeOffIcon = EyeOff;
export const Loader2 = LucideIcons.Loader2 || LucideIcons.RefreshCw;
export const ArrowsPointingOutIcon = LucideIcons.Maximize || LucideIcons.Maximize2;
export const ArrowsPointingInIcon = LucideIcons.Minimize || LucideIcons.Minimize2;
export const MaximizeIcon = LucideIcons.Maximize || LucideIcons.Maximize2;
export const MinimizeIcon = LucideIcons.Minimize || LucideIcons.Minimize2;

// Custom Brand / Icon Components
export const GoogleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

export const AppLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <GraduationCap {...props} />
);

export const AppLogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <GraduationCap {...props} />
);

export const WhatsAppIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Phone {...props} />
);
export const ArrowLeftOnRectangleIcon = LogIn;
export const ArrowUpTrayIcon = Upload;
export const ArrowDownTrayIcon = Download;
export const FunnelIcon = Filter;
export const CheckIcon = Check;
export const ZapIcon = Zap;
export const InformationCircleIcon = Info;
export const PhoneIcon = Phone;
export const EnvelopeIcon = Mail;
export const MapPinIcon = MapPin;
export const BuildingOfficeIcon = Building;
export const BuildingLibraryIcon = School;
export const SparklesIcon = Sparkles;
export const QrCodeIcon = QrCode;
export const CameraIcon = Camera;
export const ChartBarIcon = BarChart2;
export const ExclamationCircleIcon = AlertCircle;
export const ExclamationTriangleIcon = AlertTriangle;
export const FolderIcon = Folder;
export const TagIcon = Tag;
export const StarIcon = Star;
export const CompassIcon = Compass;
export const IdentificationIcon = User;
export const HandThumbUpIcon = Check;
export const ChatBubbleLeftRightIcon = MessageSquare;
export const EllipsisVerticalIcon = LucideIcons.MoreVertical;
export const Bars3Icon = LucideIcons.Menu;
export const RectangleStackIcon = Layers;
export const Squares2x2Icon = LucideIcons.LayoutGrid;
export const CloudArrowUpIcon = CloudUpload;
export const WifiIcon = Wifi;
export const GlobeAltIcon = LucideIcons.Globe;
export const RobotIcon = Sparkles;
export const ClipboardDocumentListIcon = FileText;
export const HandThumbDownIcon = LucideIcons.ThumbsDown;
export const CpuChipIcon = Cpu;
export const TableCellsIcon = Table;
export const MagnifyingGlassIcon = Search;
export const CommandLineIcon = LucideIcons.Terminal;
export const ArrowTrendingUpIcon = LucideIcons.TrendingUp;
export const FilterListIcon = Filter;
export const Bars3CenterLeftIcon = LucideIcons.AlignLeft;
export const UsersGroupIcon = Users;

export const BanknotesIcon = Banknote;
export const MegaphoneIcon = Megaphone;
export const MessageSquareIcon = MessageSquare;
export const InfoIcon = Info;
export const SendIcon = Send;
export const DevicePhoneIcon = Smartphone;
export const EmamLogo = AppLogo;

export default LucideIcons;
