// app/officers/page.tsx
import { Box, Typography } from "@mui/material";
import { supabase } from "../../lib/supabaseClient";
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

export default async function OfficersPage() {
    const { data: officerRows, error } = await supabase
        .from("officers")
        .select("*")
        .order("sort_order", { ascending: true, nullsFirst: true })
        .order("role", { ascending: true })
        .order("name", { ascending: true });

    if (error) {
        console.error("Failed to load officers", error);
    }

    const officers: Officer[] = (officerRows ?? []).map((row: OfficerRow) => ({
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
    }));

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

                {officers.length === 0 ? (
                    <Typography sx={{ color: "#ddd", textAlign: "center" }}>
                        No officers added yet. Add some &quot;officer&quot; documents in
                        Sanity Studio to show them here.
                    </Typography>
                ) : (
                    <OfficerGrid officers={officers} />
                )}
            </Box>
        </Box>
    );
}
