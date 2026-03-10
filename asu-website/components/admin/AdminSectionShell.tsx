import Link from "next/link";
import type { ReactNode } from "react";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import type { ProfileRole } from "@/lib/getCurrentProfile";

type InfoVariant = "info" | "warning" | "error";

function roleChipColor(role: ProfileRole) {
  if (role === "owner") return "error";
  if (role === "admin") return "warning";
  if (role === "editor") return "success";
  return "default";
}

export function AdminSectionShell({
  title,
  description,
  role,
  backHref = "/admin",
  backLabel = "Back to Dashboard",
  eyebrow = "Admin",
  children,
}: {
  title: string;
  description: string;
  role: ProfileRole;
  backHref?: string;
  backLabel?: string;
  eyebrow?: string;
  children?: ReactNode;
}) {
  return (
    <Box component="main" sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", pb: { xs: 12, md: 16 }, pt: "clamp(12rem, 18vh, 20rem)" }}>
      <Stack spacing={4} sx={{ width: "100%", maxWidth: 1200, px: 2 }}>
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 3,
            borderColor: "rgba(255,255,255,0.16)",
            bgcolor: "rgba(255,255,255,0.07)",
            boxShadow: "0 24px 42px rgba(0,0,0,0.26)",
          }}
        >
          <Typography variant="overline" sx={{ color: "rgba(253, 230, 138, 0.86)", fontWeight: 700, letterSpacing: "0.2em" }}>
            {eyebrow}
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between" spacing={2} sx={{ mt: 0.6 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} alignItems={{ xs: "flex-start", sm: "center" }}>
              {backHref && (
                <Link href={backHref} style={{ textDecoration: "none" }}>
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{
                      color: "#fff",
                      borderColor: "rgba(255,255,255,0.28)",
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 700,
                      "&:hover": {
                        borderColor: "rgba(255,255,255,0.45)",
                        backgroundColor: "rgba(255,255,255,0.07)",
                      },
                    }}
                  >
                    {`← ${backLabel}`}
                  </Button>
                </Link>
              )}
              <Box>
                <Typography variant="h4" sx={{ color: "#fff", fontWeight: 800, lineHeight: 1.15 }}>
                  {title}
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.74)", mt: 0.4 }}>
                  {description}
                </Typography>
              </Box>
            </Stack>
            <Chip
              label={role}
              color={roleChipColor(role)}
              size="small"
              sx={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em" }}
            />
          </Stack>
        </Paper>

        {children}
      </Stack>
    </Box>
  );
}

export function AdminInfoCard({
  title,
  body,
  variant = "info",
}: {
  title: string;
  body: string;
  variant?: InfoVariant;
}) {
  const tone =
    variant === "warning"
      ? { borderColor: "rgba(245, 158, 11, 0.35)", bgcolor: "rgba(245, 158, 11, 0.12)" }
      : variant === "error"
        ? { borderColor: "rgba(239, 68, 68, 0.42)", bgcolor: "rgba(185, 28, 28, 0.22)" }
        : { borderColor: "rgba(255,255,255,0.16)", bgcolor: "rgba(255,255,255,0.07)" };

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, p: 3, ...tone }}>
      <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.82)", mt: 1 }}>
        {body}
      </Typography>
    </Paper>
  );
}

export function AdminActionCard({
  title,
  description,
  badge,
  href,
  disabled,
}: {
  title: string;
  description: string;
  badge?: string;
  href?: string;
  disabled?: boolean;
}) {
  const content = (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2.5,
        p: 2.25,
        height: "100%",
        borderColor: "rgba(255,255,255,0.14)",
        bgcolor: "rgba(255,255,255,0.06)",
        transition: "transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease",
        opacity: disabled ? 0.72 : 1,
        "&:hover": disabled
          ? undefined
          : {
              transform: "translateY(-2px)",
              borderColor: "rgba(255,255,255,0.26)",
              backgroundColor: "rgba(255,255,255,0.08)",
            },
      }}
    >
      <Stack direction="row" justifyContent="space-between" spacing={1.5}>
        <Box>
          <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, fontSize: "1.05rem" }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)", mt: 1 }}>
            {description}
          </Typography>
        </Box>
        {badge && (
          <Chip
            size="small"
            label={badge}
            sx={{
              bgcolor: "rgba(245, 158, 11, 0.2)",
              color: "rgba(254, 243, 199, 0.95)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              alignSelf: "flex-start",
            }}
          />
        )}
      </Stack>
    </Paper>
  );

  if (href && !disabled) {
    return (
      <Link href={href} style={{ textDecoration: "none", display: "block", height: "100%" }}>
        {content}
      </Link>
    );
  }

  return <Box sx={{ height: "100%" }}>{content}</Box>;
}
