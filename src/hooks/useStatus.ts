import { useCallback, useState } from "react";

export type Status = {
  message: string;
  tone: "info" | "error";
};

const initial: Status = {
  message: "",
  tone: "info"
};

export function useStatus() {
  const [status, setStatusState] = useState<Status>(initial);

  const setStatus = useCallback((message: string, tone: "info" | "error" = "info") => {
    setStatusState({ message, tone });
  }, []);

  const clearStatus = useCallback(() => {
    setStatusState(initial);
  }, []);

  return { status, setStatus, clearStatus };
}
