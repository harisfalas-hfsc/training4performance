import { createContext, useContext, useMemo, type ReactNode } from "react";

/**
 * T4P is a fitness-coach platform: one staff role with full access.
 * The provider is kept so pages can read permissions without prop drilling.
 */
export type Role = "fitness_staff";

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

export const FITNESS_COACH: RoleDefinition = {
  id: "fitness_staff",
  label: "Fitness coach",
  short: "FC",
  description: "Full access: squad, training, load management, GPS, testing, alerts and reporting.",
  permissions: {
    viewMedicalDetail: true,
    viewMedicalSummary: true,
    editTrainingPlan: true,
    importGps: true,
    manageAlertThresholds: true,
    scheduleExports: true,
  },
};

export const ROLES: RoleDefinition[] = [FITNESS_COACH];

export const getRoleDef = (_role?: Role) => FITNESS_COACH;

interface RoleContextValue {
  role: Role;
  def: RoleDefinition;
  can: (key: keyof RoleDefinition["permissions"]) => boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const value = useMemo<RoleContextValue>(
    () => ({ role: FITNESS_COACH.id, def: FITNESS_COACH, can: (key) => FITNESS_COACH.permissions[key] }),
    [],
  );
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  return ctx ?? { role: FITNESS_COACH.id, def: FITNESS_COACH, can: (key) => FITNESS_COACH.permissions[key] };
}

/** Kept for compatibility — nothing is redacted for a single-role platform. */
export const MEDICAL_REDACTED = "Restricted";
