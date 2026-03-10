"use client";

import { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Accordion, AccordionDetails, AccordionSummary, Typography } from "@mui/material";

export default function TogglePanel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Accordion
      expanded={open}
      onChange={(_, expanded) => setOpen(expanded)}
      disableGutters
      sx={{
        borderRadius: "14px !important",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.18)",
        background: "rgba(255,255,255,0.06)",
        boxShadow: "0 16px 28px rgba(0,0,0,0.22)",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: "#fde68a" }} />}
        sx={{
          px: 2,
          py: 0.6,
          backgroundColor: "rgba(245, 158, 11, 0.15)",
          borderBottom: open ? "1px solid rgba(255,255,255,0.16)" : "none",
        }}
      >
        <Typography sx={{ fontWeight: 700, color: "#fff", letterSpacing: "0.02em" }}>{label}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 2.2 }}>{children}</AccordionDetails>
    </Accordion>
  );
}
