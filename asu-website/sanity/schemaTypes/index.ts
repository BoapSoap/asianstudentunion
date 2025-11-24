// /sanity/schemaTypes/index.ts

import eventType from "./eventType";
import officerType from "./officerType";
import galleryAlbumType from "./galleryAlbumType";
import historySectionType from "./historySectionType";
import homeCarouselImageType from "./homeCarouselImageType";

export const schemaTypes = [
    eventType,
    officerType,
    galleryAlbumType,
    historySectionType,
    homeCarouselImageType,

];

// This is what sanity.config.ts is importing:
export const schema = {
    types: schemaTypes,
};
