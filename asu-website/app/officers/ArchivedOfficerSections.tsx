"use client";

import { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Stack,
  Typography,
} from "@mui/material";
import OfficerGrid from "./OfficerGrid";

type Officer = {
  _id: string;
  name: string;
  role: string;
  major?: string;
  year?: string;
  bio?: string;
  sortOrder?: number;
  imageUrl?: string;
  email?: string;
  instagram?: string;
  linkedin?: string;
};

type ArchivedOfficerTerm = {
  label: string;
  officers: Officer[];
};

export default function ArchivedOfficerSections({
  archivedTerms,
}: {
  archivedTerms: ArchivedOfficerTerm[];
}) {
  const [expandedTerm, setExpandedTerm] = useState<string | false>(false);

  if (archivedTerms.length === 0) return null;

  return (
    <Box sx={{ mt: 7 }}>
      <Stack spacing={1} sx={{ mb: 2.5, textAlign: "center", alignItems: "center" }}>
        <Typography
          variant="h4"
          sx={{
            color: "#fff",
            fontWeight: 900,
            textShadow: "0 2px 12px rgba(0,0,0,0.45)",
          }}
        >
          Past Cores
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.72)", maxWidth: 680 }}>
          Open a year to look back at previous ASU officer boards.
        </Typography>
      </Stack>

      <Stack spacing={1.8}>
        {archivedTerms.map((term) => (
          <Accordion
            key={term.label}
            disableGutters
            expanded={expandedTerm === term.label}
            onChange={(_, isExpanded) => setExpandedTerm(isExpanded ? term.label : false)}
            sx={{
              overflow: "hidden",
              border: "1px solid rgba(255, 215, 0, 0.22)",
              borderRadius: "8px !important",
              bgcolor: "rgba(255,255,255,0.055)",
              color: "#fff",
              boxShadow: "0 16px 36px rgba(0,0,0,0.24)",
              "&:before": { display: "none" },
              "&.Mui-expanded": {
                bgcolor: "rgba(54, 7, 10, 0.86)",
                borderColor: "rgba(255, 215, 0, 0.45)",
              },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: "var(--accent-color)" }} />}
              sx={{
                minHeight: 68,
                px: { xs: 2, sm: 3 },
                "& .MuiAccordionSummary-content": {
                  alignItems: "center",
                },
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 900, fontSize: { xs: "1.05rem", sm: "1.25rem" } }}>
                  {term.label}
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.62)", fontSize: "0.88rem" }}>
                  Archived officer board
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ px: { xs: 1, sm: 2 }, pb: 3, pt: 0 }}>
              {expandedTerm === term.label && <OfficerGrid officers={term.officers} />}
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>
    </Box>
  );
}
