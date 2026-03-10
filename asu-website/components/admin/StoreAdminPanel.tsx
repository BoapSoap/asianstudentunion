"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StarOutlineRoundedIcon from "@mui/icons-material/StarOutlineRounded";
import { toast } from "react-toastify";
import ClientToaster from "@/components/admin/ClientToaster";
import type { ProfileRole } from "@/lib/getCurrentProfile";
import {
  DEFAULT_PAID_REMINDER_HOURS,
  isReminderDue,
} from "@/lib/storeReminders";
import { formatUsdFromCents } from "@/lib/store";

type StoreSettings = {
  id: string | null;
  is_enabled: boolean;
  pickup_instructions: string | null;
  venmo_username: string | null;
  venmo_qr_image_url: string | null;
  zelle_handle: string | null;
  zelle_display_name: string | null;
  updated_at: string | null;
};

type StoreContact = {
  id: string;
  role: string;
  name: string;
  email: string;
  is_active: boolean;
  updated_at: string;
};

type StoreProduct = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  stripe_price_id: string;
  image_url: string | null;
  images: StoreProductImage[];
  colors: StoreProductColor[];
  is_active: boolean;
  created_at: string;
};

type StoreProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number | null;
  is_thumbnail: boolean | null;
  created_at: string;
};

type StoreProductColor = {
  id: string;
  product_id: string;
  name: string;
  hex_color: string;
  preview_image_url: string | null;
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
};

type OrderStatus = "paid" | "in_progress" | "ready_for_pickup" | "picked_up";

type StoreOrder = {
  id: string;
  stripe_session_id: string;
  customer_name: string | null;
  customer_email: string;
  product_id: string | null;
  size: string | null;
  quantity: number;
  total_cents: number;
  payment_method: "venmo" | "zelle";
  payment_reference: string | null;
  color_id: string | null;
  color_name: string | null;
  color_hex: string | null;
  status: OrderStatus;
  created_at: string;
  status_updated_at: string | null;
  last_internal_paid_reminder_at: string | null;
  internal_paid_reminder_count: number | null;
  product_name: string | null;
};

type ProductFormState = {
  id: string;
  name: string;
  description: string;
  priceDollars: string;
  isActive: boolean;
};

type ProductImageDraft = {
  id: string;
  previewUrl: string;
  source: "existing" | "new";
  file?: File;
};

type ProductColorDraft = {
  id: string;
  name: string;
  hexColor: string;
  previewImageUrl: string | null;
  isActive: boolean;
};

const EMPTY_PRODUCT_FORM: ProductFormState = {
  id: "",
  name: "",
  description: "",
  priceDollars: "",
  isActive: true,
};
const DEFAULT_PICKUP_INSTRUCTIONS = "Pickup in ASU room.";

const COLOR_PRESETS: Array<{ name: string; hex: string }> = [
  { name: "Red", hex: "#DC2626" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#111111" },
  { name: "Navy", hex: "#1E3A8A" },
  { name: "Blue", hex: "#2563EB" },
  { name: "Green", hex: "#16A34A" },
  { name: "Yellow", hex: "#FACC15" },
  { name: "Gold", hex: "#D4AF37" },
  { name: "Orange", hex: "#F97316" },
  { name: "Purple", hex: "#7C3AED" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Gray", hex: "#6B7280" },
  { name: "Brown", hex: "#7C2D12" },
  { name: "Beige", hex: "#D6C7A1" },
];

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getNextOrderStatus(status: OrderStatus): OrderStatus | null {
  if (status === "paid") return "in_progress";
  if (status === "in_progress") return "ready_for_pickup";
  if (status === "ready_for_pickup") return "picked_up";
  return null;
}

function formatOrderStatus(status: OrderStatus) {
  if (status === "in_progress") return "in progress";
  if (status === "ready_for_pickup") return "ready for pickup";
  if (status === "picked_up") return "picked up";
  return "paid";
}

function formatPaymentMethod(method: "venmo" | "zelle") {
  return method === "venmo" ? "Venmo" : "Zelle";
}

function buildCsvValue(value: string | number | null | undefined) {
  const normalized = value === null || value === undefined ? "" : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
}

function centsToDollarInput(cents: number) {
  return (cents / 100).toFixed(2);
}

function dollarsToCents(input: string) {
  const normalized = input.trim().replace(/^\$/, "");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.round(parsed * 100);
}

function createImageDraftId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `img-${crypto.randomUUID()}`;
  }
  return `img-${Math.random().toString(36).slice(2, 10)}`;
}

