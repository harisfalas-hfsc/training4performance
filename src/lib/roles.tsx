import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Role = "head_coach" | "fitness_staff" | "medical_staff";

export interface RoleDefinition {
  id: Role;
  label: string;
  short: string;
  description: string;
  permissions: {
    viewMedicalDetail: boolean;
    viewMedicalSummary: boolean;
    editTrainingPlan: boolean;
    importGps: boolean;
    manageAlertThresholds: boolean;
    scheduleExports: boolean;
  };
}

export const ROLES: RoleDefinition[] = [
  {
    id: "head_coach",
    label: "Head coach",
    short: "HC",
    description: "Squad availability, workload and training decisions. Medical detail is withheld.",
    permissions: {
      viewMedicalDetail: false,
      viewMedicalSummary: true,
      editTrainingPlan: true,
      importGps: false,
      manageAlertThresholds: false,
      scheduleExports: true,
    },
  },
  {
    id: "fitness_staff",
    label: "Fitness staff",
    short: "FS",
    description: "Load management, GPS import, thresholds and performance reporting.",
    permissions: {
      viewMedicalDetail: false,
      viewMedicalSummary: true,
      editTrainingPlan: true,
      importGps: true,
      manageAlertThresholds: true,
      scheduleExports: true,
    },
  },
  {
    id: "medical_staff",
    label: "Medical staff",
    short: "MS",
    description: "Full clinical record, diagnoses, return-to-play staging and availability.",
    permissions: {
      viewMedicalDetail: true,
      viewMedicalSummary: true,
      editTrainingPlan: false,
      importGps: true,
      manageAlertThresholds: true,
      scheduleExports: true,
    },
  },
];

export const getRoleDef = (role: Role) => ROLES.find((r) => r.id === role)!;

interface RoleContextValue {
  role: Role;
  setRole: (r: Role) => void;
  def: RoleDefinition;
  can: (key: keyof RoleDefinition["permissions"]) => boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

const STORAGE_KEY = "t4p.role";

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("head_coach");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Role | null;
    if (saved && ROLES.some((r) => r.id === saved)) setRole(saved);
  }, []);

  const value = useMemo<RoleContextValue>(() => {
    const def = getRoleDef(role);
    return {
      role,
      def,
      setRole: (r: Role) => {
        setRole(r);
        window.localStorage.setItem(STORAGE_KEY, r);
      },
      can: (key) => def.permissions[key],
    };
  }, [role]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside RoleProvider");
  return ctx;
}

/** Redacted medical text shown to roles without clinical access. */
export const MEDICAL_REDACTED = "Restricted — clinical detail visible to medical staff only";
