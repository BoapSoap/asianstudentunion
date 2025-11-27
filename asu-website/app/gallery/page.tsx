// app/gallery/page.tsx
import { client } from "../../sanity/lib/client";
import { albumsQuery } from "../../sanity/lib/queries";
import GalleryClient from "./GalleryClient";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type Album = {
    _id: string;
    title: string;
    date?: string;
    description?: string;
    googlePhotosUrl: string;
    coverImageUrl?: string;
};

export default async function GalleryPage() {
    const albums = await client.fetch<Album[]>(
        albumsQuery,
        {},
        { cache: "no-store" }
    );

    return <GalleryClient albums={albums} />;
}
