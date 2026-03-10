"use client";

import { Chip, Divider, Stack, Typography } from "@mui/material";
import TogglePanel from "@/components/admin/TogglePanel";
import type { AdminActivityLogRecord } from "@/lib/adminActivity";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function titleCaseEntity(value: string) {
  return value.replace(/_/g, " ");
}

export default function AdminLogsPanel({ logs }: { logs: AdminActivityLogRecord[] }) {
  return (
    <TogglePanel label="Logs">
      <Stack spacing={2}>
        <Typography sx={{ color: "rgba(255,255,255,0.74)", fontSize: "0.92rem" }}>
          Recent admin and owner activity across store operations, event edits, and access changes.
        </Typography>

        <Stack
          spacing={1.75}
          sx={{
            maxHeight: 360,
            overflowY: "auto",
            borderRadius: 2,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(2, 6, 23, 0.72)",
            px: 1.6,
            py: 1.2,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",
          }}
        >
          {logs.length === 0 ? (
            <Typography sx={{ color: "rgba(255,255,255,0.68)" }}>No activity logged yet.</Typography>
          ) : (
            logs.map((log, index) => {
              const changes = Array.isArray(log.details?.changes)
                ? log.details.changes.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
                : [];

              return (
                <Stack key={log.id} spacing={0.8}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }}>
                    <Chip
                      size="small"
                      label={titleCaseEntity(log.entity_type)}
                      sx={{
                        bgcolor: "rgba(250,204,21,0.16)",
                        color: "#fde68a",
                        border: "1px solid rgba(250,204,21,0.26)",
                        textTransform: "capitalize",
                        fontFamily: "inherit",
                      }}
                    />
                    <Typography sx={{ color: "#fff", fontWeight: 700, fontFamily: "inherit" }}>
                      {log.actor_email} {log.summary}
                    </Typography>
                  </Stack>
                  <Typography sx={{ color: "rgba(255,255,255,0.56)", fontSize: "0.8rem", fontFamily: "inherit" }}>
                    {formatDateTime(log.created_at)}
                  </Typography>
                  {changes.length > 0 && (
                    <Stack spacing={0.35} sx={{ pl: 0.4 }}>
                      {changes.map((change, changeIndex) => (
                        <Typography
                          key={`${log.id}-change-${changeIndex}`}
                          sx={{ color: "rgba(255,255,255,0.76)", fontSize: "0.86rem", fontFamily: "inherit" }}
                        >
                          {`> ${change}`}
                        </Typography>
                      ))}
                    </Stack>
                  )}
                  {index < logs.length - 1 && <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", pt: 0.8 }} />}
                </Stack>
              );
            })
          )}
        </Stack>
      </Stack>
    </TogglePanel>
  );
}
