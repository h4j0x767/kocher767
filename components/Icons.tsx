
import React from 'react';
import { 
  Clock, 
  Activity, 
  Scale, 
  User, 
  Zap, 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  BookOpen,
  Thermometer,
  Pill,
  Search,
  ArrowLeft,
  Heart,
  ExternalLink,
  FlaskConical,
  Stethoscope,
  Copy,
  Share2,
  FileDown
} from 'lucide-react';

export const IconMap = {
  clock: Clock,
  percent: Activity,
  scale: Scale,
  user: User,
  zap: Zap,
  info: Info,
  alert: AlertTriangle,
  check: CheckCircle,
  shield: ShieldAlert,
  book: BookOpen,
  thermometer: Thermometer,
  pill: Pill,
  activity: Activity,
  stethoscope: Stethoscope,
  search: Search,
  arrowLeft: ArrowLeft,
  heart: Heart,
  link: ExternalLink,
  flask: FlaskConical,
  copy: Copy,
  share: Share2,
  pdf: FileDown
};

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

export const DynamicIcon: React.FC<IconProps> = ({ name, size = 24, className }) => {
  // @ts-ignore
  const IconComponent = IconMap[name] || Info;
  return <IconComponent size={size} className={className} />;
};
