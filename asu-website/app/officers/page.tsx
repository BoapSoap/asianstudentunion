// app/officers/page.tsx
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardMedia,
} from "@mui/material";
import { SocialIcon } from "react-social-icons";
import { client } from "../../sanity/lib/client";
import { officersQuery } from "../../sanity/lib/queries";

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
                mt: 6,
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
                    <Box
                        sx={{
                            display: "grid",
                            justifyContent: "center",
                            gridTemplateColumns: {
                                xs: "minmax(0, 320px)",
                                sm: "repeat(2, minmax(0, 320px))",
                                md: "repeat(3, minmax(0, 320px))",
                            },
                            gap: 3,
                            mx: "auto",
                        }}
                    >
                        {officers.map((officer) => {
                            const metaParts: string[] = [];
                            if (officer.major) metaParts.push(officer.major);
                            if (officer.year) metaParts.push(officer.year);
                            const metaLine = metaParts.join(" · ");

                            const instagramHandle = officer.instagram
                                ? officer.instagram.replace(/^@/, "")
                                : undefined;

                            const instagramUrl = instagramHandle
                                ? instagramHandle.startsWith("http")
                                    ? instagramHandle
                                    : `https://instagram.com/${instagramHandle}`
                                : undefined;

                            const hasContact = officer.email || instagramUrl;

                            return (
                                <Card
                                    key={officer._id}
                                    sx={{
                                        width: "100%",
                                        background: "rgba(255,255,255,0.16)",
                                        backdropFilter: "blur(12px)",
                                        borderRadius: "20px",
                                        overflow: "hidden",
                                        border: "1px solid rgba(255,255,255,0.35)",
                                        boxShadow: "0 10px 26px rgba(0,0,0,0.35)",
                                        color: "white",
                                        display: "flex",
                                        flexDirection: "column",
                                    }}
                                >
                                    {officer.imageUrl && (
                                        <CardMedia
                                            component="img"
                                            image={officer.imageUrl}
                                            alt={officer.name}
                                            sx={{
                                                width: "100%",
                                                height: "auto",
                                                objectFit: "cover",
                                                objectPosition: "center center",
                                            }}
                                        />
                                    )}

                                    <CardContent
                                        sx={{
                                            flex: 1,
                                            display: "flex",
                                            flexDirection: "column",
                                            pt: 2.5,
                                            pb: 3,
                                        }}
                                    >
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontWeight: 800,
                                                color: "var(--accent-color)",
                                                mb: 0.4,
                                            }}
                                        >
                                            {officer.name}
                                        </Typography>

                                        <Typography
                                            sx={{
                                                fontWeight: 600,
                                                mb: 1.2,
                                                opacity: 0.95,
                                            }}
                                        >
                                            {officer.role}
                                        </Typography>

                                        {officer.bio && (
                                            <Typography
                                                sx={{
                                                    mb: 1.8,
                                                    fontSize: "0.96rem",
                                                    lineHeight: 1.55,
                                                    opacity: 0.9,
                                                }}
                                            >
                                                {officer.bio}
                                            </Typography>
                                        )}

                                        <Box
                                            sx={{
                                                mt: "auto",
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                textAlign: "center",
                                                gap: 0.8,
                                            }}
                                        >
                                            {metaLine && (
                                                <Typography sx={{ fontSize: "0.9rem", opacity: 0.8 }}>
                                                    {metaLine}
                                                </Typography>
                                            )}

                                            {hasContact && (
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                        gap: 1.4,
                                                        mt: 0.5,
                                                    }}
                                                >
                                                    {officer.email && (
                                                        <SocialIcon
                                                            network="email"
                                                            url={`mailto:${officer.email}`}
                                                            style={{ height: 30, width: 30 }}
                                                            bgColor="var(--accent-color)"
                                                            fgColor="#1a1a1a"
                                                        />
                                                    )}

                                                    {instagramUrl && (
                                                        <SocialIcon
                                                            network="instagram"
                                                            url={instagramUrl}
                                                            style={{ height: 30, width: 30 }}
                                                            bgColor="var(--accent-color)"
                                                            fgColor="#1a1a1a"
                                                        />
                                                    )}
                                                </Box>
                                            )}

                                            {officer.email && (
                                                <Typography
                                                    sx={{
                                                        fontSize: "0.86rem",
                                                        opacity: 0.9,
                                                        wordBreak: "break-all",
                                                    }}
                                                >
                                                    {officer.email}
                                                </Typography>
                                            )}
                                        </Box>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Box>
                )}
            </Box>
        </Box>
    );
}
