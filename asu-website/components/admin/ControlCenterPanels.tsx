"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import ClientToaster from "@/components/admin/ClientToaster";
import FileDropField from "@/components/admin/FileDropField";
import TogglePanel from "@/components/admin/TogglePanel";
import { formatUtcIsoInPacific, utcIsoToPacificDateTimeInput } from "@/lib/pacificTime";
import { slugifyTitle } from "@/lib/slugify";
import type { SocialLink } from "@/lib/socialLinks";

type PortableTextChild = { text?: string };
type PortableTextBlock = { children?: PortableTextChild[] };

type EventSummary = {
  id: string;
  title: string;
  date: string | null;
  time: string | null;
  display_until: string | null;
  location: string | null;
  link: string | null;
  slug: string | null;
  description: PortableTextBlock[] | null;
  image_url: string | null;
  featured: boolean;
};

type EventFormState = {
  id: string;
  title: string;
  date: string;
  time: string;
  displayUntil: string;
  location: string;
  link: string;
  description: string;
  imageUrl: string;
  featured: boolean;
};

const EMPTY_EVENT_FORM: EventFormState = {
  id: "",
  title: "",
  date: "",
  time: "",
  displayUntil: "",
  location: "",
  link: "",
  description: "",
  imageUrl: "",
  featured: false,
};

function blocksToPlainText(blocks: PortableTextBlock[] | null | undefined) {
  if (!blocks) return "";
  return (
    blocks
      .map((block) =>
        (block?.children ?? [])
          .map((child: PortableTextChild) => child?.text ?? "")
          .join("")
          .trim()
      )
      .filter((text) => text.length > 0)
      .join("\n\n")
  );
}

type OfficerSummary = {
  id: string;
  name: string;
  role: string;
  sort_order: number | null;
  bio: string | null;
  image_url: string | null;
  email: string | null;
  instagram: string | null;
  linkedin: string | null;
  major?: string | null;
  year?: string | null;
  is_current?: boolean | null;
  term_label?: string | null;
};

type OfficerFormState = {
  id: string;
  name: string;
  role: string;
  bio: string;
  email: string;
  instagram: string;
  linkedin: string;
  major: string;
  year: string;
  imageUrl: string;
  sortOrder: string;
};

const EMPTY_OFFICER_FORM: OfficerFormState = {
  id: "",
  name: "",
  role: "",
  bio: "",
  email: "",
  instagram: "",
  linkedin: "",
  major: "",
  year: "",
  imageUrl: "",
  sortOrder: "",
};

type AlbumSummary = {
  id: string;
  title: string;
  date: string | null;
  google_photos_url: string | null;
  cover_image_url: string | null;
};

type CarouselSummary = {
  id: string;
  alt: string | null;
  sort_order: number | null;
  image_url: string | null;
};

type AlbumFormState = {
  id: string;
  title: string;
  date: string;
  googlePhotosUrl: string;
  coverImageUrl: string;
};

type CarouselFormState = {
  id: string;
  alt: string;
  sortOrder: string;
  imageUrl: string;
};

type SocialLinkFormState = {
  id: string;
  label: string;
  url: string;
  iconUrl: string;
  sortOrder: string;
  isActive: boolean;
};

const EMPTY_ALBUM_FORM: AlbumFormState = {
  id: "",
  title: "",
  date: "",
  googlePhotosUrl: "",
  coverImageUrl: "",
};

const EMPTY_CAROUSEL_FORM: CarouselFormState = {
  id: "",
  alt: "",
  sortOrder: "",
  imageUrl: "",
};

const EMPTY_SOCIAL_LINK_FORM: SocialLinkFormState = {
  id: "",
  label: "",
  url: "",
  iconUrl: "",
  sortOrder: "",
  isActive: true,
};

type ApiErrorPayload = {
  error?: unknown;
  message?: unknown;
  code?: unknown;
  details?: unknown;
  hint?: unknown;
};

function getApiErrorText(payload: ApiErrorPayload, fallback: string) {
  const toText = (value: unknown) => (typeof value === "string" ? value.trim() : "");
  const error = toText(payload.error) || fallback;
  const message = toText(payload.message);
  const code = toText(payload.code);
  const details = toText(payload.details);
  const hint = toText(payload.hint);

  let text = error;
  if (message && message !== error) text += `: ${message}`;
  if (code) text += ` [${code}]`;
  if (details && details !== message) text += ` Details: ${details}`;
  if (hint) text += ` Hint: ${hint}`;

  return text;
}

