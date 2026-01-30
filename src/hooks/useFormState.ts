import { useMemo, useReducer } from "react";

type Mode = 1 | 2 | 3;

type State = {
  mode: Mode;
  domain: string;
  numUsers: number;
  scriptPath: string;
  confirmUninstall: boolean;
};

type Action =
  | { type: "setMode"; value: Mode }
  | { type: "setDomain"; value: string }
  | { type: "setUsers"; value: number }
  | { type: "setScript"; value: string }
  | { type: "toggleUninstall"; value: boolean };

const initialState: State = {
  mode: 1,
  domain: "",
  numUsers: 1,
  scriptPath: "codex-setup.sh",
  confirmUninstall: false
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "setMode":
      return {
        ...state,
        mode: action.value,
        confirmUninstall: action.value === 3 ? state.confirmUninstall : false
      };
    case "setDomain":
      return { ...state, domain: action.value };
    case "setUsers":
      return { ...state, numUsers: action.value };
    case "setScript":
      return { ...state, scriptPath: action.value };
    case "toggleUninstall":
      return { ...state, confirmUninstall: action.value };
    default:
      return state;
  }
}

export function useFormState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setMode = (value: number) => dispatch({ type: "setMode", value: value as Mode });
  const setDomain = (value: string) => dispatch({ type: "setDomain", value });
  const setUsers = (value: number) => dispatch({ type: "setUsers", value });
  const setScriptPath = (value: string) => dispatch({ type: "setScript", value });
  const toggleUninstall = (value: boolean) => dispatch({ type: "toggleUninstall", value });

  const visibility = useMemo(() => {
    return {
      showDomain: state.mode === 1,
      showUsers: state.mode !== 3,
      showUninstall: state.mode === 3
    };
  }, [state.mode]);

  return {
    state,
    setMode,
    setDomain,
    setUsers,
    setScriptPath,
    toggleUninstall,
    visibility
  };
}
