// app/officers/page.tsx
import { Box, Typography } from "@mui/material";
import { supabase } from "../../lib/supabaseClient";
import ArchivedOfficerSections from "./ArchivedOfficerSections";
import OfficerGrid from "./OfficerGrid";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type OfficerRow = {
    id: string;
    name: string;
    role: string;
    major: string | null;
    year: string | null;
    bio: string | null;
    sort_order: number | null;
    image_url: string | null;
    email: string | null;
    instagram: string | null;
    linkedin: string | null;
    is_current: boolean | null;
    term_label: string | null;
    archived_at: string | null;
};

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

function toOfficer(row: OfficerRow): Officer {
    return {
        _id: row.id,
        name: row.name,
        role: row.role,
        major: row.major ?? undefined,
        year: row.year ?? undefined,
        bio: row.bio ?? undefined,
        sortOrder: row.sort_order ?? undefined,
        imageUrl: row.image_url ?? undefined,
        email: row.email ?? undefined,
        instagram: row.instagram ?? undefined,
        linkedin: row.linkedin ?? undefined,
    };
}

function getTermStartYear(label: string) {
    const match = label.match(/^(\d{4})/);
    return match ? Number(match[1]) : 0;
}

export default async function OfficersPage() {
    const { data: officerRows, error } = await supabase
        .from("officers")
        .select("*")
        .order("is_current", { ascending: false })
        .order("term_label", { ascending: false, nullsFirst: false })
        .order("sort_order", { ascending: true, nullsFirst: true })
        .order("role", { ascending: true })
        .order("name", { ascending: true });

    if (error) {
        console.error("Failed to load officers", error);
    }

    const currentOfficers: Officer[] = [];
    const archiveMap = new Map<string, Officer[]>();

    for (const row of (officerRows ?? []) as OfficerRow[]) {
        const officer = toOfficer(row);
        if (row.is_current !== false) {
            currentOfficers.push(officer);
            continue;
        }

        const termLabel = row.term_label?.trim() || "Archived Core";
        const termOfficers = archiveMap.get(termLabel) ?? [];
        termOfficers.push(officer);
        archiveMap.set(termLabel, termOfficers);
    }

    const archivedTerms: ArchivedOfficerTerm[] = Array.from(archiveMap.entries())
        .map(([label, officers]) => ({ label, officers }))
        .sort((a, b) => getTermStartYear(b.label) - getTermStartYear(a.label));

    return (
        <Box
            component="main"
            sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                mt: 2.5,
                mb: 10,
            }}
        >
            <Box sx={{ width: "90%", maxWidth: "1100px" }}>
                <Typography
                    variant="h3"
                    sx={{
                        mb: 2,
                        fontWeight: 700,
                        color: "var(--accent-color)",
                        textShadow: "0 2px 4px rgba(0,0,0,0.4)",
                        textAlign: "center",
                    }}
                >
                    Officer Board
                </Typography>

                <Typography
                    sx={{
                        mb: 4,
                        fontSize: "1.05rem",
                        color: "white",
                        opacity: 0.85,
                        maxWidth: "720px",
                        mx: "auto",
                        textAlign: "center",
                    }}
                >
                    Meet the people behind Asian Student Union. We are a bunch of students
                    who love building community, planning events, and making ASU feel like
                    a second home.
                </Typography>

                {currentOfficers.length === 0 ? (
                    <Typography sx={{ color: "#ddd", textAlign: "center" }}>
                        No current officers added yet. Check back soon for the latest core.
                    </Typography>
                ) : (
                    <OfficerGrid officers={currentOfficers} />
                )}

                <ArchivedOfficerSections archivedTerms={archivedTerms} />
            </Box>
        </Box>
    );
}