export default function ControlCenterPanels({
  events,
  officers,
  albums,
  carousel,
  socialLinks,
  canArchiveOfficers = false,
}: {
  events: EventSummary[];
  officers: OfficerSummary[];
  albums: AlbumSummary[];
  carousel: CarouselSummary[];
  socialLinks: SocialLink[];
  canArchiveOfficers?: boolean;
}) {
  const router = useRouter();
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id ?? "new");
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>(albums[0]?.id ?? "new");
  const [selectedSlideId, setSelectedSlideId] = useState<string>(carousel[0]?.id ?? "new");
  const [selectedSocialId, setSelectedSocialId] = useState<string>(socialLinks[0]?.id ?? "new");
  const [eventForm, setEventForm] = useState<EventFormState>(
    events[0]
      ? {
          id: events[0].id,
          title: events[0].title ?? "",
          date: events[0].date ?? "",
          time: events[0].time ?? "",
          displayUntil: utcIsoToPacificDateTimeInput(events[0].display_until),
          location: events[0].location ?? "",
          link: events[0].link ?? "",
          description: blocksToPlainText(events[0].description),
          imageUrl: events[0].image_url ?? "",
          featured: !!events[0].featured,
        }
      : EMPTY_EVENT_FORM
  );
  const [savingEvent, setSavingEvent] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [eventImageRemote, setEventImageRemote] = useState<string | null>(null);
  const [albumForm, setAlbumForm] = useState<AlbumFormState>(
    albums[0]
      ? {
          id: albums[0].id,
          title: albums[0].title ?? "",
          date: albums[0].date ?? "",
          googlePhotosUrl: albums[0].google_photos_url ?? "",
          coverImageUrl: albums[0].cover_image_url ?? "",
        }
      : EMPTY_ALBUM_FORM
  );
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>(officers[0]?.id ?? "new");
  const [officerForm, setOfficerForm] = useState<OfficerFormState>(
    officers[0]
      ? {
          id: officers[0].id,
          name: officers[0].name ?? "",
          role: officers[0].role ?? "",
          bio: officers[0].bio ?? "",
          email: officers[0].email ?? "",
          instagram: officers[0].instagram ?? "",
          linkedin: officers[0].linkedin ?? "",
          major: officers[0].major ?? "",
          year: officers[0].year ?? "",
          imageUrl: officers[0].image_url ?? "",
          sortOrder: officers[0].sort_order != null ? String(officers[0].sort_order) : "",
        }
      : EMPTY_OFFICER_FORM
  );
  const [savingOfficer, setSavingOfficer] = useState(false);
  const [deletingOfficer, setDeletingOfficer] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archiveTerm, setArchiveTerm] = useState("");
  const [archiveUnderstood, setArchiveUnderstood] = useState(false);
  const [archivingOfficers, setArchivingOfficers] = useState(false);
  const [officerImageFile, setOfficerImageFile] = useState<File | null>(null);
  const [officerImageRemote, setOfficerImageRemote] = useState<string | null>(null);
  const [savingAlbum, setSavingAlbum] = useState(false);
  const [deletingAlbum, setDeletingAlbum] = useState(false);
  const [albumImageFile, setAlbumImageFile] = useState<File | null>(null);
  const [albumImageRemote, setAlbumImageRemote] = useState<string | null>(null);
  const [carouselForm, setCarouselForm] = useState<CarouselFormState>(
    carousel[0]
      ? {
          id: carousel[0].id,
          alt: carousel[0].alt ?? "",
          sortOrder: carousel[0].sort_order != null ? String(carousel[0].sort_order) : "",
          imageUrl: carousel[0].image_url ?? "",
        }
      : EMPTY_CAROUSEL_FORM
  );
  const [savingCarousel, setSavingCarousel] = useState(false);
  const [deletingCarousel, setDeletingCarousel] = useState(false);
  const [carouselImageFile, setCarouselImageFile] = useState<File | null>(null);
  const [carouselImageRemote, setCarouselImageRemote] = useState<string | null>(null);
  const [socialForm, setSocialForm] = useState<SocialLinkFormState>(
    socialLinks[0]
      ? {
          id: socialLinks[0].id,
          label: socialLinks[0].label ?? "",
          url: socialLinks[0].url ?? "",
          iconUrl: socialLinks[0].icon_url ?? "",
          sortOrder: socialLinks[0].sort_order != null ? String(socialLinks[0].sort_order) : "",
          isActive: socialLinks[0].is_active !== false,
        }
      : EMPTY_SOCIAL_LINK_FORM
  );
  const [savingSocial, setSavingSocial] = useState(false);
  const [deletingSocial, setDeletingSocial] = useState(false);
  const [socialIconFile, setSocialIconFile] = useState<File | null>(null);
  const [socialIconRemote, setSocialIconRemote] = useState<string | null>(socialLinks[0]?.icon_url ?? null);

  useEffect(() => {
    if (selectedOfficerId !== "new" && !officers.some((o) => o.id === selectedOfficerId)) {
      setSelectedOfficerId(officers[0]?.id ?? "new");
    }
  }, [officers, selectedOfficerId]);

  useEffect(() => {
    if (selectedAlbumId !== "new" && !albums.some((a) => a.id === selectedAlbumId)) {
      setSelectedAlbumId(albums[0]?.id ?? "new");
    }
  }, [albums, selectedAlbumId]);

  useEffect(() => {
    if (selectedSlideId !== "new" && !carousel.some((s) => s.id === selectedSlideId)) {
      setSelectedSlideId(carousel[0]?.id ?? "new");
    }
  }, [carousel, selectedSlideId]);

  useEffect(() => {
    if (selectedSocialId !== "new" && !socialLinks.some((link) => link.id === selectedSocialId)) {
      setSelectedSocialId(socialLinks[0]?.id ?? "new");
    }
  }, [socialLinks, selectedSocialId]);

  useEffect(() => {
    const selected = events.find((evt) => evt.id === selectedEventId);
    if (selected) {
      setEventForm({
        id: selected.id,
        title: selected.title ?? "",
        date: selected.date ?? "",
        time: selected.time ?? "",
        displayUntil: utcIsoToPacificDateTimeInput(selected.display_until),
        location: selected.location ?? "",
        link: selected.link ?? "",
        description: blocksToPlainText(selected.description),
        imageUrl: selected.image_url ?? "",
        featured: !!selected.featured,
      });
      setEventImageFile(null);
      setEventImageRemote(selected.image_url ?? null);
      return;
    }

    if (selectedEventId === "new") {
      setEventForm({ ...EMPTY_EVENT_FORM });
      setEventImageFile(null);
      setEventImageRemote(null);
    }
  }, [selectedEventId, events]);

  const slugPreview = useMemo(
    () => (eventForm.title ? slugifyTitle(eventForm.title) : "event"),
    [eventForm.title]
  );

  const isoDateValue = useMemo(() => {
    const trimmed = eventForm.date.trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : "";
  }, [eventForm.date]);

  useEffect(() => {
    const selected = officers.find((officer) => officer.id === selectedOfficerId);
    if (selected) {
      setOfficerForm({
        id: selected.id,
        name: selected.name ?? "",
        role: selected.role ?? "",
        bio: selected.bio ?? "",
        email: selected.email ?? "",
        instagram: selected.instagram ?? "",
        linkedin: selected.linkedin ?? "",
        major: selected.major ?? "",
        year: selected.year ?? "",
        imageUrl: selected.image_url ?? "",
        sortOrder: selected.sort_order != null ? String(selected.sort_order) : "",
      });
      setOfficerImageFile(null);
      setOfficerImageRemote(selected.image_url ?? null);
      return;
    }

    if (selectedOfficerId === "new") {
      setOfficerForm({ ...EMPTY_OFFICER_FORM });
      setOfficerImageFile(null);
      setOfficerImageRemote(null);
    }
  }, [selectedOfficerId, officers]);

  useEffect(() => {
    const selected = albums.find((album) => album.id === selectedAlbumId);
    if (selected) {
      setAlbumForm({
        id: selected.id,
        title: selected.title ?? "",
        date: selected.date ?? "",
        googlePhotosUrl: selected.google_photos_url ?? "",
        coverImageUrl: selected.cover_image_url ?? "",
      });
      setAlbumImageFile(null);
      setAlbumImageRemote(selected.cover_image_url ?? null);
      return;
    }

    if (selectedAlbumId === "new") {
      setAlbumForm({ ...EMPTY_ALBUM_FORM });
      setAlbumImageFile(null);
      setAlbumImageRemote(null);
    }
  }, [selectedAlbumId, albums]);

  useEffect(() => {
    const selected = carousel.find((slide) => slide.id === selectedSlideId);
    if (selected) {
      setCarouselForm({
        id: selected.id,
        alt: selected.alt ?? "",
        sortOrder: selected.sort_order != null ? String(selected.sort_order) : "",
        imageUrl: selected.image_url ?? "",
      });
      setCarouselImageFile(null);
      setCarouselImageRemote(selected.image_url ?? null);
      return;
    }

    if (selectedSlideId === "new") {
      setCarouselForm({ ...EMPTY_CAROUSEL_FORM });
      setCarouselImageFile(null);
      setCarouselImageRemote(null);
    }
  }, [selectedSlideId, carousel]);

  useEffect(() => {
    const selected = socialLinks.find((link) => link.id === selectedSocialId);
    if (selected) {
      setSocialForm({
        id: selected.id,
        label: selected.label ?? "",
        url: selected.url ?? "",
        iconUrl: selected.icon_url ?? "",
        sortOrder: selected.sort_order != null ? String(selected.sort_order) : "",
        isActive: selected.is_active !== false,
      });
      setSocialIconFile(null);
      setSocialIconRemote(selected.icon_url ?? null);
      return;
    }

    if (selectedSocialId === "new") {
      setSocialForm({ ...EMPTY_SOCIAL_LINK_FORM });
      setSocialIconFile(null);
      setSocialIconRemote(null);
    }
  }, [selectedSocialId, socialLinks]);

  const uploadImage = async (file: File, folder: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(getApiErrorText(data, "Image upload failed"));
    }
    return data.publicUrl as string;
  };

  const handleSocialSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingSocial(true);

    const sortOrderNumber =
      socialForm.sortOrder.trim() === "" ? null : Number(socialForm.sortOrder.trim());
    const parsedSortOrder = Number.isFinite(sortOrderNumber) ? sortOrderNumber : null;

    try {
      let iconUrl = socialForm.iconUrl?.trim() || null;
      if (socialIconRemote) iconUrl = socialIconRemote;
      if (socialIconFile) {
        iconUrl = await uploadImage(socialIconFile, "social-links");
        setSocialIconFile(null);
        setSocialIconRemote(iconUrl);
      }

      const res = await fetch("/api/admin/social-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: socialForm.id || undefined,
          label: socialForm.label,
          url: socialForm.url,
          iconUrl,
          sortOrder: parsedSortOrder,
          isActive: socialForm.isActive,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(getApiErrorText(data, "Failed to save social link"));
      }

      toast.success(socialForm.id ? "Social link updated" : "Social link created");

      if (data.link?.id) {
        setSelectedSocialId(data.link.id as string);
        setSocialForm((prev) => ({ ...prev, id: data.link.id as string, iconUrl: iconUrl ?? "" }));
      }

      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message);
    } finally {
      setSavingSocial(false);
    }
  };

  const handleSocialDelete = async () => {
    if (!socialForm.id) return;
    const confirm = window.confirm("Delete this social link? This removes it from the social bar.");
    if (!confirm) return;
    setDeletingSocial(true);
    try {
      const res = await fetch("/api/admin/social-links", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: socialForm.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getApiErrorText(data, "Failed to delete social link"));
      toast.success("Social link deleted");
      setSelectedSocialId(socialLinks[0]?.id && socialLinks[0].id !== socialForm.id ? socialLinks[0].id : "new");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message);
    } finally {
      setDeletingSocial(false);
    }
  };

  const handleEventSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingEvent(true);

    try {
      let imageUrl = eventForm.imageUrl?.trim() || null;
      if (eventImageRemote) imageUrl = eventImageRemote;
      if (eventImageFile) {
        imageUrl = await uploadImage(eventImageFile, "events");
        setEventImageFile(null);
        setEventImageRemote(imageUrl);
      }

      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: eventForm.id || undefined,
          title: eventForm.title,
          date: eventForm.date || null,
          time: eventForm.time || null,
          displayUntil: eventForm.displayUntil || null,
          location: eventForm.location || null,
          link: eventForm.link || null,
          description: eventForm.description || null,
          imageUrl,
          featured: eventForm.featured,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(getApiErrorText(data, "Failed to save event"));
      }

      toast.success(eventForm.id ? "Event updated" : "Event created");

      if (data.event?.id) {
        setSelectedEventId(data.event.id as string);
        setEventForm((prev) => ({ ...prev, id: data.event.id as string, imageUrl: imageUrl ?? "" }));
      }

      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message);
    } finally {
      setSavingEvent(false);
    }
  };

  const handleEventDelete = async () => {
    if (!eventForm.id) return;
    const confirm = window.confirm("Delete this event? This cannot be undone.");
    if (!confirm) return;
    setDeletingEvent(true);
    try {
      const res = await fetch("/api/admin/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: eventForm.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getApiErrorText(data, "Failed to delete event"));
      toast.success("Event deleted");
      setSelectedEventId(events[0]?.id && events[0].id !== eventForm.id ? events[0].id : "new");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message);
    } finally {
      setDeletingEvent(false);
    }
  };

  const handleOfficerSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingOfficer(true);

    const sortOrderNumber =
      officerForm.sortOrder.trim() === "" ? null : Number(officerForm.sortOrder.trim());
    const parsedSortOrder = Number.isFinite(sortOrderNumber) ? sortOrderNumber : null;

    try {
      let imageUrl = officerForm.imageUrl?.trim() || null;
      if (officerImageRemote) imageUrl = officerImageRemote;
      if (officerImageFile) {
        imageUrl = await uploadImage(officerImageFile, "officers");
        setOfficerImageFile(null);
        setOfficerImageRemote(imageUrl);
      }

      const res = await fetch("/api/admin/officers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: officerForm.id || undefined,
          name: officerForm.name,
          role: officerForm.role,
          bio: officerForm.bio || null,
          email: officerForm.email,
          instagram: officerForm.instagram || null,
          linkedin: officerForm.linkedin || null,
          major: officerForm.major || null,
          year: officerForm.year || null,
          imageUrl,
          sortOrder: parsedSortOrder,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(getApiErrorText(data, "Failed to save officer"));
      }

      toast.success(officerForm.id ? "Officer updated" : "Officer created");

      if (data.officer?.id) {
        setSelectedOfficerId(data.officer.id as string);
        setOfficerForm((prev) => ({ ...prev, id: data.officer.id as string, imageUrl: imageUrl ?? "" }));
      }

      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message);
    } finally {
      setSavingOfficer(false);
    }
  };

  const handleOfficerDelete = async () => {
    if (!officerForm.id) return;
    const confirm = window.confirm("Delete this officer? This cannot be undone.");
    if (!confirm) return;
    setDeletingOfficer(true);
    try {
      const res = await fetch("/api/admin/officers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: officerForm.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getApiErrorText(data, "Failed to delete officer"));
      toast.success("Officer deleted");
      setSelectedOfficerId(officers[0]?.id && officers[0].id !== officerForm.id ? officers[0].id : "new");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message);
    } finally {
      setDeletingOfficer(false);
    }
  };

  const handleArchiveOfficers = async () => {
    const termLabel = archiveTerm.trim();
    if (!termLabel || !archiveUnderstood) return;

    setArchivingOfficers(true);
    try {
      const res = await fetch("/api/admin/officers/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termLabel, understood: archiveUnderstood }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(getApiErrorText(data, "Failed to archive current core"));
      }

      toast.success(`Archived ${data.archived ?? officers.length} officers as ${data.termLabel ?? termLabel}`);
      setArchiveDialogOpen(false);
      setArchiveTerm("");
      setArchiveUnderstood(false);
      setSelectedOfficerId("new");
      setOfficerForm({ ...EMPTY_OFFICER_FORM });
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message);
    } finally {
      setArchivingOfficers(false);
    }
  };

  const handleAlbumSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingAlbum(true);

    try {
      let coverImageUrl = albumForm.coverImageUrl?.trim() || null;
      if (albumImageRemote) coverImageUrl = albumImageRemote;
      if (albumImageFile) {
        coverImageUrl = await uploadImage(albumImageFile, "gallery");
        setAlbumImageFile(null);
        setAlbumImageRemote(coverImageUrl);
      }

      const res = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: albumForm.id || undefined,
          title: albumForm.title,
          date: albumForm.date || null,
          googlePhotosUrl: albumForm.googlePhotosUrl,
          coverImageUrl,
          description: null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(getApiErrorText(data, "Failed to save album"));
      }

      toast.success(albumForm.id ? "Album updated" : "Album created");

      if (data.album?.id) {
        setSelectedAlbumId(data.album.id as string);
        setAlbumForm((prev) => ({ ...prev, id: data.album.id as string, coverImageUrl: coverImageUrl ?? "" }));
      }

      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message);
    } finally {
      setSavingAlbum(false);
    }
  };

  const handleAlbumDelete = async () => {
    if (!albumForm.id) return;
    const confirm = window.confirm("Delete this album? This cannot be undone.");
    if (!confirm) return;
    setDeletingAlbum(true);
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: albumForm.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getApiErrorText(data, "Failed to delete album"));
      toast.success("Album deleted");
      setSelectedAlbumId(albums[0]?.id && albums[0].id !== albumForm.id ? albums[0].id : "new");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message);
    } finally {
      setDeletingAlbum(false);
    }
  };

  const handleCarouselSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSavingCarousel(true);

    const sortOrderNumber =
      carouselForm.sortOrder.trim() === "" ? null : Number(carouselForm.sortOrder.trim());
    const parsedSortOrder = Number.isFinite(sortOrderNumber) ? sortOrderNumber : null;

    try {
      let imageUrl = carouselForm.imageUrl?.trim() || null;
      if (carouselImageRemote) imageUrl = carouselImageRemote;
      if (carouselImageFile) {
        imageUrl = await uploadImage(carouselImageFile, "carousel");
        setCarouselImageFile(null);
        setCarouselImageRemote(imageUrl);
      }

      const res = await fetch("/api/admin/carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: carouselForm.id || undefined,
          alt: carouselForm.alt,
          sortOrder: parsedSortOrder,
          imageUrl,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(getApiErrorText(data, "Failed to save slide"));
      }

      toast.success(carouselForm.id ? "Slide updated" : "Slide created");

      if (data.slide?.id) {
        setSelectedSlideId(data.slide.id as string);
        setCarouselForm((prev) => ({ ...prev, id: data.slide.id as string, imageUrl: imageUrl ?? "" }));
      }

      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message);
    } finally {
      setSavingCarousel(false);
    }
  };

  const handleCarouselDelete = async () => {
    if (!carouselForm.id) return;
    const confirm = window.confirm("Delete this slide? This cannot be undone.");
    if (!confirm) return;
    setDeletingCarousel(true);
    try {
      const res = await fetch("/api/admin/carousel", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: carouselForm.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getApiErrorText(data, "Failed to delete slide"));
      toast.success("Slide deleted");
      setSelectedSlideId(carousel[0]?.id && carousel[0].id !== carouselForm.id ? carousel[0].id : "new");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message);
    } finally {
      setDeletingCarousel(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <ClientToaster />

      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 shadow-2xl backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/80">Content Controls</p>
        <div className="mt-1 text-sm text-white/70">
          <p>Use these panels to manage what shows on the site:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-white/70">
            <li><span className="text-white">Events:</span> Add details, dates/times, links, images, and choose a featured event.</li>
            <li><span className="text-white">Officers:</span> Update names, roles, ASU emails, socials, and headshots.</li>
            <li><span className="text-white">Gallery:</span> Link Google Photos albums, set dates, and upload cover images.</li>
            <li><span className="text-white">Home Carousel:</span> Set slide title/alt text, order, and hero images.</li>
            <li><span className="text-white">Social Bar:</span> Edit global social links, optional custom thumbnails, and visibility.</li>
          </ul>
        </div>
      </div>

      <TogglePanel label="Manage Events">
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-white">Current events</p>
            {events.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedEventId("new")}
                className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/15"
              >
                + New event
              </button>
            )}
          </div>
          {events.length === 0 ? (
            <p className="mt-1 text-white/70">No events yet.</p>
          ) : (
            <ul className="mt-2 divide-y divide-white/10 border-t border-white/10">
              {events.map((event) => (
                <li key={event.id} className="flex items-center justify-between gap-3 bg-white/5 px-3 py-2">
                  <div>
                    <p className="font-semibold text-white">{event.title}</p>
                    <p className="text-xs text-white/70">
                      {event.date ?? "No date"} {event.time ? `• ${event.time}` : ""}{" "}
                      {event.location ? `• ${event.location}` : ""}
                    </p>
                    {event.display_until && (
                      <p className="text-[11px] text-white/60">
                        Hides from homepage: {formatUtcIsoInPacific(event.display_until)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {event.featured && (
                      <span className="rounded-full bg-amber-400/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-100">
                        Featured
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedEventId(event.id)}
                      className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-[12px] font-semibold text-white transition hover:border-amber-200/60 hover:bg-amber-400/10"
                    >
                      Edit
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <form id="events-form" className="flex flex-col gap-4" onSubmit={handleEventSubmit}>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-white/70">
              Editing
              <select
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-amber-200/70"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
              >
                <option value="new">Create new event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    Edit: {event.title}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-white/60">
              Slug auto-generates from the title:{" "}
              <span className="font-mono text-[12px] text-amber-100">{slugPreview}</span>
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-white/80">
              Event title
              <input
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-200/70"
                name="event_title"
                placeholder="Spring Social"
                value={eventForm.title}
                onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/80">
              Date
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <input
                  className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-200/70"
                  name="event_date"
                  placeholder="2024-11-01 or Anytime"
                  value={eventForm.date}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, date: e.target.value }))}
                />
                <input
                  type="date"
                  className="min-w-[170px] rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-200/70"
                  value={isoDateValue}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, date: e.target.value }))}
                  aria-label="Pick date"
                />
              </div>
              <span className="text-xs text-white/60">
                Use the picker (mobile shows a date wheel) or type any free-form date.
              </span>
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/80">
              Time
              <input
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-200/70"
                name="event_time"
                placeholder="7:00 PM - 9:00 PM"
                value={eventForm.time}
                onChange={(e) => setEventForm((prev) => ({ ...prev, time: e.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/80">
              Hide from homepage after (California PT)
              <input
                type="datetime-local"
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-200/70"
                name="event_display_until"
                value={eventForm.displayUntil}
                onChange={(e) => setEventForm((prev) => ({ ...prev, displayUntil: e.target.value }))}
              />
              <span className="text-xs text-white/60">
                Optional. This always uses America/Los_Angeles time and auto-removes the event from the front page.
              </span>
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/80">
              Location
              <input
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-200/70"
                name="event_location"
                placeholder="Student Center Ballroom"
                value={eventForm.location}
                onChange={(e) => setEventForm((prev) => ({ ...prev, location: e.target.value }))}
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm text-white/80">
            External link (RSVP / tickets)
            <input
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-200/70"
              name="event_link"
              placeholder="https://"
              value={eventForm.link}
          onChange={(e) => setEventForm((prev) => ({ ...prev, link: e.target.value }))}
            />
          </label>
          <FileDropField
            label="Flyer / hero image"
            name="event_image"
            helperText="Drag an image or click to upload. Dragging a URL also works."
            initialPreview={eventForm.imageUrl || undefined}
            onSelect={({ file, remoteUrl }) => {
              setEventImageFile(file ?? null);
              setEventImageRemote(remoteUrl ?? null);
              setEventForm((prev) => ({ ...prev, imageUrl: remoteUrl ?? prev.imageUrl }));
            }}
          />
          <label className="flex flex-col gap-2 text-sm text-white/80">
            Short description
            <textarea
              className="min-h-[120px] rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-200/70"
              name="event_description"
              placeholder="Add details, agenda, or special notes."
              value={eventForm.description}
              onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-white">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/30 bg-white/5 text-amber-300 focus:ring-amber-200"
              checked={eventForm.featured}
              onChange={(e) => setEventForm((prev) => ({ ...prev, featured: e.target.checked }))}
            />
            <span>Pin as featured event</span>
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-white/60">
              {eventForm.id ? "Updating existing event" : "Creating a new event"}
            </p>
            <div className="flex flex-wrap gap-2">
              {eventForm.id && (
                <button
                  type="button"
                  onClick={handleEventDelete}
                  disabled={deletingEvent}
                  className="inline-flex items-center rounded-lg border border-red-400/70 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingEvent ? "Deleting..." : "Delete"}
                </button>
              )}
              <button
                type="submit"
                disabled={savingEvent || !eventForm.title.trim()}
                className="inline-flex items-center rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.01] hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingEvent ? "Saving..." : eventForm.id ? "Update event" : "Create event"}
              </button>
            </div>
          </div>
        </form>
      </TogglePanel>

      <TogglePanel label="Manage Officers">
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-white">Current officers</p>
              <p className="text-xs text-white/60">
                These are shown as the latest core on the public Officers page.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canArchiveOfficers && officers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setArchiveDialogOpen(true)}
                  className="rounded-md border border-red-300/60 bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-100 transition hover:border-red-200 hover:bg-red-500/25"
                >
                  Archive Current Core
                </button>
              )}
              {officers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedOfficerId("new")}
                  className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/15"
                >
                  + New officer
                </button>
              )}
            </div>
          </div>
          {officers.length === 0 ? (
            <p className="mt-3 text-white/70">No current officers yet.</p>
          ) : (
            <ul className="mt-2 divide-y divide-white/10 border-t border-white/10">
              {officers.map((officer) => (
                <li key={officer.id} className="flex items-center justify-between gap-3 bg-white/5 px-3 py-2">
                  <div>
                    <p className="font-semibold text-white">{officer.name}</p>
                    <p className="text-xs text-white/70">
                      {officer.role}{" "}
                      {officer.sort_order != null ? `• order ${officer.sort_order}` : ""}{" "}
                      {officer.email ? `• ${officer.email}` : ""}
                    </p>
                    {(officer.instagram || officer.linkedin) && (
                      <p className="text-[11px] text-white/60">
                        {[officer.instagram, officer.linkedin].filter(Boolean).join(" • ")}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedOfficerId(officer.id)}
                    className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-[12px] font-semibold text-white transition hover:border-amber-200/60 hover:bg-amber-400/10"
                  >
                    Edit
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {archiveDialogOpen && (
          <div className="fixed inset-0 z-[1300] grid place-items-center bg-black/70 px-4 py-8">
            <div className="w-full max-w-xl rounded-xl border border-red-300/40 bg-[#220406] p-5 text-white shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-200">
                    Admin archive action
                  </p>
                  <h3 className="mt-1 text-xl font-black text-white">Archive Current Core</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!archivingOfficers) setArchiveDialogOpen(false);
                  }}
                  className="rounded-md border border-white/15 px-2.5 py-1 text-sm font-semibold text-white/75 hover:bg-white/10"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 rounded-lg border border-red-300/30 bg-red-950/45 p-4">
                <p className="font-bold text-red-100">Read this before continuing.</p>
                <p className="mt-2 text-sm leading-6 text-red-50/85">
                  This will move every current officer into the archive and clear the current officers section.
                  They will no longer appear as the latest core. The archived group will show below the latest core
                  on the public Officers page. Only do this when you are ready to add the next core.
                </p>
              </div>

              <label className="mt-4 flex flex-col gap-2 text-sm text-white/80">
                Archive school year
                <input
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-red-200/80"
                  placeholder="2025-2026"
                  value={archiveTerm}
                  onChange={(e) => setArchiveTerm(e.target.value)}
                  disabled={archivingOfficers}
                />
                <span className="text-xs text-white/55">Use the format 2025-2026. The site will save it as 2025-2026 Core.</span>
              </label>

              <label className="mt-4 flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/85">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-white/30 bg-white/10 text-red-300 focus:ring-red-200"
                  checked={archiveUnderstood}
                  onChange={(e) => setArchiveUnderstood(e.target.checked)}
                  disabled={archivingOfficers}
                />
                <span>I understand this will archive and clear the current core.</span>
              </label>

              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setArchiveDialogOpen(false)}
                  disabled={archivingOfficers}
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleArchiveOfficers}
                  disabled={archivingOfficers || !archiveTerm.trim() || !archiveUnderstood}
                  className="rounded-lg bg-red-300 px-4 py-2 text-sm font-black text-red-950 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {archivingOfficers ? "Archiving..." : "Archive and Clear Current Core"}
                </button>
              </div>
            </div>
          </div>
        )}
        <form id="officers-form" className="flex flex-col gap-4" onSubmit={handleOfficerSubmit}>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-white/70">
              Editing
              <select
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-amber-200/70"
                value={selectedOfficerId}
                onChange={(e) => setSelectedOfficerId(e.target.value)}
              >
                <option value="new">Create new officer</option>
                {officers.map((officer) => (
                  <option key={officer.id} value={officer.id}>
                    Edit: {officer.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-white/60">
              All fields save to Supabase. Email required; socials optional.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-white/80">
              Name
              <input
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-200/70"
                name="officer_name"
                placeholder="Alex Kim"
                value={officerForm.name}
                onChange={(e) => setOfficerForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </label>
          <label className="flex flex-col gap-2 text-sm text-white/80">
            Role / title
            <input
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-200/70"
              name="officer_role"
              placeholder="President"
              value={officerForm.role}
              onChange={(e) => setOfficerForm((prev) => ({ ...prev, role: e.target.value }))}
              required
            />
          </label>
            <label className="flex flex-col gap-2 text-sm text-white/80">
              Major
              <input
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-200/70"
                name="officer_major"
                placeholder="Computer Science"
                value={officerForm.major}
                onChange={(e) => setOfficerForm((prev) => ({ ...prev, major: e.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/80">
              Year (e.g., Sophomore, 2025)
              <input
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-200/70"
                name="officer_year"
                placeholder="Junior"
                value={officerForm.year}
                onChange={(e) => setOfficerForm((prev) => ({ ...prev, year: e.target.value }))}
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm text-white/80">
            ASU email (required)
            <input
              type="email"
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-200/70"
              name="officer_email"
              placeholder="netid@asu.edu"
              value={officerForm.email}
              onChange={(e) => setOfficerForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-white/80">
            Bio
            <textarea
              className="min-h-[120px] rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-200/70"
              name="officer_bio"
              placeholder="Short intro and interests."
              value={officerForm.bio}
              onChange={(e) => setOfficerForm((prev) => ({ ...prev, bio: e.target.value }))}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-white/80">
              Instagram URL or handle (optional)
              <input
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-200/70"
                name="officer_instagram"
                placeholder="https://instagram.com/asu"
                value={officerForm.instagram}
                onChange={(e) => setOfficerForm((prev) => ({ ...prev, instagram: e.target.value }))}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/80">
              LinkedIn URL (optional)
              <input
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-200/70"
                name="officer_linkedin"
                placeholder="https://www.linkedin.com/in/"
                value={officerForm.linkedin}
                onChange={(e) => setOfficerForm((prev) => ({ ...prev, linkedin: e.target.value }))}
              />
            </label>
          </div>
          <FileDropField
            label="Headshot image"
            name="officer_headshot"
            helperText="Drag in a headshot or click to upload"
            initialPreview={officerForm.imageUrl || undefined}
            onSelect={({ file, remoteUrl }) => {
              setOfficerImageFile(file ?? null);
              setOfficerImageRemote(remoteUrl ?? null);
              setOfficerForm((prev) => ({ ...prev, imageUrl: remoteUrl ?? prev.imageUrl }));
            }}
          />
          <label className="flex flex-col gap-2 text-sm text-white/80">
            Sort order (optional number)
            <input
              type="number"
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-200/70"
              name="officer_sort"
              placeholder="1 = top of list"
              value={officerForm.sortOrder}
              onChange={(e) => setOfficerForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-white/60">
              {officerForm.id ? "Updating existing officer" : "Creating a new officer"}
            </p>
            <div className="flex flex-wrap gap-2">
              {officerForm.id && (
                <button
                  type="button"
                  onClick={handleOfficerDelete}
                  disabled={deletingOfficer}
                  className="inline-flex items-center rounded-lg border border-red-400/70 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingOfficer ? "Deleting..." : "Delete"}
                </button>
              )}
              <button
                type="submit"
                disabled={
                  savingOfficer ||
                  !officerForm.name.trim() ||
                  !officerForm.role.trim() ||
                  !officerForm.email.trim()
                }
                className="inline-flex items-center rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.01] hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingOfficer ? "Saving..." : officerForm.id ? "Update officer" : "Create officer"}
              </button>
            </div>
          </div>
        </form>
      </TogglePanel>

      <TogglePanel label="Gallery">
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-white">Current albums</p>
            {albums.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedAlbumId("new")}
                className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/15"
              >
                + New album
              </button>
            )}
          </div>
          {albums.length === 0 ? (
            <p className="mt-1 text-white/70">No albums yet.</p>
          ) : (
            <ul className="mt-2 divide-y divide-white/10 border-t border-white/10">
              {albums.map((album) => (
                <li key={album.id} className="flex items-center justify-between gap-3 bg-white/5 px-3 py-2">
                  <div className="flex items-center gap-3">
                    {album.cover_image_url && (
                      <div className="h-10 w-16 overflow-hidden rounded-md border border-white/15 bg-black/30">
                        <img
                          src={album.cover_image_url}
                          alt={album.title || "Album cover"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-white">{album.title}</p>
                      <p className="text-xs text-white/70">{album.date ?? "No date"}</p>
                      {album.google_photos_url && (
                        <p className="text-[11px] text-white/60">Photos: {album.google_photos_url}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedAlbumId(album.id)}
                    className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-[12px] font-semibold text-white transition hover:border-amber-200/60 hover:bg-amber-400/10"
                  >
                    Edit
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <form id="gallery-form" className="flex flex-col gap-4" onSubmit={handleAlbumSubmit}>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-white/70">
              Editing
              <select
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-amber-200/70"
                value={selectedAlbumId}
                onChange={(e) => setSelectedAlbumId(e.target.value)}
              >
                <option value="new">Create new album</option>
                {albums.map((album) => (
                  <option key={album.id} value={album.id}>
                    Edit: {album.title}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-white/60">Google Photos link required; date has picker + free text.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-white/80">
              Album title
              <input
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-200/70"
                name="album_title"
                placeholder="Spring Banquet 2024"
                value={albumForm.title}
                onChange={(e) => setAlbumForm((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/80">
              Date
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <input
                  className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-200/70"
                  name="album_date"
                  placeholder="2024-04-15 or Spring 2024"
                  value={albumForm.date}
                  onChange={(e) => setAlbumForm((prev) => ({ ...prev, date: e.target.value }))}
                />
                <input
                  type="date"
                  className="min-w-[170px] rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-200/70"
                  value={/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(albumForm.date.trim()) ? albumForm.date : ""}
                  onChange={(e) => setAlbumForm((prev) => ({ ...prev, date: e.target.value }))}
                  aria-label="Pick date"
                />
              </div>
              <span className="text-xs text-white/60">
                Use the picker (mobile shows a date wheel) or type any free-form date.
              </span>
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm text-white/80">
            Google Photos share link
            <input
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-200/70"
              name="album_link"
              placeholder="https://photos.app.goo.gl/..."
              value={albumForm.googlePhotosUrl}
              onChange={(e) => setAlbumForm((prev) => ({ ...prev, googlePhotosUrl: e.target.value }))}
              required
            />
          </label>
          <FileDropField
            label="Cover image"
            name="album_cover"
            helperText="Drag in a cover image or click to upload"
            initialPreview={albumForm.coverImageUrl || undefined}
            onSelect={({ file, remoteUrl }) => {
              setAlbumImageFile(file ?? null);
              setAlbumImageRemote(remoteUrl ?? null);
              setAlbumForm((prev) => ({ ...prev, coverImageUrl: remoteUrl ?? prev.coverImageUrl }));
            }}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-white/60">
              {albumForm.id ? "Updating existing album" : "Creating a new album"}
            </p>
            <div className="flex flex-wrap gap-2">
              {albumForm.id && (
                <button
                  type="button"
                  onClick={handleAlbumDelete}
                  disabled={deletingAlbum}
                  className="inline-flex items-center rounded-lg border border-red-400/70 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingAlbum ? "Deleting..." : "Delete"}
                </button>
              )}
              <button
                type="submit"
                disabled={
                  savingAlbum ||
                  !albumForm.title.trim() ||
                  !albumForm.googlePhotosUrl.trim()
                }
                className="inline-flex items-center rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.01] hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingAlbum ? "Saving..." : albumForm.id ? "Update album" : "Create album"}
              </button>
            </div>
          </div>
        </form>
      </TogglePanel>

      <TogglePanel label="Home Carousel">
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-white">Current slides</p>
            {carousel.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedSlideId("new")}
                className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/15"
              >
                + New slide
              </button>
            )}
          </div>
          {carousel.length === 0 ? (
            <p className="mt-1 text-white/70">No slides yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {carousel.map((slide) => (
                <li key={slide.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-3 py-2">
                  <div>
                    <p className="font-semibold text-white">{slide.alt || "Untitled slide"}</p>
                    <p className="text-xs text-white/70">
                      {slide.sort_order != null ? `Order: ${slide.sort_order}` : "No order set"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {slide.image_url && (
                      <div className="h-10 w-16 overflow-hidden rounded-md border border-white/15 bg-black/30">
                        <img src={slide.image_url} alt={slide.alt ?? "Slide preview"} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedSlideId(slide.id)}
                      className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-[12px] font-semibold text-white transition hover:border-amber-200/60 hover:bg-amber-400/10"
                    >
                      Edit
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <form id="carousel-form" className="flex flex-col gap-4" onSubmit={handleCarouselSubmit}>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-white/70">
              Editing
              <select
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-amber-200/70"
                value={selectedSlideId}
                onChange={(e) => setSelectedSlideId(e.target.value)}
              >
                <option value="new">Create new slide</option>
                {carousel.map((slide) => (
                  <option key={slide.id} value={slide.id}>
                    Edit: {slide.alt || "Untitled slide"}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-white/60">
              Alt text = short description for screen readers; also used as the slide label here.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-white/80">
              Alt text / title
              <input
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-200/70"
                name="slide_alt"
                placeholder="Welcome to ASU"
                value={carouselForm.alt}
                onChange={(e) => setCarouselForm((prev) => ({ ...prev, alt: e.target.value }))}
                required
              />
              <span className="text-[11px] text-white/60">
                Used for accessibility; describes the image for people using screen readers.
              </span>
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/80">
              Slide order (optional number)
              <input
                type="number"
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-200/70"
                name="slide_order"
                placeholder="1 = first slide"
                value={carouselForm.sortOrder}
                onChange={(e) => setCarouselForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
              />
            </label>
          </div>
          <FileDropField
            label="Hero image"
            name="slide_image"
            helperText="Drag in a hero image or click to upload"
            initialPreview={carouselForm.imageUrl || undefined}
            onSelect={({ file, remoteUrl }) => {
              setCarouselImageFile(file ?? null);
              setCarouselImageRemote(remoteUrl ?? null);
              setCarouselForm((prev) => ({ ...prev, imageUrl: remoteUrl ?? prev.imageUrl }));
            }}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-white/60">
              {carouselForm.id ? "Updating existing slide" : "Creating a new slide"}
            </p>
            <div className="flex flex-wrap gap-2">
              {carouselForm.id && (
                <button
                  type="button"
                  onClick={handleCarouselDelete}
                  disabled={deletingCarousel}
                  className="inline-flex items-center rounded-lg border border-red-400/70 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingCarousel ? "Deleting..." : "Delete"}
                </button>
              )}
              <button
                type="submit"
                disabled={
                  savingCarousel ||
                  !carouselForm.alt.trim() ||
                  !(carouselForm.imageUrl.trim() || carouselImageFile || carouselImageRemote)
                }
                className="inline-flex items-center rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.01] hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingCarousel ? "Saving..." : carouselForm.id ? "Update slide" : "Create slide"}
              </button>
            </div>
          </div>
        </form>
      </TogglePanel>

      <TogglePanel label="Social Bar">
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-white">Current links</p>
            {socialLinks.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedSocialId("new")}
                className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/15"
              >
                + New link
              </button>
            )}
          </div>
          {socialLinks.length === 0 ? (
            <p className="mt-1 text-white/70">No social links yet.</p>
          ) : (
            <ul className="mt-2 divide-y divide-white/10 border-t border-white/10">
              {socialLinks.map((link) => (
                <li key={link.id} className="flex items-center justify-between gap-3 bg-white/5 px-3 py-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 bg-amber-300/20 text-sm font-bold text-amber-100">
                      {link.icon_url ? (
                        <img src={link.icon_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        link.label.slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">{link.label}</p>
                        {link.is_active === false && (
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/60">
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-white/70">{link.url}</p>
                      <p className="text-[11px] text-white/55">
                        {link.sort_order != null ? `Order ${link.sort_order}` : "No order set"}
                        {link.icon_url ? " • custom thumbnail" : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSocialId(link.id)}
                    className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-[12px] font-semibold text-white transition hover:border-amber-200/60 hover:bg-amber-400/10"
                  >
                    Edit
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <form id="social-links-form" className="flex flex-col gap-4" onSubmit={handleSocialSubmit}>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-white/70">
              Editing
              <select
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-amber-200/70"
                value={selectedSocialId}
                onChange={(e) => setSelectedSocialId(e.target.value)}
              >
                <option value="new">Create new social link</option>
                {socialLinks.map((link) => (
                  <option key={link.id} value={link.id}>
                    Edit: {link.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-white/60">
              Recognized services use their normal icon automatically. Add a thumbnail only for custom links.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-white/80">
              Label
              <input
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-200/70"
                name="social_label"
                placeholder="Instagram"
                value={socialForm.label}
                onChange={(e) => setSocialForm((prev) => ({ ...prev, label: e.target.value }))}
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-white/80">
              Sort order (optional number)
              <input
                type="number"
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-200/70"
                name="social_sort"
                placeholder="1 = first icon"
                value={socialForm.sortOrder}
                onChange={(e) => setSocialForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm text-white/80">
            Link URL
            <input
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-200/70"
              name="social_url"
              placeholder="https://instagram.com/asianstudentunion"
              value={socialForm.url}
              onChange={(e) => setSocialForm((prev) => ({ ...prev, url: e.target.value }))}
              required
            />
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-white">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/30 bg-white/5 text-amber-300 focus:ring-amber-200"
              checked={socialForm.isActive}
              onChange={(e) => setSocialForm((prev) => ({ ...prev, isActive: e.target.checked }))}
            />
            <span>Show this link in the social bar</span>
          </label>

          <label className="flex flex-col gap-2 text-sm text-white/80">
            Icon thumbnail URL (optional)
            <input
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none focus:border-amber-200/70"
              name="social_icon_url"
              placeholder="https://..."
              value={socialForm.iconUrl}
              onChange={(e) => {
                setSocialIconFile(null);
                setSocialIconRemote(null);
                setSocialForm((prev) => ({ ...prev, iconUrl: e.target.value }));
              }}
            />
            <span className="text-xs text-white/60">
              Leave blank for Instagram, TikTok, Discord, and other services supported by the icon library.
            </span>
          </label>

          <FileDropField
            label="Custom icon thumbnail"
            name="social_icon"
            helperText="Optional. Drag a square icon or click to upload."
            initialPreview={socialForm.iconUrl || undefined}
            onSelect={({ file, remoteUrl }) => {
              setSocialIconFile(file ?? null);
              setSocialIconRemote(remoteUrl ?? null);
              setSocialForm((prev) => ({ ...prev, iconUrl: remoteUrl ?? prev.iconUrl }));
            }}
          />

          {socialForm.iconUrl && (
            <button
              type="button"
              onClick={() => {
                setSocialIconFile(null);
                setSocialIconRemote(null);
                setSocialForm((prev) => ({ ...prev, iconUrl: "" }));
              }}
              className="w-fit rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:border-red-300/60 hover:bg-red-500/10 hover:text-red-100"
            >
              Clear thumbnail
            </button>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-white/60">
              {socialForm.id ? "Updating existing social link" : "Creating a new social link"}
            </p>
            <div className="flex flex-wrap gap-2">
              {socialForm.id && (
                <button
                  type="button"
                  onClick={handleSocialDelete}
                  disabled={deletingSocial}
                  className="inline-flex items-center rounded-lg border border-red-400/70 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingSocial ? "Deleting..." : "Delete"}
                </button>
              )}
              <button
                type="submit"
                disabled={savingSocial || !socialForm.label.trim() || !socialForm.url.trim()}
                className="inline-flex items-center rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.01] hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingSocial ? "Saving..." : socialForm.id ? "Update social link" : "Create social link"}
              </button>
            </div>
          </div>
        </form>
      </TogglePanel>
    </div>
  );
}