function createColorDraftId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `color-${crypto.randomUUID()}`;
  }
  return `color-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeHexColor(value: string) {
  const trimmed = value.trim().toUpperCase();
  if (/^#[0-9A-F]{6}$/.test(trimmed)) return trimmed;
  return "#FFFFFF";
}

function revokePreviewUrl(draft: ProductImageDraft) {
  if (draft.source === "new") {
    URL.revokeObjectURL(draft.previewUrl);
  }
}

function dedupeUrls(urls: string[]) {
  const next: string[] = [];
  const seen = new Set<string>();
  for (const value of urls) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    next.push(trimmed);
  }
  return next;
}

function buildExistingDrafts(product: StoreProduct): ProductImageDraft[] {
  const baseImages = product.images.length > 0 ? product.images : product.image_url
    ? [
        {
          id: `legacy-${product.id}`,
          product_id: product.id,
          image_url: product.image_url,
          sort_order: 0,
          is_thumbnail: true,
          created_at: product.created_at,
        },
      ]
    : [];

  return baseImages.map((image) => ({
    id: image.id,
    previewUrl: image.image_url,
    source: "existing" as const,
  }));
}

function buildExistingColorDrafts(product: StoreProduct): ProductColorDraft[] {
  return (product.colors ?? []).map((color) => ({
    id: color.id,
    name: color.name,
    hexColor: normalizeHexColor(color.hex_color),
    previewImageUrl: color.preview_image_url,
    isActive: color.is_active,
  }));
}

function createDefaultColorDraft(): ProductColorDraft {
  const fallback = COLOR_PRESETS[0];
  return {
    id: createColorDraftId(),
    name: fallback.name,
    hexColor: fallback.hex,
    previewImageUrl: null,
    isActive: true,
  };
}

export default function StoreAdminPanel({
  settings,
  contacts,
  products,
  orders,
  viewerRole,
}: {
  settings: StoreSettings | null;
  contacts: StoreContact[];
  products: StoreProduct[];
  orders: StoreOrder[];
  viewerRole: ProfileRole;
}) {
  const canManageOrders = viewerRole === "admin" || viewerRole === "owner";
  const [settingsState, setSettingsState] = useState<StoreSettings>({
    id: settings?.id ?? null,
    is_enabled: settings?.is_enabled ?? false,
    pickup_instructions: settings?.pickup_instructions?.trim() || DEFAULT_PICKUP_INSTRUCTIONS,
    venmo_username: settings?.venmo_username ?? "",
    venmo_qr_image_url: settings?.venmo_qr_image_url ?? "",
    zelle_handle: settings?.zelle_handle ?? "",
    zelle_display_name: settings?.zelle_display_name ?? "",
    updated_at: settings?.updated_at ?? null,
  });
  const [contactsState, setContactsState] = useState<StoreContact[]>(contacts);
  const [productsState, setProductsState] = useState<StoreProduct[]>(products);
  const [ordersState, setOrdersState] = useState<StoreOrder[]>(orders);
  const [orderSearchInput, setOrderSearchInput] = useState("");
  const [activeOrderSearch, setActiveOrderSearch] = useState("");

  const [savingSettings, setSavingSettings] = useState(false);
  const [savingTreasurer, setSavingTreasurer] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [archivingProductId, setArchivingProductId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [orderDeleteDialog, setOrderDeleteDialog] = useState<{
    open: boolean;
    order: StoreOrder | null;
    confirmed: boolean;
  }>({ open: false, order: null, confirmed: false });
  const [readyPickupDialog, setReadyPickupDialog] = useState<{
    open: boolean;
    order: StoreOrder | null;
    confirmed: boolean;
  }>({ open: false, order: null, confirmed: false });
  const [pickedUpDialog, setPickedUpDialog] = useState<{
    open: boolean;
    order: StoreOrder | null;
    confirmed: boolean;
  }>({ open: false, order: null, confirmed: false });
  const [venmoQrFile, setVenmoQrFile] = useState<File | null>(null);

  const [selectedContactId, setSelectedContactId] = useState<string>(
    contactsState.find((contact) => contact.is_active)?.id ?? contactsState[0]?.id ?? ""
  );
  const [treasurerName, setTreasurerName] = useState("");
  const [treasurerEmail, setTreasurerEmail] = useState("");

  const [selectedProductId, setSelectedProductId] = useState<string>(productsState[0]?.id ?? "new");
  const [productImageDrafts, setProductImageDrafts] = useState<ProductImageDraft[]>(() => {
    if (!productsState[0]) return [];
    return buildExistingDrafts(productsState[0]);
  });
  const [productColorDrafts, setProductColorDrafts] = useState<ProductColorDraft[]>(() => {
    if (!productsState[0]) return [];
    return buildExistingColorDrafts(productsState[0]);
  });
  const [thumbnailDraftId, setThumbnailDraftId] = useState<string>(() => {
    const firstProduct = productsState[0];
    if (!firstProduct) return "";
    const thumbnail = firstProduct.images.find((image) => image.is_thumbnail) ?? firstProduct.images[0];
    return thumbnail?.id ?? "";
  });
  const productImageDraftsRef = useRef<ProductImageDraft[]>(productImageDrafts);
  const [productForm, setProductForm] = useState<ProductFormState>(() => {
    if (!productsState[0]) return { ...EMPTY_PRODUCT_FORM };

    return {
      id: productsState[0].id,
      name: productsState[0].name,
      description: productsState[0].description ?? "",
      priceDollars: centsToDollarInput(productsState[0].price_cents),
      isActive: productsState[0].is_active,
    };
  });

  useEffect(() => {
    if (contactsState.length === 0) {
      setSelectedContactId("");
      setTreasurerName("");
      setTreasurerEmail("");
      return;
    }

    const activeId = contactsState.find((contact) => contact.is_active)?.id ?? contactsState[0].id;
    if (!selectedContactId) {
      setSelectedContactId(activeId);
      return;
    }

    const currentExists = contactsState.some((contact) => contact.id === selectedContactId);
    if (!currentExists) {
      setSelectedContactId(activeId);
    }
  }, [contactsState, selectedContactId]);

  useEffect(() => {
    if (!selectedContactId) {
      setTreasurerName("");
      setTreasurerEmail("");
      return;
    }

    const selected = contactsState.find((contact) => contact.id === selectedContactId);
    if (!selected) return;

    setTreasurerName(selected.name);
    setTreasurerEmail(selected.email);
  }, [selectedContactId, contactsState]);

  useEffect(() => {
    productImageDraftsRef.current = productImageDrafts;
  }, [productImageDrafts]);

  useEffect(() => {
    return () => {
      for (const draft of productImageDraftsRef.current) {
        revokePreviewUrl(draft);
      }
    };
  }, []);

  const setProductImageDraftsWithCleanup = useCallback((
    updater: ProductImageDraft[] | ((prev: ProductImageDraft[]) => ProductImageDraft[])
  ) => {
    setProductImageDrafts((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const nextIds = new Set(next.map((draft) => draft.id));
      for (const draft of prev) {
        if (!nextIds.has(draft.id)) {
          revokePreviewUrl(draft);
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (productsState.length === 0) {
      setSelectedProductId("new");
      setProductForm({ ...EMPTY_PRODUCT_FORM });
      setProductImageDraftsWithCleanup([]);
      setProductColorDrafts([]);
      setThumbnailDraftId("");
      return;
    }

    if (selectedProductId === "new") {
      setProductForm({ ...EMPTY_PRODUCT_FORM });
      setProductImageDraftsWithCleanup([]);
      setProductColorDrafts([]);
      setThumbnailDraftId("");
      return;
    }

    const selected = productsState.find((product) => product.id === selectedProductId);
    if (!selected) {
      setSelectedProductId(productsState[0].id);
      return;
    }

    setProductForm({
      id: selected.id,
      name: selected.name,
      description: selected.description ?? "",
      priceDollars: centsToDollarInput(selected.price_cents),
      isActive: selected.is_active,
    });
    const nextDrafts = buildExistingDrafts(selected);
    setProductImageDraftsWithCleanup(nextDrafts);
    setProductColorDrafts(buildExistingColorDrafts(selected));
    const selectedThumbnail =
      selected.images.find((image) => image.is_thumbnail)?.id ?? nextDrafts[0]?.id ?? "";
    setThumbnailDraftId(selectedThumbnail);
  }, [selectedProductId, productsState, setProductImageDraftsWithCleanup]);

  const activeTreasurer = useMemo(
    () => contactsState.find((contact) => contact.is_active) ?? contactsState[0] ?? null,
    [contactsState]
  );

  const filteredOrders = useMemo(() => {
    const search = activeOrderSearch.trim().toLowerCase();
    if (!search) {
      return ordersState;
    }

    return ordersState.filter((order) => {
      const normalizedOrderId = order.id.toLowerCase();
      const normalizedEmail = order.customer_email.toLowerCase();
      return normalizedOrderId.includes(search) || normalizedEmail.includes(search);
    });
  }, [activeOrderSearch, ordersState]);

  const paidOrdersDue = useMemo(
    () =>
      ordersState.filter(
        (order) =>
          order.status === "paid" &&
          !order.last_internal_paid_reminder_at &&
          isReminderDue(order.status_updated_at ?? order.created_at, DEFAULT_PAID_REMINDER_HOURS)
      ),
    [ordersState]
  );

  const appendProductImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const additions: ProductImageDraft[] = Array.from(files).map((file) => ({
      id: createImageDraftId(),
      previewUrl: URL.createObjectURL(file),
      source: "new",
      file,
    }));

    setProductImageDraftsWithCleanup((prev) => {
      const next = [...prev, ...additions];
      setThumbnailDraftId((current) => current || next[0]?.id || "");
      return next;
    });
  };

  const removeProductImage = (draftId: string) => {
    setProductImageDraftsWithCleanup((prev) => {
      const next = prev.filter((draft) => draft.id !== draftId);
      if (thumbnailDraftId === draftId) {
        setThumbnailDraftId(next[0]?.id ?? "");
      }
      return next;
    });
  };

  const moveProductImage = (draftId: string, direction: "left" | "right") => {
    setProductImageDraftsWithCleanup((prev) => {
      const index = prev.findIndex((draft) => draft.id === draftId);
      if (index < 0) return prev;
      const targetIndex = direction === "left" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  };

  const addColorVariant = () => {
    setProductColorDrafts((prev) => [...prev, createDefaultColorDraft()]);
  };

  const removeColorVariant = (draftId: string) => {
    setProductColorDrafts((prev) => prev.filter((draft) => draft.id !== draftId));
  };

  const updateColorVariant = (
    draftId: string,
    updater: (draft: ProductColorDraft) => ProductColorDraft
  ) => {
    setProductColorDrafts((prev) =>
      prev.map((draft) => (draft.id === draftId ? updater(draft) : draft))
    );
  };

  const uploadImage = async (file: File, folder: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Image upload failed");
    }
    return data.publicUrl as string;
  };

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    setSavingSettings(true);

    try {
      let venmoQrImageUrl = settingsState.venmo_qr_image_url?.trim() || "";
      if (venmoQrFile) {
        venmoQrImageUrl = await uploadImage(venmoQrFile, "store-payment");
        setVenmoQrFile(null);
      }

      const response = await fetch("/api/admin/store/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_enabled: settingsState.is_enabled,
          pickup_instructions: settingsState.pickup_instructions ?? "",
          venmo_username: settingsState.venmo_username ?? "",
          venmo_qr_image_url: venmoQrImageUrl,
          zelle_handle: settingsState.zelle_handle ?? "",
          zelle_display_name: settingsState.zelle_display_name ?? "",
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        settings?: StoreSettings;
      };

      if (!response.ok || !payload.settings) {
        throw new Error(payload.error || "Failed to save settings");
      }

      setSettingsState({
        id: payload.settings.id,
        is_enabled: payload.settings.is_enabled,
        pickup_instructions: payload.settings.pickup_instructions ?? "",
        venmo_username: payload.settings.venmo_username ?? "",
        venmo_qr_image_url: payload.settings.venmo_qr_image_url ?? "",
        zelle_handle: payload.settings.zelle_handle ?? "",
        zelle_display_name: payload.settings.zelle_display_name ?? "",
        updated_at: payload.settings.updated_at,
      });

      toast.success("Store settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  }

  async function saveTreasurer(event: FormEvent) {
    event.preventDefault();
    setSavingTreasurer(true);

    try {
      const response = await fetch("/api/admin/store/treasurer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedContactId || undefined,
          name: treasurerName,
          email: treasurerEmail,
          is_active: true,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        contact?: StoreContact;
      };

      if (!response.ok || !payload.contact) {
        throw new Error(payload.error || "Failed to save treasurer contact");
      }

      setContactsState((prev) => {
        const next = prev.filter((contact) => contact.id !== payload.contact!.id);
        next.unshift(payload.contact!);
        return next.map((contact) => ({
          ...contact,
          is_active: contact.id === payload.contact!.id,
        }));
      });
      setSelectedContactId(payload.contact.id);
      toast.success("Treasurer contact saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save treasurer contact");
    } finally {
      setSavingTreasurer(false);
    }
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault();
    setSavingProduct(true);

    try {
      const priceCents = dollarsToCents(productForm.priceDollars);
      if (!priceCents) {
        throw new Error("Price must be a valid dollar amount, for example 25.00 or 25.99");
      }

      const imageUrlsRaw: string[] = [];
      const resolvedImageUrlByPreview = new Map<string, string>();
      for (const draft of productImageDrafts) {
        if (draft.source === "new") {
          if (!draft.file) continue;
          const uploadedUrl = await uploadImage(draft.file, "store-products");
          imageUrlsRaw.push(uploadedUrl);
          resolvedImageUrlByPreview.set(draft.previewUrl, uploadedUrl);
        } else {
          imageUrlsRaw.push(draft.previewUrl);
          resolvedImageUrlByPreview.set(draft.previewUrl, draft.previewUrl);
        }
      }
      const imageUrls = dedupeUrls(imageUrlsRaw);
      const selectedThumbRawIndex = Math.max(
        0,
        productImageDrafts.findIndex((draft) => draft.id === thumbnailDraftId)
      );
      const selectedThumbUrl = imageUrlsRaw[selectedThumbRawIndex] ?? imageUrls[0] ?? "";
      const thumbnailIndex = Math.max(0, imageUrls.indexOf(selectedThumbUrl));

      const colorPayload: Array<{
        name: string;
        hex_color: string;
        preview_image_url: string | null;
        is_active: boolean;
      }> = [];
      const seenColorNames = new Set<string>();

      for (const color of productColorDrafts) {
        const trimmedName = color.name.trim();
        if (!trimmedName) continue;
        const key = trimmedName.toLowerCase();
        if (seenColorNames.has(key)) continue;
        seenColorNames.add(key);

        colorPayload.push({
          name: trimmedName,
          hex_color: normalizeHexColor(color.hexColor),
          preview_image_url: color.previewImageUrl
            ? resolvedImageUrlByPreview.get(color.previewImageUrl) || color.previewImageUrl
            : null,
          is_active: color.isActive,
        });
      }

      const response = await fetch("/api/admin/store/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedProductId !== "new" ? selectedProductId : undefined,
          name: productForm.name,
          description: productForm.description,
          price_cents: priceCents,
          image_urls: imageUrls,
          thumbnail_index: thumbnailIndex,
          colors: colorPayload,
          is_active: productForm.isActive,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        product?: StoreProduct;
      };

      if (!response.ok || !payload.product) {
        throw new Error(payload.error || "Failed to save product");
      }

      setProductsState((prev) => {
        const next = prev.filter((product) => product.id !== payload.product!.id);
        next.unshift(payload.product!);
        return next;
      });
      setSelectedProductId(payload.product.id);
      toast.success("Product saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save product");
    } finally {
      setSavingProduct(false);
    }
  }

  async function setProductActive(productId: string, isActive: boolean) {
    setArchivingProductId(productId);

    try {
      const response = await fetch("/api/admin/store/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, is_active: isActive }),
      });

      const payload = (await response.json()) as { error?: string; product?: StoreProduct };
      if (!response.ok || !payload.product) {
        throw new Error(payload.error || "Failed to update product status");
      }

      setProductsState((prev) =>
        prev.map((product) =>
          product.id === productId ? payload.product! : product
        )
      );
      if (selectedProductId === productId) {
        setProductForm((prev) => ({ ...prev, isActive: payload.product!.is_active }));
      }
      toast.success(isActive ? "Product restored" : "Product archived");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update product status");
    } finally {
      setArchivingProductId(null);
    }
  }

  async function deleteProduct(productId: string) {
    const confirmDelete = window.confirm(
      "Delete this product permanently? This cannot be undone. Past orders will keep history with product_id set to null."
    );
    if (!confirmDelete) return;

    setDeletingProductId(productId);

    try {
      const response = await fetch("/api/admin/store/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Failed to delete product");
      }

      setProductsState((prev) => prev.filter((product) => product.id !== productId));
      if (selectedProductId === productId) {
        setSelectedProductId("new");
        setProductForm({ ...EMPTY_PRODUCT_FORM });
        setProductImageDraftsWithCleanup([]);
        setProductColorDrafts([]);
        setThumbnailDraftId("");
      }
      toast.success("Product deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete product");
    } finally {
      setDeletingProductId(null);
    }
  }

  async function updateOrderStatus(order: StoreOrder, nextStatus: OrderStatus) {
    setUpdatingOrderId(order.id);

    try {
      const response = await fetch("/api/admin/store/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, status: nextStatus }),
      });

      const payload = (await response.json()) as {
        error?: string;
        order?: { id: string; status: OrderStatus; status_updated_at: string | null };
      };

      if (!response.ok || !payload.order) {
        throw new Error(payload.error || "Failed to update order status");
      }

      setOrdersState((prev) =>
        prev.map((row) =>
          row.id === payload.order!.id
            ? {
                ...row,
                status: payload.order!.status,
                status_updated_at: payload.order!.status_updated_at,
              }
            : row
        )
      );
      toast.success(`Order marked ${formatOrderStatus(nextStatus)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update order status");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function advanceOrderStatus(order: StoreOrder) {
    const nextStatus = getNextOrderStatus(order.status);
    if (!nextStatus) return;

    if (nextStatus === "ready_for_pickup") {
      setReadyPickupDialog({ open: true, order, confirmed: false });
      return;
    }

    if (nextStatus === "picked_up") {
      setPickedUpDialog({ open: true, order, confirmed: false });
      return;
    }

    await updateOrderStatus(order, nextStatus);
  }

  function closeReadyPickupDialog() {
    if (updatingOrderId) return;
    setReadyPickupDialog({ open: false, order: null, confirmed: false });
  }

  async function confirmReadyForPickup() {
    const target = readyPickupDialog.order;
    if (!target || !readyPickupDialog.confirmed) return;

    await updateOrderStatus(target, "ready_for_pickup");
    setReadyPickupDialog({ open: false, order: null, confirmed: false });
  }

  function closePickedUpDialog() {
    if (updatingOrderId) return;
    setPickedUpDialog({ open: false, order: null, confirmed: false });
  }

  async function confirmPickedUp() {
    const target = pickedUpDialog.order;
    if (!target || !pickedUpDialog.confirmed) return;

    await updateOrderStatus(target, "picked_up");
    setPickedUpDialog({ open: false, order: null, confirmed: false });
  }

  function openDeleteOrderDialog(order: StoreOrder) {
    setOrderDeleteDialog({ open: true, order, confirmed: false });
  }

  function closeDeleteOrderDialog() {
    if (deletingOrderId) return;
    setOrderDeleteDialog({ open: false, order: null, confirmed: false });
  }

  async function deleteOrder() {
    const target = orderDeleteDialog.order;
    if (!target || !orderDeleteDialog.confirmed) return;

    setDeletingOrderId(target.id);

    try {
      const response = await fetch("/api/admin/store/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: target.id, confirm_delete: true }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Failed to delete order");
      }

      setOrdersState((prev) => prev.filter((order) => order.id !== target.id));
      toast.success("Order deleted");
      setOrderDeleteDialog({ open: false, order: null, confirmed: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete order");
    } finally {
      setDeletingOrderId(null);
    }
  }

  function exportOrdersCsv() {
    if (ordersState.length === 0) {
      toast.info("There are no current orders to export.");
      return;
    }

    const header = [
      "created_at",
      "status_updated_at",
      "order_id",
      "customer_name",
      "customer_email",
      "product_name",
      "size",
      "color",
      "quantity",
      "total_usd",
      "payment_method",
      "payment_reference",
      "status",
    ];

    const rows = ordersState.map((order) => [
      order.created_at,
      order.status_updated_at ?? "",
      order.id,
      order.customer_name ?? "",
      order.customer_email,
      order.product_name ?? "Product removed",
      order.size ?? "",
      order.color_name ?? "",
      order.quantity,
      (order.total_cents / 100).toFixed(2),
      formatPaymentMethod(order.payment_method),
      order.payment_reference ?? "",
      formatOrderStatus(order.status),
    ]);

    const csv = [header, ...rows].map((row) => row.map((value) => buildCsvValue(value)).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `store-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Order CSV exported");
  }

  const panelSx = {
    borderRadius: 3,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(10px)",
    p: { xs: 2, md: 3 },
  };

  const collapsiblePanelSx = {
    borderRadius: 3,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(10px)",
    boxShadow: "none",
    "&:before": { display: "none" },
    overflow: "hidden",
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      color: "white",
      borderRadius: "12px",
      background: "rgba(0,0,0,0.28)",
      "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.35)" },
      "&.Mui-focused fieldset": { borderColor: "rgba(255,219,112,0.8)" },
    },
    "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.72)" },
    "& .MuiInputLabel-root.Mui-focused": { color: "rgba(255,219,112,0.95)" },
    "& .MuiFormHelperText-root": { color: "rgba(255,255,255,0.6)" },
  };

  const ordersPanel = canManageOrders ? (
    <Paper
      sx={{
        ...panelSx,
        border: "1px solid rgba(250, 204, 21, 0.58)",
        background:
          "linear-gradient(145deg, rgba(250,204,21,0.14) 0%, rgba(255,255,255,0.08) 34%, rgba(255,255,255,0.04) 100%)",
        boxShadow:
          "0 0 0 1px rgba(250,204,21,0.35) inset, 0 14px 32px rgba(0,0,0,0.22)",
      }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} alignItems={{ xs: "flex-start", sm: "center" }}>
        <Chip
          size="small"
          label="Primary Queue"
          sx={{
            bgcolor: "rgba(250,204,21,0.9)",
            color: "#351908",
            fontWeight: 900,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        />
        <Typography sx={{ color: "rgba(255,226,153,0.92)", fontSize: "0.76rem", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 800 }}>
          Orders
        </Typography>
      </Stack>
      <Typography variant="h5" sx={{ color: "#fde68a", fontWeight: 900, mt: 0.6 }}>
        Fulfillment Queue
      </Typography>
      <Typography sx={{ color: "rgba(255,255,255,0.72)", mt: 0.8, mb: 2 }}>
        Export the current queue, verify payments, and move orders through fulfillment. Paid-order reminders are sent automatically to the active treasurer after 48 hours.
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
        <Chip
          label={`${filteredOrders.length} shown`}
          sx={{ bgcolor: "rgba(255,255,255,0.12)", color: "#fff" }}
        />
        <Chip
          label={`${paidOrdersDue.length} paid reminders due`}
          sx={{ bgcolor: "rgba(59,130,246,0.18)", color: "#bfdbfe" }}
        />
      </Stack>

      <Accordion
        disableGutters
        sx={{
          mb: 2,
          borderRadius: 2,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.04)",
          boxShadow: "none",
          "&:before": { display: "none" },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreRoundedIcon sx={{ color: "#fde68a" }} />} sx={{ minHeight: 0 }}>
          <Typography sx={{ color: "#fff", fontWeight: 700 }}>Search Specific Orders</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ xs: "stretch", md: "flex-end" }}>
            <TextField
              label="Customer email or order ID"
              value={orderSearchInput}
              onChange={(event) => setOrderSearchInput(event.target.value)}
              placeholder="example@email.com or order ID"
              sx={{ ...fieldSx, flex: 1 }}
            />
            <Button
              type="button"
              variant="outlined"
              onClick={() => setActiveOrderSearch(orderSearchInput.trim())}
              sx={{ borderColor: "rgba(251,191,36,0.6)", color: "#fde68a", minWidth: 110 }}
            >
              Search
            </Button>
          </Stack>
          <Typography sx={{ color: "rgba(255,255,255,0.58)", fontSize: "0.78rem", mt: 1 }}>
            Leave the field blank and press Search to show all current orders again.
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.2} sx={{ mb: 2 }}>
        <Alert
          severity="info"
          sx={{
            flex: 1,
            bgcolor: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.86)",
            border: "1px solid rgba(255,255,255,0.12)",
            "& .MuiAlert-icon": { color: "#fde68a" },
          }}
        >
          Paid reminders use a {DEFAULT_PAID_REMINDER_HOURS}-hour threshold and are sent automatically to the active treasurer email.
        </Alert>
        <Button
          type="button"
          variant="outlined"
          onClick={exportOrdersCsv}
          sx={{ borderColor: "rgba(251,191,36,0.6)", color: "#fde68a", alignSelf: { xs: "flex-start", md: "stretch" } }}
        >
          Export CSV
        </Button>
      </Stack>

      <TableContainer sx={{ borderRadius: 2, border: "1px solid rgba(255,255,255,0.12)" }}>
        <Table size="small">
          <TableHead sx={{ background: "rgba(0,0,0,0.24)" }}>
            <TableRow>
              <TableCell sx={{ color: "rgba(255,255,255,0.72)", textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.08em" }}>Created</TableCell>
              <TableCell sx={{ color: "rgba(255,255,255,0.72)", textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.08em" }}>Customer</TableCell>
              <TableCell sx={{ color: "rgba(255,255,255,0.72)", textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.08em" }}>Product</TableCell>
              <TableCell sx={{ color: "rgba(255,255,255,0.72)", textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.08em" }}>Qty</TableCell>
              <TableCell sx={{ color: "rgba(255,255,255,0.72)", textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.08em" }}>Size</TableCell>
              <TableCell sx={{ color: "rgba(255,255,255,0.72)", textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.08em" }}>Color</TableCell>
              <TableCell sx={{ color: "rgba(255,255,255,0.72)", textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.08em" }}>Total</TableCell>
              <TableCell sx={{ color: "rgba(255,255,255,0.72)", textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.08em" }}>Payment</TableCell>
              <TableCell sx={{ color: "rgba(255,255,255,0.72)", textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.08em" }}>Status</TableCell>
              <TableCell sx={{ color: "rgba(255,255,255,0.72)", textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.08em" }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.map((order) => {
              const nextStatus = getNextOrderStatus(order.status);
              const isUpdating = updatingOrderId === order.id;
              const needsPaidReminder =
                order.status === "paid" &&
                !order.last_internal_paid_reminder_at &&
                isReminderDue(order.status_updated_at ?? order.created_at, DEFAULT_PAID_REMINDER_HOURS);

              return (
                <TableRow key={order.id} sx={{ "& td": { borderColor: "rgba(255,255,255,0.08)" } }}>
                  <TableCell sx={{ color: "rgba(255,255,255,0.83)" }}>{formatDateTime(order.created_at)}</TableCell>
                  <TableCell>
                    <Typography sx={{ color: "white", fontWeight: 700, lineHeight: 1.2 }}>{order.customer_name || "N/A"}</Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.62)", fontSize: "0.76rem" }}>{order.customer_email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ color: "white", lineHeight: 1.2 }}>{order.product_name || "Product removed"}</Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.58)", fontSize: "0.72rem", fontFamily: "monospace" }}>{order.id}</Typography>
                  </TableCell>
                  <TableCell sx={{ color: "white" }}>{order.quantity}</TableCell>
                  <TableCell sx={{ color: "white" }}>{order.size || "—"}</TableCell>
                  <TableCell>
                    {order.color_name ? (
                      <Stack direction="row" spacing={0.8} alignItems="center">
                        <Box
                          sx={{
                            width: 14,
                            height: 14,
                            borderRadius: "999px",
                            border: "1px solid rgba(255,255,255,0.32)",
                            backgroundColor: order.color_hex || "#ffffff",
                          }}
                        />
                        <Typography sx={{ color: "white", fontSize: "0.82rem" }}>{order.color_name}</Typography>
                      </Stack>
                    ) : (
                      <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem" }}>—</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ color: "white" }}>{formatUsdFromCents(order.total_cents)}</TableCell>
                  <TableCell>
                    <Typography sx={{ color: "white", lineHeight: 1.2 }}>{formatPaymentMethod(order.payment_method)}</Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.62)", fontSize: "0.76rem" }}>{order.payment_reference || "No payment message"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.6} alignItems="flex-start">
                      <Chip
                        size="small"
                        label={formatOrderStatus(order.status)}
                        sx={{
                          color:
                            order.status === "paid"
                              ? "#dbeafe"
                              : order.status === "in_progress"
                                ? "#fef3c7"
                                : order.status === "ready_for_pickup"
                                  ? "#d1fae5"
                                  : "#e9d5ff",
                          bgcolor:
                            order.status === "paid"
                              ? "rgba(59,130,246,0.28)"
                              : order.status === "in_progress"
                                ? "rgba(245,158,11,0.28)"
                                : order.status === "ready_for_pickup"
                                  ? "rgba(16,185,129,0.28)"
                                  : "rgba(147,51,234,0.28)",
                        }}
                      />
                      <Typography sx={{ color: "rgba(255,255,255,0.54)", fontSize: "0.72rem" }}>
                        Last moved {formatDateTime(order.status_updated_at ?? order.created_at)}
                      </Typography>
                      {needsPaidReminder && (
                        <Chip size="small" label="Internal reminder due" sx={{ bgcolor: "rgba(59,130,246,0.18)", color: "#bfdbfe" }} />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {nextStatus ? (
                        <Button
                          type="button"
                          size="small"
                          variant="outlined"
                          disabled={isUpdating}
                          onClick={() => advanceOrderStatus(order)}
                          sx={{ borderColor: "rgba(251,191,36,0.6)", color: "#fde68a" }}
                        >
                          {isUpdating
                            ? "Updating..."
                            : order.status === "paid"
                              ? "Verify Payment"
                              : nextStatus === "picked_up"
                                ? "Mark Picked Up"
                                : `Mark ${formatOrderStatus(nextStatus)}`}
                        </Button>
                      ) : (
                        <Typography sx={{ color: "rgba(255,255,255,0.62)", fontSize: "0.78rem", alignSelf: "center" }}>
                          Complete
                        </Typography>
                      )}
                      <Button
                        type="button"
                        size="small"
                        variant="outlined"
                        color="error"
                        disabled={Boolean(deletingOrderId)}
                        onClick={() => openDeleteOrderDialog(order)}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} sx={{ color: "rgba(255,255,255,0.72)", textAlign: "center" }}>
                  No orders match the current search and filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  ) : (
    <Alert
      severity="info"
      sx={{
        bgcolor: "rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.86)",
        border: "1px solid rgba(255,255,255,0.12)",
        "& .MuiAlert-icon": { color: "#fde68a" },
      }}
    >
      Fulfillment queue search, CSV export, audit-linked status updates, and reminder controls are limited to admin and owner accounts.
    </Alert>
  );

  return (
    <>
      <ClientToaster />
      <Stack spacing={3}>
        {ordersPanel}
        <Accordion disableGutters sx={collapsiblePanelSx}>
          <AccordionSummary
            expandIcon={<ExpandMoreRoundedIcon sx={{ color: "#facc15" }} />}
            sx={{ px: { xs: 2, md: 3 }, py: 1.1 }}
          >
            <Box>
              <Typography sx={{ color: "rgba(255,226,153,0.85)", fontSize: "0.76rem", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 800 }}>
                Store Settings
              </Typography>
              <Typography variant="h6" sx={{ color: "white", fontWeight: 800, mt: 0.2 }}>
                Visibility + Payment Instructions
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.72)", mt: 0.45 }}>
                Enable/disable store, pickup location text, and manual payment details.
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ px: { xs: 2, md: 3 }, pb: { xs: 2, md: 3 }, pt: 0 }}>
            <Box component="form" onSubmit={saveSettings}>
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settingsState.is_enabled}
                    onChange={(event) =>
                      setSettingsState((prev) => ({ ...prev, is_enabled: event.target.checked }))
                    }
                  />
                }
                label={<Typography sx={{ color: "white", fontWeight: 600 }}>Store enabled</Typography>}
              />

              <TextField
                label="Pickup location / instructions"
                value={settingsState.pickup_instructions ?? ""}
                onChange={(event) =>
                  setSettingsState((prev) => ({ ...prev, pickup_instructions: event.target.value }))
                }
                multiline
                minRows={3}
                fullWidth
                sx={fieldSx}
              />

              <Paper sx={{ borderRadius: 2, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(0,0,0,0.22)", p: 2 }}>
                <Typography sx={{ color: "white", fontWeight: 700, mb: 1.4 }}>Venmo Details</Typography>
                <Stack spacing={1.5}>
                  <TextField
                    label="Venmo username"
                    value={settingsState.venmo_username ?? ""}
                    onChange={(event) =>
                      setSettingsState((prev) => ({ ...prev, venmo_username: event.target.value }))
                    }
                    fullWidth
                    sx={fieldSx}
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} alignItems={{ sm: "center" }}>
                    <Button component="label" variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.3)", color: "white" }}>
                      Upload Venmo QR
                      <input
                        hidden
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const next = event.target.files?.[0] ?? null;
                          setVenmoQrFile(next);
                        }}
                      />
                    </Button>
                    <Typography sx={{ color: "rgba(255,255,255,0.72)", fontSize: "0.85rem" }}>
                      {venmoQrFile ? venmoQrFile.name : "No new QR file selected"}
                    </Typography>
                  </Stack>
                  {settingsState.venmo_qr_image_url && (
                    <Box
                      sx={{
                        width: 140,
                        height: 140,
                        borderRadius: 2,
                        border: "1px solid rgba(255,255,255,0.2)",
                        backgroundImage: `url(${settingsState.venmo_qr_image_url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  )}
                </Stack>
              </Paper>

              <Paper sx={{ borderRadius: 2, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(0,0,0,0.22)", p: 2 }}>
                <Typography sx={{ color: "white", fontWeight: 700, mb: 1.4 }}>Zelle Details</Typography>
                <Stack spacing={1.5}>
                  <TextField
                    label="Zelle email/phone"
                    value={settingsState.zelle_handle ?? ""}
                    onChange={(event) =>
                      setSettingsState((prev) => ({ ...prev, zelle_handle: event.target.value }))
                    }
                    fullWidth
                    sx={fieldSx}
                  />
                  <TextField
                    label="Zelle recipient name"
                    value={settingsState.zelle_display_name ?? ""}
                    onChange={(event) =>
                      setSettingsState((prev) => ({ ...prev, zelle_display_name: event.target.value }))
                    }
                    fullWidth
                    sx={fieldSx}
                  />
                </Stack>
              </Paper>

              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.2}>
                <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem" }}>
                  Last updated: {settingsState.updated_at ? formatDateTime(settingsState.updated_at) : "Not yet saved"}
                </Typography>
                <Button
                  type="submit"
                  disabled={savingSettings}
                  variant="contained"
                  sx={{ alignSelf: { xs: "flex-start", sm: "auto" }, bgcolor: "#facc15", color: "#1e1208", fontWeight: 800, "&:hover": { bgcolor: "#fde047" } }}
                >
                  {savingSettings ? "Saving..." : "Save Settings"}
                </Button>
              </Stack>
            </Stack>
          </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion disableGutters sx={collapsiblePanelSx}>
          <AccordionSummary
            expandIcon={<ExpandMoreRoundedIcon sx={{ color: "#facc15" }} />}
            sx={{ px: { xs: 2, md: 3 }, py: 1.1 }}
          >
            <Box>
              <Typography sx={{ color: "rgba(255,226,153,0.85)", fontSize: "0.76rem", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 800 }}>
                Treasurer Contact
              </Typography>
              <Typography variant="h6" sx={{ color: "white", fontWeight: 800, mt: 0.2 }}>
                Notification Recipient
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.72)", mt: 0.45 }}>
                New order alerts are sent to the active treasurer contact.
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ px: { xs: 2, md: 3 }, pb: { xs: 2, md: 3 }, pt: 0 }}>
            <Box component="form" onSubmit={saveTreasurer}>
            <Stack spacing={2}>
              {contactsState.length > 0 && (
                <FormControl fullWidth sx={fieldSx}>
                  <InputLabel id="treasurer-select-label">Existing treasurer records</InputLabel>
                  <Select
                    labelId="treasurer-select-label"
                    label="Existing treasurer records"
                    value={selectedContactId}
                    onChange={(event) => setSelectedContactId(String(event.target.value))}
                  >
                    {contactsState.map((contact) => (
                      <MenuItem key={contact.id} value={contact.id}>
                        {contact.name} ({contact.email}) {contact.is_active ? "• active" : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <TextField
                label="Name"
                value={treasurerName}
                onChange={(event) => setTreasurerName(event.target.value)}
                required
                fullWidth
                sx={fieldSx}
              />

              <TextField
                label="Email"
                type="email"
                value={treasurerEmail}
                onChange={(event) => setTreasurerEmail(event.target.value)}
                required
                fullWidth
                sx={fieldSx}
              />

              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.2}>
                <Typography sx={{ color: "rgba(255,255,255,0.62)", fontSize: "0.83rem" }}>
                  Active treasurer: {activeTreasurer ? activeTreasurer.name : "Not set"}
                </Typography>
                <Button
                  type="submit"
                  disabled={savingTreasurer}
                  variant="contained"
                  sx={{ alignSelf: { xs: "flex-start", sm: "auto" }, bgcolor: "#facc15", color: "#1e1208", fontWeight: 800, "&:hover": { bgcolor: "#fde047" } }}
                >
                  {savingTreasurer ? "Saving..." : "Save Treasurer"}
                </Button>
              </Stack>
            </Stack>
          </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion disableGutters sx={collapsiblePanelSx}>
          <AccordionSummary
            expandIcon={<ExpandMoreRoundedIcon sx={{ color: "#facc15" }} />}
            sx={{ px: { xs: 2, md: 3 }, py: 1.1 }}
          >
            <Box>
              <Typography sx={{ color: "rgba(255,226,153,0.85)", fontSize: "0.76rem", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 800 }}>
                Products
              </Typography>
              <Typography variant="h6" sx={{ color: "white", fontWeight: 800, mt: 0.2 }}>
                Merch Catalog
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.72)", mt: 0.45 }}>
                Create, edit, activate/deactivate, and archive products.
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ px: { xs: 2, md: 3 }, pb: { xs: 2, md: 3 }, pt: 0 }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="flex-end" spacing={1.2} sx={{ mb: 2 }}>
            <Button
              type="button"
              variant="outlined"
              onClick={() => {
                setSelectedProductId("new");
                setProductForm({ ...EMPTY_PRODUCT_FORM });
                setProductImageDraftsWithCleanup([]);
                setProductColorDrafts([]);
                setThumbnailDraftId("");
              }}
              sx={{ alignSelf: { xs: "flex-start", md: "center" }, borderColor: "rgba(255,255,255,0.28)", color: "white" }}
            >
              New Product
            </Button>
          </Stack>

          <TableContainer sx={{ borderRadius: 2, border: "1px solid rgba(255,255,255,0.12)", mb: 2 }}>
            <Table size="small">
              <TableHead sx={{ background: "rgba(0,0,0,0.24)" }}>
                <TableRow>
                  <TableCell sx={{ color: "rgba(255,255,255,0.72)", textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.08em" }}>Product</TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.72)", textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.08em" }}>Price</TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.72)", textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.08em" }}>Status</TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.72)", textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.08em" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {productsState.map((product) => (
                  <TableRow key={product.id} sx={{ "& td": { borderColor: "rgba(255,255,255,0.08)" } }}>
                    <TableCell>
                      <Typography sx={{ color: "white", fontWeight: 700 }}>{product.name}</Typography>
                      <Typography sx={{ color: "rgba(255,255,255,0.62)", fontSize: "0.78rem" }}>{product.description || "No description"}</Typography>
                      <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.74rem", mt: 0.35 }}>
                        Images: {product.images.length > 0 ? product.images.length : product.image_url ? 1 : 0}
                      </Typography>
                      <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.74rem", mt: 0.15 }}>
                        Colors: {product.colors?.length ?? 0}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: "white" }}>{formatUsdFromCents(product.price_cents)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={product.is_active ? "active" : "archived"}
                        sx={{
                          color: product.is_active ? "#d1fae5" : "rgba(255,255,255,0.85)",
                          bgcolor: product.is_active ? "rgba(16,185,129,0.28)" : "rgba(255,255,255,0.14)",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Button size="small" variant="outlined" onClick={() => setSelectedProductId(product.id)} sx={{ borderColor: "rgba(255,255,255,0.28)", color: "white" }}>
                          Edit
                        </Button>
                        {product.is_active ? (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            disabled={archivingProductId === product.id}
                            onClick={() => setProductActive(product.id, false)}
                          >
                            {archivingProductId === product.id ? "Archiving..." : "Archive"}
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            disabled={archivingProductId === product.id}
                            onClick={() => setProductActive(product.id, true)}
                          >
                            {archivingProductId === product.id ? "Restoring..." : "Restore"}
                          </Button>
                        )}
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          disabled={deletingProductId === product.id}
                          onClick={() => deleteProduct(product.id)}
                        >
                          {deletingProductId === product.id ? "Deleting..." : "Delete"}
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {productsState.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ color: "rgba(255,255,255,0.72)", textAlign: "center" }}>
                      No products yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Paper sx={{ borderRadius: 2, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(0,0,0,0.22)", p: 2 }}>
            <Typography variant="h6" sx={{ color: "white", fontWeight: 700, mb: 1.8 }}>
              {selectedProductId === "new" ? "Create Product" : "Edit Product"}
            </Typography>

            <Box component="form" onSubmit={saveProduct}>
              <Stack spacing={1.6}>
                <TextField
                  label="Name"
                  value={productForm.name}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                  fullWidth
                  sx={fieldSx}
                />
                <TextField
                  label="Description"
                  value={productForm.description}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))}
                  fullWidth
                  multiline
                  minRows={3}
                  sx={fieldSx}
                />
                <TextField
                  label="Price (USD)"
                  type="number"
                  inputProps={{ min: 0.01, step: 0.01 }}
                  value={productForm.priceDollars}
                  onChange={(event) => setProductForm((prev) => ({ ...prev, priceDollars: event.target.value }))}
                  required
                  fullWidth
                  sx={fieldSx}
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} alignItems={{ sm: "center" }}>
                  <Button component="label" variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.3)", color: "white" }}>
                    Upload Images
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) => {
                        appendProductImages(event.target.files);
                        event.target.value = "";
                      }}
                    />
                  </Button>
                  <Typography sx={{ color: "rgba(255,255,255,0.72)", fontSize: "0.85rem" }}>
                    {productImageDrafts.length === 0
                      ? "No images selected"
                      : `${productImageDrafts.length} image${productImageDrafts.length === 1 ? "" : "s"} selected`}
                  </Typography>
                </Stack>
                <Paper sx={{ borderRadius: 2, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(0,0,0,0.22)", p: 1.4 }}>
                  <Typography sx={{ color: "white", fontWeight: 700, mb: 1.2 }}>Image Gallery</Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.66)", fontSize: "0.82rem", mb: 1.2 }}>
                    Set one thumbnail for storefront cards. Reorder images for gallery arrows.
                  </Typography>

                  {productImageDrafts.length === 0 ? (
                    <Typography sx={{ color: "rgba(255,255,255,0.66)", fontSize: "0.84rem" }}>
                      Upload one or more images to create the product gallery.
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {productImageDrafts.map((draft, index) => {
                        const isThumbnail = draft.id === thumbnailDraftId;
                        return (
                          <Box
                            key={draft.id}
                            sx={{
                              borderRadius: 2,
                              border: "1px solid rgba(255,255,255,0.18)",
                              background: "rgba(255,255,255,0.07)",
                              p: 1,
                              display: "grid",
                              gridTemplateColumns: "86px 1fr",
                              gap: 1,
                              alignItems: "center",
                            }}
                          >
                            <Box
                              component="img"
                              src={draft.previewUrl}
                              alt={`Product image ${index + 1}`}
                              sx={{
                                width: 86,
                                height: 86,
                                borderRadius: 1.4,
                                objectFit: "cover",
                                border: "1px solid rgba(255,255,255,0.24)",
                                backgroundColor: "rgba(0,0,0,0.3)",
                              }}
                            />
                            <Stack spacing={0.6}>
                              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                <Typography sx={{ color: "rgba(255,255,255,0.9)", fontSize: "0.84rem", fontWeight: 700 }}>
                                  Image {index + 1}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={isThumbnail ? "Thumbnail" : "Gallery"}
                                  sx={{
                                    color: isThumbnail ? "#422006" : "rgba(255,255,255,0.84)",
                                    bgcolor: isThumbnail ? "rgba(250,204,21,0.95)" : "rgba(255,255,255,0.14)",
                                    fontWeight: 700,
                                  }}
                                />
                                <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.72rem" }}>
                                  {draft.source === "new" ? "New upload" : "Saved image"}
                                </Typography>
                              </Stack>
                              <Stack direction="row" spacing={0.8} alignItems="center">
                                <Tooltip title={isThumbnail ? "Current thumbnail" : "Set as thumbnail"}>
                                  <span>
                                    <IconButton
                                      size="small"
                                      onClick={() => setThumbnailDraftId(draft.id)}
                                      sx={{ color: isThumbnail ? "#facc15" : "rgba(255,255,255,0.74)" }}
                                    >
                                      {isThumbnail ? <StarRoundedIcon fontSize="small" /> : <StarOutlineRoundedIcon fontSize="small" />}
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Move left">
                                  <span>
                                    <IconButton
                                      size="small"
                                      disabled={index === 0}
                                      onClick={() => moveProductImage(draft.id, "left")}
                                      sx={{ color: "rgba(255,255,255,0.78)" }}
                                    >
                                      <ArrowBackRoundedIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Move right">
                                  <span>
                                    <IconButton
                                      size="small"
                                      disabled={index === productImageDrafts.length - 1}
                                      onClick={() => moveProductImage(draft.id, "right")}
                                      sx={{ color: "rgba(255,255,255,0.78)" }}
                                    >
                                      <ArrowForwardRoundedIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Remove image">
                                  <span>
                                    <IconButton
                                      size="small"
                                      onClick={() => removeProductImage(draft.id)}
                                      sx={{ color: "rgba(254,202,202,0.9)" }}
                                    >
                                      <DeleteOutlineRoundedIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Stack>
                            </Stack>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </Paper>

                <Paper sx={{ borderRadius: 2, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(0,0,0,0.22)", p: 1.4 }}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.2} sx={{ mb: 1 }}>
                    <Box>
                      <Typography sx={{ color: "white", fontWeight: 700 }}>Color Variants</Typography>
                      <Typography sx={{ color: "rgba(255,255,255,0.66)", fontSize: "0.82rem", mt: 0.35 }}>
                        Add preset colors, then map each color to a preview image used on the storefront.
                      </Typography>
                    </Box>
                    <Button
                      type="button"
                      variant="outlined"
                      startIcon={<AddRoundedIcon />}
                      onClick={addColorVariant}
                      sx={{ borderColor: "rgba(255,255,255,0.28)", color: "white", alignSelf: { xs: "flex-start", sm: "auto" } }}
                    >
                      Add Color
                    </Button>
                  </Stack>

                  {productColorDrafts.length === 0 ? (
                    <Typography sx={{ color: "rgba(255,255,255,0.66)", fontSize: "0.84rem" }}>
                      No color variants set. Customers will still be able to purchase without selecting a color.
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {productColorDrafts.map((colorDraft, index) => {
                        const matchedPreset = COLOR_PRESETS.find((preset) => preset.name.toLowerCase() === colorDraft.name.toLowerCase());
                        const previewOptions = dedupeUrls(
                          productImageDrafts.map((draft) => draft.previewUrl).concat(colorDraft.previewImageUrl || "")
                        );

                        return (
                          <Box
                            key={colorDraft.id}
                            sx={{
                              borderRadius: 2,
                              border: "1px solid rgba(255,255,255,0.16)",
                              background: "rgba(255,255,255,0.05)",
                              p: 1.1,
                              display: "grid",
                              gap: 1,
                            }}
                          >
                            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                              <FormControl fullWidth size="small" sx={fieldSx}>
                                <InputLabel id={`color-preset-${colorDraft.id}`}>Preset</InputLabel>
                                <Select
                                  labelId={`color-preset-${colorDraft.id}`}
                                  label="Preset"
                                  value={matchedPreset?.name ?? "custom"}
                                  onChange={(event) => {
                                    const value = String(event.target.value);
                                    if (value === "custom") return;
                                    const preset = COLOR_PRESETS.find((entry) => entry.name === value);
                                    if (!preset) return;
                                    updateColorVariant(colorDraft.id, (draft) => ({
                                      ...draft,
                                      name: preset.name,
                                      hexColor: preset.hex,
                                    }));
                                  }}
                                >
                                  {COLOR_PRESETS.map((preset) => (
                                    <MenuItem key={preset.name} value={preset.name}>
                                      {preset.name} ({preset.hex})
                                    </MenuItem>
                                  ))}
                                  <MenuItem value="custom">Custom</MenuItem>
                                </Select>
                              </FormControl>

                              <TextField
                                label="Color name"
                                value={colorDraft.name}
                                onChange={(event) =>
                                  updateColorVariant(colorDraft.id, (draft) => ({ ...draft, name: event.target.value }))
                                }
                                size="small"
                                fullWidth
                                sx={fieldSx}
                              />

                              <TextField
                                label="Hex"
                                value={colorDraft.hexColor}
                                onChange={(event) =>
                                  updateColorVariant(colorDraft.id, (draft) => ({ ...draft, hexColor: event.target.value.toUpperCase() }))
                                }
                                size="small"
                                sx={{ ...fieldSx, minWidth: { xs: "100%", md: 138 } }}
                              />
                            </Stack>

                            <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
                              <FormControl fullWidth size="small" sx={fieldSx}>
                                <InputLabel id={`color-preview-${colorDraft.id}`}>Preview image</InputLabel>
                                <Select
                                  labelId={`color-preview-${colorDraft.id}`}
                                  label="Preview image"
                                  value={colorDraft.previewImageUrl || "__auto__"}
                                  onChange={(event) => {
                                    const value = String(event.target.value);
                                    updateColorVariant(colorDraft.id, (draft) => ({
                                      ...draft,
                                      previewImageUrl: value === "__auto__" ? null : value,
                                    }));
                                  }}
                                >
                                  <MenuItem value="__auto__">Use product thumbnail</MenuItem>
                                  {previewOptions.map((url, previewIndex) => (
                                    <MenuItem key={`${colorDraft.id}-preview-${previewIndex}`} value={url}>
                                      {`Gallery image ${previewIndex + 1}`}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>

                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Box
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: "999px",
                                    border: "1px solid rgba(255,255,255,0.32)",
                                    backgroundColor: normalizeHexColor(colorDraft.hexColor),
                                    boxShadow: "0 0 0 1px rgba(0,0,0,0.28) inset",
                                  }}
                                />
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={colorDraft.isActive}
                                      onChange={(event) =>
                                        updateColorVariant(colorDraft.id, (draft) => ({
                                          ...draft,
                                          isActive: event.target.checked,
                                        }))
                                      }
                                    />
                                  }
                                  label={<Typography sx={{ color: "rgba(255,255,255,0.88)" }}>Active</Typography>}
                                />
                                <Button
                                  type="button"
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  startIcon={<DeleteOutlineRoundedIcon fontSize="small" />}
                                  onClick={() => removeColorVariant(colorDraft.id)}
                                >
                                  Remove
                                </Button>
                              </Box>
                            </Stack>
                            <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.72rem" }}>
                              Variant {index + 1}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </Paper>
                <FormControlLabel
                  control={
                    <Switch
                      checked={productForm.isActive}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                    />
                  }
                  label={<Typography sx={{ color: "white" }}>Active product</Typography>}
                />
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="flex-end" spacing={1.2}>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => {
                      setSelectedProductId("new");
                      setProductForm({ ...EMPTY_PRODUCT_FORM });
                      setProductImageDraftsWithCleanup([]);
                      setProductColorDrafts([]);
                      setThumbnailDraftId("");
                    }}
                    sx={{ borderColor: "rgba(255,255,255,0.28)", color: "white" }}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={savingProduct}
                    sx={{ bgcolor: "#facc15", color: "#1e1208", fontWeight: 800, "&:hover": { bgcolor: "#fde047" } }}
                  >
                    {savingProduct ? "Saving..." : "Save Product"}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Paper>
          </AccordionDetails>
        </Accordion>

      </Stack>

      <Dialog
        open={orderDeleteDialog.open}
        onClose={closeDeleteOrderDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            border: "1px solid rgba(255,255,255,0.16)",
            background: "rgba(22,8,8,0.95)",
            color: "white",
            backdropFilter: "blur(8px)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#fecaca" }}>Delete order from fulfillment queue?</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1.4 }}>
          <Typography sx={{ color: "rgba(255,255,255,0.84)" }}>
            This permanently removes the order record and purchase history for this checkout.
          </Typography>
          {orderDeleteDialog.order?.status === "in_progress" && (
            <Alert severity="warning" sx={{ bgcolor: "rgba(245,158,11,0.12)", color: "#fde68a", border: "1px solid rgba(245,158,11,0.4)" }}>
              This order is currently in progress. Deleting it can break fulfillment tracking and audit history.
            </Alert>
          )}
          <Alert severity="info" sx={{ bgcolor: "rgba(59,130,246,0.12)", color: "#bfdbfe", border: "1px solid rgba(59,130,246,0.4)" }}>
            Are you sure? It is usually best to keep order history for records and future disputes.
          </Alert>
          <FormControlLabel
            control={
              <Checkbox
                checked={orderDeleteDialog.confirmed}
                onChange={(event) =>
                  setOrderDeleteDialog((prev) => ({ ...prev, confirmed: event.target.checked }))
                }
                sx={{
                  color: "rgba(255,255,255,0.82)",
                  "&.Mui-checked": { color: "#ffffff" },
                }}
              />
            }
            label={
              <Typography sx={{ color: "rgba(255,255,255,0.9)" }}>
                I understand this deletion is permanent and may remove important purchase history.
              </Typography>
            }
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.2 }}>
          <Button
            type="button"
            onClick={closeDeleteOrderDialog}
            disabled={Boolean(deletingOrderId)}
            sx={{ color: "rgba(255,255,255,0.8)" }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            color="error"
            variant="contained"
            disabled={!orderDeleteDialog.confirmed || Boolean(deletingOrderId)}
            onClick={deleteOrder}
          >
            {deletingOrderId ? "Deleting..." : "Delete Order"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={readyPickupDialog.open}
        onClose={closeReadyPickupDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            border: "1px solid rgba(255,255,255,0.16)",
            background: "rgba(22,8,8,0.95)",
            color: "white",
            backdropFilter: "blur(8px)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#d1fae5" }}>
          Mark order ready for pickup?
        </DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1.4 }}>
          <Typography sx={{ color: "rgba(255,255,255,0.84)" }}>
            This moves the order to <strong>ready for pickup</strong> and sends the customer a pickup email.
          </Typography>
          <Alert severity="info" sx={{ bgcolor: "rgba(59,130,246,0.12)", color: "#bfdbfe", border: "1px solid rgba(59,130,246,0.4)" }}>
            Confirm only when the order is fully prepared and available for pickup.
          </Alert>
          <FormControlLabel
            control={
              <Checkbox
                checked={readyPickupDialog.confirmed}
                onChange={(event) =>
                  setReadyPickupDialog((prev) => ({ ...prev, confirmed: event.target.checked }))
                }
                sx={{
                  color: "rgba(255,255,255,0.82)",
                  "&.Mui-checked": { color: "#ffffff" },
                }}
              />
            }
            label={
              <Typography sx={{ color: "rgba(255,255,255,0.9)" }}>
                I confirm this order is ready, and customer pickup notification can be sent now.
              </Typography>
            }
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.2 }}>
          <Button
            type="button"
            onClick={closeReadyPickupDialog}
            disabled={Boolean(updatingOrderId)}
            sx={{ color: "rgba(255,255,255,0.8)" }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="contained"
            disabled={!readyPickupDialog.confirmed || Boolean(updatingOrderId)}
            onClick={confirmReadyForPickup}
            sx={{ bgcolor: "#22c55e", "&:hover": { bgcolor: "#16a34a" } }}
          >
            {updatingOrderId ? "Updating..." : "Mark Ready for Pickup"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={pickedUpDialog.open}
        onClose={closePickedUpDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            border: "1px solid rgba(255,255,255,0.16)",
            background: "rgba(22,8,8,0.95)",
            color: "white",
            backdropFilter: "blur(8px)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#e9d5ff" }}>
          Mark order as picked up?
        </DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1.4 }}>
          <Typography sx={{ color: "rgba(255,255,255,0.84)" }}>
            This marks the order as <strong>picked up</strong> and sends the final customer email.
          </Typography>
          <Alert severity="warning" sx={{ bgcolor: "rgba(245,158,11,0.12)", color: "#fde68a", border: "1px solid rgba(245,158,11,0.4)" }}>
            Confirm only after the customer has physically received the order.
          </Alert>
          <FormControlLabel
            control={
              <Checkbox
                checked={pickedUpDialog.confirmed}
                onChange={(event) =>
                  setPickedUpDialog((prev) => ({ ...prev, confirmed: event.target.checked }))
                }
                sx={{
                  color: "rgba(255,255,255,0.82)",
                  "&.Mui-checked": { color: "#ffffff" },
                }}
              />
            }
            label={
              <Typography sx={{ color: "rgba(255,255,255,0.9)" }}>
                I confirm the customer has picked up this order.
              </Typography>
            }
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.2 }}>
          <Button
            type="button"
            onClick={closePickedUpDialog}
            disabled={Boolean(updatingOrderId)}
            sx={{ color: "rgba(255,255,255,0.8)" }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="contained"
            disabled={!pickedUpDialog.confirmed || Boolean(updatingOrderId)}
            onClick={confirmPickedUp}
            sx={{ bgcolor: "#a855f7", "&:hover": { bgcolor: "#9333ea" } }}
          >
            {updatingOrderId ? "Updating..." : "Mark Picked Up"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
