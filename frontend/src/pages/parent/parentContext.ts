import { useOutletContext } from "react-router-dom";
import type { ParentChild, ParentProfile } from "../../services/api";

export interface ParentOutletContext {
  profile: ParentProfile | null;
  children: ParentChild[];
  selectedChild: ParentChild | null;
  selectChild: (id: string) => void;
  reloadProfile: () => Promise<void>;
}

/** Hook for parent pages to read the shared parent/child state */
export const useParentContext = () => useOutletContext<ParentOutletContext>();

export const childFullName = (child: ParentChild) =>
  [
    child.personalInfo.firstName,
    child.personalInfo.middleName,
    child.personalInfo.lastName,
  ]
    .filter(Boolean)
    .join(" ");
