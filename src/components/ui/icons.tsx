"use client";

import {
  ArrowRight as PArrowRight,
  ArrowLeft as PArrowLeft,
  SpinnerGap,
  CaretDown,
  CaretLeft,
  CaretRight,
  ClipboardText,
  Briefcase,
  Lightning,
  SunDim,
  Moon as PMoon,
  X as PX,
  MagnifyingGlass,
  ShieldCheck as PShieldCheck,
  Warning,
  WarningCircle,
  CheckCircle,
  Check as PCheck,
  Info as PInfo,
  Buildings,
  Package as PPackage,
  Factory as PFactory,
  Fish as PFish,
  Shield as PShield,
  Question,
  ForkKnife,
  ArrowsClockwise,
  ClockCounterClockwise,
  Airplane,
  Boat,
  TrendUp,
  TrendDown,
  Globe as PGlobe,
  Stack as PStack,
  Funnel as PFunnel,
  Desktop as PDesktop,
  Car as PCar,
  TShirt as PTShirt,
  Flask as PFlask,
  Heartbeat as PHeartbeat,
  Diamond as PDiamond,
  ShoppingBag as PShoppingBag,
  MapPin as PMapPin,
  Users as PUsers,
  Calendar as PCalendar,
  Percent as PPercent,
  ShieldWarning as PShieldWarning,
  ChartBar as PChartBar,
  Database as PDatabase,
  IconProps,
} from "@phosphor-icons/react";

// Wrapper to set default props (size 16, weight regular)
const withDefaults = (Icon: React.ComponentType<IconProps>) => {
  return function WrappedIcon(props: IconProps) {
    return (
      <Icon
        size={props.size || 16}
        weight={props.weight || "regular"}
        {...props}
      />
    );
  };
};

export const ArrowRight = withDefaults(PArrowRight);
export const ArrowLeft = withDefaults(PArrowLeft);
export const Loader2 = withDefaults(SpinnerGap); // Mapping Loader2 to SpinnerGap
export const ChevronDown = withDefaults(CaretDown);
export const ChevronLeft = withDefaults(CaretLeft);
export const ChevronRight = withDefaults(CaretRight);
export const ClipboardList = withDefaults(ClipboardText);
export const FolderOpen = withDefaults(Briefcase);
export const Sparkles = withDefaults(Lightning);
export const Sun = withDefaults(SunDim);
export const Moon = withDefaults(PMoon);
export const X = withDefaults(PX);
export const Search = withDefaults(MagnifyingGlass);
export const ShieldCheck = withDefaults(PShieldCheck);
export const AlertTriangle = withDefaults(Warning);
export const AlertCircle = withDefaults(WarningCircle);
export const CheckCircle2 = withDefaults(CheckCircle);
export const Check = withDefaults(PCheck);
export const Info = withDefaults(PInfo);
export const Building2 = withDefaults(Buildings);
export const Package = withDefaults(PPackage);
export const Factory = withDefaults(PFactory);
export const Fish = withDefaults(PFish);
export const Shield = withDefaults(PShield);
export const HelpCircle = withDefaults(Question);
export const UtensilsCrossed = withDefaults(ForkKnife);
export const RefreshCcw = withDefaults(ArrowsClockwise);
export const RotateCcw = withDefaults(ClockCounterClockwise);
export const Plane = withDefaults(Airplane);
export const Ship = withDefaults(Boat);
export const ArrowUpRight = withDefaults(TrendUp);
export const ArrowDownRight = withDefaults(TrendDown);
export const Globe = withDefaults(PGlobe);
export const Globe2 = withDefaults(PGlobe);
export const Layers = withDefaults(PStack);
export const Filter = withDefaults(PFunnel);
export const Desktop = withDefaults(PDesktop);
export const Car = withDefaults(PCar);
export const TShirt = withDefaults(PTShirt);
export const Flask = withDefaults(PFlask);
export const Heartbeat = withDefaults(PHeartbeat);
export const Diamond = withDefaults(PDiamond);
export const ShoppingBag = withDefaults(PShoppingBag);
export const MapPin = withDefaults(PMapPin);
export const Users = withDefaults(PUsers);
export const Calendar = withDefaults(PCalendar);
export const Percent = withDefaults(PPercent);
export const ShieldAlert = withDefaults(PShieldWarning);
export const BarChart3 = withDefaults(PChartBar);
export const Database = withDefaults(PDatabase);
export const TrendingUp = withDefaults(TrendUp);
