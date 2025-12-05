// app/officers/page.tsx
import { Box, Typography } from "@mui/material";
import { client } from "../../sanity/lib/client";
import { officersQuery } from "../../sanity/lib/queries";
import OfficerGrid from "./OfficerGrid";

export const revalidate = 0;
export const dynamic = "force-dynamic";

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
    const officers = await client.fetch<Officer[]>(
        officersQuery,
        {},
        { cache: "no-store" }
    );

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
