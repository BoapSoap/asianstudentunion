// /sanity/lib/queries.ts
import { groq } from "next-sanity";

/* -----------------------------
   EVENTS — ALL EVENTS
------------------------------ */
export const allEventsQuery = groq`
  *[_type == "event"] | order(date asc) {
    _id,
    title,
    "slug": slug.current,
    date,
    time,
    location,
    featured,
    link,
    description,
    "imageUrl": image.asset->url
  }
`;

/* -----------------------------
   EVENTS — FEATURED EVENT ONLY
------------------------------ */
export const featuredEventQuery = groq`
  *[_type == "event" && featured == true] | order(date asc) [0] {
    _id,
    title,
    "slug": slug.current,
    date,
    time,
    location,
    featured,
    link,
    description,
    "imageUrl": image.asset->url
  }
`;

/* -----------------------------
   EVENTS — GET SINGLE EVENT
   (used for "Learn More" pages)
------------------------------ */
export const singleEventQuery = groq`
  *[_type == "event" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    date,
    time,
    location,
    featured,
    link,
    description,
    "imageUrl": image.asset->url
  }
`;

/* -----------------------------
   GALLERY ALBUMS
------------------------------ */
export const albumsQuery = groq`
  *[_type == "galleryAlbum"] | order(date desc, _createdAt desc) {
    _id,
    title,
    date,
    description,
    googlePhotosUrl,
    "coverImageUrl": coverImage.asset->url
  }
`;

/* -----------------------------
   OFFICERS
------------------------------ */
export const officersQuery = groq`
  *[_type == "officer"] | order(sortOrder asc, role asc, name asc) {
    _id,
    name,
    role,
    major,
    year,
    bio,
    sortOrder,
    email,
    instagram,
    "imageUrl": image.asset->url
  }
`;

/* -----------------------------
   HOME — CAROUSEL IMAGES
------------------------------ */
export const homeCarouselImagesQuery = groq`
  *[_type == "homeCarouselImage"] | order(sortOrder asc, _createdAt asc) {
    _id,
    sortOrder,
    alt,
    "imageUrl": image.asset->url
  }
`;
