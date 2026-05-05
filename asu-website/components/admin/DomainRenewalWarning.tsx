"use client";

import { useEffect, useMemo, useState } from "react";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Link as MuiLink,
  Stack,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import type { ProfileRole } from "@/lib/getCurrentProfile";
import {
  canSeeDomainRenewalNotice,
  DOMAIN_RENEWAL_DOCS_URL,
  getDomainRenewalNoticeState,
} from "@/lib/domainRenewalNotice";

type DomainRenewalWarningProps = {
  role: ProfileRole;
  initialAcknowledged: boolean;
};

export default function DomainRenewalWarning({ role, initialAcknowledged }: DomainRenewalWarningProps) {
  const notice = useMemo(() => getDomainRenewalNoticeState(), []);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [understandsImportance, setUnderstandsImportance] = useState(false);
  const [acknowledged, setAcknowledged] = useState(initialAcknowledged);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (canSeeDomainRenewalNotice(role) && notice.isInWindow && !acknowledged) {
      setOpen(true);
    }
  }, [acknowledged, notice.isInWindow, role]);

  const handleLater = () => {
    setOpen(false);
    setConfirmOpen(false);
    setUnderstandsImportance(false);
  };

  const handleCancelConfirm = () => {
    setConfirmOpen(false);
    setUnderstandsImportance(false);
  };

  const handleConfirmDoNow = async () => {
    setSubmitting(true);
    window.open(DOMAIN_RENEWAL_DOCS_URL, "_blank", "noopener,noreferrer");

    try {
      const res = await fetch("/api/admin/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noticeKey: notice.noticeKey, action: "acknowledge_domain_renewal" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to acknowledge warning");

      setAcknowledged(true);
      setOpen(false);
      setConfirmOpen(false);
      setUnderstandsImportance(false);
      toast.success("Domain renewal warning marked as handled.");
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open && !confirmOpen}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            overflow: "hidden",
            borderRadius: 3,
            border: "2px solid rgba(252, 165, 165, 0.95)",
            bgcolor: "#170707",
            color: "#fff",
            boxShadow: "0 30px 90px rgba(0,0,0,0.62)",
          },
        }}
        slotProps={{
          backdrop: {
            sx: {
              bgcolor: "rgba(0,0,0,0.78)",
              backdropFilter: "blur(8px)",
            },
          },
        }}
        aria-labelledby="domain-renewal-warning-title"
      >
        <Box
          sx={{
            px: { xs: 2.5, sm: 3 },
            py: 1.5,
            bgcolor: "#dc2626",
            borderBottom: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <WarningAmberIcon sx={{ color: "#fff" }} />
            <Typography variant="overline" sx={{ color: "#fff", fontWeight: 900, letterSpacing: "0.16em" }}>
              Urgent Domain Renewal Warning
            </Typography>
          </Stack>
        </Box>

        <DialogTitle id="domain-renewal-warning-title" sx={{ px: { xs: 2.5, sm: 3 }, pb: 1.2, pt: 3 }}>
          <Stack spacing={1.4}>
            <Chip
              label={`Bills ${notice.renewalDateLabel}`}
              color="error"
              size="small"
              sx={{ alignSelf: "flex-start", fontWeight: 900, letterSpacing: "0.04em" }}
            />
            <Typography component="span" variant="h4" sx={{ color: "#fff", fontWeight: 950, lineHeight: 1.08 }}>
              The ASU website domain is set to auto-renew soon.
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, pb: 2.5 }}>
          <Stack spacing={2.25}>
            <Alert
              severity="warning"
              icon={<WarningAmberIcon fontSize="inherit" />}
              sx={{
                border: "1px solid rgba(253, 230, 138, 0.45)",
                bgcolor: "rgba(245, 158, 11, 0.16)",
                color: "#fef3c7",
                "& .MuiAlert-icon": { color: "#fbbf24" },
              }}
            >
              Confirm the registrar account, payment method, ownership access, and renewal settings before billing.
            </Alert>

            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.82)", lineHeight: 1.7 }}>
              This warning will keep returning every time the admin panel is opened until someone confirms they are
              handling the renewal.
            </Typography>

            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid rgba(255,255,255,0.14)",
                bgcolor: "rgba(255,255,255,0.06)",
              }}
            >
              <Stack spacing={0.7}>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.58)", fontWeight: 800, textTransform: "uppercase" }}>
                  Renewal Documentation
                </Typography>
                <MuiLink
                  href={DOMAIN_RENEWAL_DOCS_URL}
                  target="_blank"
                  rel="noreferrer"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    color: "#fde68a",
                    fontWeight: 800,
                    overflowWrap: "anywhere",
                    textDecorationColor: "rgba(253, 230, 138, 0.55)",
                    "&:hover": { color: "#fff7ed", textDecorationColor: "#fff7ed" },
                  }}
                >
                  Open setup and renewal documentation
                  <OpenInNewIcon sx={{ fontSize: 16 }} />
                </MuiLink>
              </Stack>
            </Box>

            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.58)" }}>
              This yearly alert starts on {notice.alertStartDateLabel}.
            </Typography>
          </Stack>
        </DialogContent>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />

        <DialogActions
          sx={{
            flexDirection: { xs: "column-reverse", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            gap: 1.2,
            px: { xs: 2.5, sm: 3 },
            py: 2.25,
          }}
        >
          <Button
            type="button"
            onClick={handleLater}
            disabled={submitting}
            variant="outlined"
            sx={{
              borderColor: "rgba(255,255,255,0.3)",
              color: "#fff",
              fontWeight: 800,
              textTransform: "none",
              borderRadius: 2,
              "&:hover": { borderColor: "rgba(255,255,255,0.52)", bgcolor: "rgba(255,255,255,0.08)" },
            }}
          >
            {"Okay, I'll do later"}
          </Button>
          <Button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={submitting}
            variant="contained"
            endIcon={<OpenInNewIcon />}
            sx={{
              bgcolor: "#fbbf24",
              color: "#111827",
              fontWeight: 900,
              textTransform: "none",
              borderRadius: 2,
              "&:hover": { bgcolor: "#fde047" },
            }}
          >
            {"Okay, I'll do it right now"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={open && confirmOpen}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            overflow: "hidden",
            borderRadius: 3,
            border: "2px solid rgba(251, 191, 36, 0.9)",
            bgcolor: "#180d05",
            color: "#fff",
            boxShadow: "0 30px 90px rgba(0,0,0,0.62)",
          },
        }}
        slotProps={{
          backdrop: {
            sx: {
              bgcolor: "rgba(0,0,0,0.78)",
              backdropFilter: "blur(8px)",
            },
          },
        }}
        aria-labelledby="domain-renewal-final-confirm-title"
      >
        <DialogTitle id="domain-renewal-final-confirm-title" sx={{ px: 3, pb: 1.2, pt: 3 }}>
          <Stack spacing={1.2}>
            <WarningAmberIcon sx={{ color: "#fbbf24", fontSize: 38 }} />
            <Typography component="span" variant="h5" sx={{ color: "#fff", fontWeight: 950, lineHeight: 1.16 }}>
              Final confirmation before this warning is dismissed
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pb: 2 }}>
          <Stack spacing={2}>
            <Alert
              severity="error"
              sx={{
                border: "1px solid rgba(252, 165, 165, 0.42)",
                bgcolor: "rgba(220, 38, 38, 0.16)",
                color: "#fee2e2",
                "& .MuiAlert-icon": { color: "#fca5a5" },
              }}
            >
              This will stop the domain renewal warning for everyone until next year&apos;s renewal cycle.
            </Alert>

            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.78)", lineHeight: 1.7 }}>
              Only continue if you are actively opening the renewal documentation and taking responsibility for
              checking the domain billing and auto-renewal status.
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={understandsImportance}
                  onChange={(event) => setUnderstandsImportance(event.target.checked)}
                  sx={{
                    color: "rgba(253, 230, 138, 0.78)",
                    "&.Mui-checked": { color: "#fbbf24" },
                  }}
                />
              }
              label="I understand this hides the alert for all admins and editors for this renewal year."
              sx={{
                alignItems: "flex-start",
                m: 0,
                color: "rgba(255,255,255,0.86)",
                "& .MuiFormControlLabel-label": { pt: 0.9, fontSize: 14, lineHeight: 1.45 },
              }}
            />
          </Stack>
        </DialogContent>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />

        <DialogActions
          sx={{
            flexDirection: { xs: "column-reverse", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            gap: 1.2,
            px: 3,
            py: 2.25,
          }}
        >
          <Button
            type="button"
            onClick={handleCancelConfirm}
            disabled={submitting}
            variant="outlined"
            sx={{
              borderColor: "rgba(255,255,255,0.3)",
              color: "#fff",
              fontWeight: 800,
              textTransform: "none",
              borderRadius: 2,
              "&:hover": { borderColor: "rgba(255,255,255,0.52)", bgcolor: "rgba(255,255,255,0.08)" },
            }}
          >
            Go back
          </Button>
          <Button
            type="button"
            onClick={handleConfirmDoNow}
            disabled={submitting || !understandsImportance}
            variant="contained"
            endIcon={<OpenInNewIcon />}
            sx={{
              bgcolor: "#fbbf24",
              color: "#111827",
              fontWeight: 900,
              textTransform: "none",
              borderRadius: 2,
              "&:hover": { bgcolor: "#fde047" },
            }}
          >
            {submitting ? "Opening docs..." : "Yes, mark as handled"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
