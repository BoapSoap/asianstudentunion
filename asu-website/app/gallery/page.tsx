// app/gallery/page.tsx
import { supabase } from "../../lib/supabaseClient";
import GalleryClient from "./GalleryClient";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type AlbumRow = {
    id: string;
    title: string;
    date: string | null;
    description: string | null;
    google_photos_url: string;
    cover_image_url: string;
};

type Album = {
    _id: string;
    title: string;
    date?: string;
    description?: string;
    googlePhotosUrl: string;
    coverImageUrl?: string;
};

export default async function GalleryPage() {
    const { data: albumRows, error } = await supabase
        .from("gallery_albums")
        .select("*")
        .order("date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Failed to load gallery albums", error);
    }

    const albums: Album[] = (albumRows ?? []).map((row: AlbumRow) => ({
        _id: row.id,
        title: row.title,
        date: row.date ?? undefined,
        description: row.description ?? undefined,
        googlePhotosUrl: row.google_photos_url,
        coverImageUrl: row.cover_image_url,
    }));

    return <GalleryClient albums={albums} />;
}
