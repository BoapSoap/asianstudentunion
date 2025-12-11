"use client";

import { Button } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FeaturedLearnMoreButton({ slug }: { slug: string }) {
    const router = useRouter();
    const href = `/events/${slug}`;

    return (
        <Button
            component={Link}
            href={href}
            className="featured-learn-more"
            onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                router.push(href);
            }}
            disableRipple
            disableFocusRipple
            disableElevation
            sx={{
                backgroundColor: "var(--accent-color)",
                color: "var(--primary-color)",
                fontWeight: 800,
                textTransform: "none",
                px: 2.5,
                py: 1,
                borderRadius: 999,
                position: "relative",
                zIndex: 4,
                pointerEvents: "auto",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                "&:hover": { backgroundColor: "#ffdc55" },
            }}
        >
            Learn More
        </Button>
    );
}
