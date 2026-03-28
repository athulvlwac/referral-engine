export type LogSeverity = "Info" | "Warning" | "Critical";

export type LogRecord = {
  id: string;
  timestamp: string;
  source: string;
  message: string;
  severity: LogSeverity;
};
