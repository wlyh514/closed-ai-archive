import { forwardRef, useImperativeHandle, useState } from "react";
import "./warning.css";

interface WarningInfo {
  type: WarningTypes;
  message: string;
}

type WarningTypes = "joining" | "warning" | "error";

interface Warning extends WarningInfo {
  id: number;
}

export interface WarningsMethods {
  pushWarning: (warning: WarningInfo | WarningInfo[]) => void;
  clearAll: () => void;
}

class Warning {
  static count = 0;

  static fromInfo(info: WarningInfo): Warning {
    return new Warning(info.type, info.message);
  }

  constructor(public type: WarningTypes, public message: string) {
    this.id = Warning.count;
    Warning.count++;
  }
}

const Warnings = forwardRef((_, ref) => {
  const [warnings, setWarnings] = useState<Warning[]>([]);

  useImperativeHandle(ref, () => ({
    pushWarning: (warning: WarningInfo | WarningInfo[]) => {
      if (warning instanceof Array) {
        const newWarnings = warning.map((i) => Warning.fromInfo(i));
        setWarnings(newWarnings.concat(warnings));
      } else {
        setWarnings([Warning.fromInfo(warning), ...warnings]);
      }
    },
    clearAll: () => {
      setWarnings([]);
    },
  }));

  const removeWarningId = (id: number) => () => {
    const newWarnings = [];
    for (const warning of warnings) {
      if (warning.id !== id) {
        newWarnings.push(warning);
      }
    }
    setWarnings(newWarnings);
  };

  return (
    <div className="warnings-container">
      {warnings.map((warning) => (
        <div key={warning.id} className={`warning ${warning.type}t`}>
          <div>
            <span>
              {" "}
              {warning.type === "joining" ? "" : warning.type + ": "}{" "}
              {warning.message}
            </span>
          </div>
          <button
            className="close-warning-btn"
            onClick={removeWarningId(warning.id)}
          ></button>
        </div>
      ))}
    </div>
  );
});

export default Warnings;
