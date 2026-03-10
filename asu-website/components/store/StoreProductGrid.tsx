"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Stack,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { formatUsdFromCents } from "@/lib/store";
import {
  STORE_CART_OPEN_EVENT,
  STORE_CART_OPEN_SESSION_KEY,
  readStoreCartItems,
  writeStoreCartItems,
} from "@/lib/storeCart";

type StoreProduct = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  images?: StoreProductImage[];
  colors?: StoreProductColor[];
};

type StoreProductImage = {
  id: string;
  image_url: string;
  is_thumbnail: boolean | null;
  sort_order: number | null;
};

type StoreProductColor = {
  id: string;
  name: string;
  hex_color: string;
  preview_image_url: string | null;
  is_active: boolean;
  sort_order: number | null;
};

type CartItem = {
  key: string;
  productId: string;
  name: string;
  priceCents: number;
  imageUrl: string;
  size: string;
  colorId: string | null;
  colorName: string | null;
  colorHex: string | null;
  quantity: number;
};

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CartItem>;
  return (
    typeof item.key === "string" &&
    typeof item.productId === "string" &&
    typeof item.name === "string" &&
    typeof item.priceCents === "number" &&
    Number.isFinite(item.priceCents) &&
      typeof item.imageUrl === "string" &&
      typeof item.size === "string" &&
      (typeof item.colorId === "string" || item.colorId === null || typeof item.colorId === "undefined") &&
      (typeof item.colorName === "string" || item.colorName === null || typeof item.colorName === "undefined") &&
      (typeof item.colorHex === "string" || item.colorHex === null || typeof item.colorHex === "undefined") &&
      typeof item.quantity === "number" &&
      Number.isFinite(item.quantity)
  );
}

const SIZE_OPTIONS = ["S", "M", "L", "XL", "2XL"];

const SIZE_GUIDE_ROWS = [
  { size: "S", length: "26.38", shoulder: "19.68", chest: "20.87", sleeveLength: "7.09" },
  { size: "M", length: "27.17", shoulder: "20.47", chest: "21.65", sleeveLength: "7.48" },
  { size: "L", length: "27.95", shoulder: "21.26", chest: "22.44", sleeveLength: "7.87" },
  { size: "XL", length: "28.74", shoulder: "22.05", chest: "23.23", sleeveLength: "8.27" },
  { size: "2XL", length: "29.53", shoulder: "22.83", chest: "24.02", sleeveLength: "8.66" },
];

const FALLBACK_CARD_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#771313"/>
        <stop offset="100%" stop-color="#2a0606"/>
      </linearGradient>
    </defs>
    <rect width="900" height="900" fill="url(#g)"/>
    <text x="50%" y="47%" text-anchor="middle" fill="#ffe48f" font-size="74" font-family="Arial, sans-serif" font-weight="700" letter-spacing="5">ASU</text>
    <text x="50%" y="56%" text-anchor="middle" fill="#ffe48f" font-size="58" font-family="Arial, sans-serif" font-weight="700" letter-spacing="4">MERCH</text>
  </svg>`
)}`;

function clampQuantity(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(99, Math.max(1, Math.trunc(value)));
}

function normalizeSize(value: string) {
  return SIZE_OPTIONS.includes(value) ? value : "M";
}

function uniqueUrls(urls: string[]) {
  const next: string[] = [];
  const seen = new Set<string>();
  for (const value of urls) {
    if (!value || seen.has(value)) continue;
    seen.add(value);
    next.push(value);
  }
  return next;
}

function getProductImages(product: StoreProduct) {
  const fromGallery = product.images ?? [];
  const sortedGallery = [...fromGallery].sort((a, b) => {
    const leftSort = a.sort_order ?? Number.MAX_SAFE_INTEGER;
    const rightSort = b.sort_order ?? Number.MAX_SAFE_INTEGER;
    if (leftSort !== rightSort) return leftSort - rightSort;
    return a.id.localeCompare(b.id);
  });

  if (sortedGallery.length === 0) {
    return product.image_url ? [product.image_url] : [FALLBACK_CARD_IMAGE];
  }

  const ordered = uniqueUrls(sortedGallery.map((image) => image.image_url));
  const thumbnailUrl = sortedGallery.find((image) => image.is_thumbnail)?.image_url;
  if (thumbnailUrl) {
    const index = ordered.indexOf(thumbnailUrl);
    if (index > 0) {
      ordered.splice(index, 1);
      ordered.unshift(thumbnailUrl);
    }
  }
  return ordered;
}

function getActiveProductColors(product: StoreProduct) {
  return (product.colors ?? [])
    .filter((color) => color.is_active)
    .sort((left, right) => {
      const leftSort = left.sort_order ?? Number.MAX_SAFE_INTEGER;
      const rightSort = right.sort_order ?? Number.MAX_SAFE_INTEGER;
      if (leftSort !== rightSort) return leftSort - rightSort;
      return left.id.localeCompare(right.id);
    });
}

function getColorById(product: StoreProduct | null, colorId: string | null) {
  if (!product || !colorId) return null;
  return getActiveProductColors(product).find((color) => color.id === colorId) ?? null;
}

function wrapIndex(current: number, length: number, direction: 1 | -1) {
  if (length <= 1) return 0;
  return (current + direction + length) % length;
}

export default function StoreProductGrid({
  products,
}: {
  products: StoreProduct[];
}) {
  const router = useRouter();

  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    return readStoreCartItems()
      .filter(isCartItem)
      .map((item) => ({
        ...item,
        size: normalizeSize(item.size),
        colorId: item.colorId ?? null,
        colorName: item.colorName ?? null,
        colorHex: item.colorHex ?? null,
        quantity: clampQuantity(item.quantity),
      }));
  });

  const [optionsOpen, setOptionsOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
  const [previewColorByProduct, setPreviewColorByProduct] = useState<Record<string, string | null>>({});

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.priceCents * item.quantity, 0),
    [cartItems]
  );

  const openOptions = (product: StoreProduct) => {
    const activeColors = getActiveProductColors(product);
    const previewColorId = previewColorByProduct[product.id] ?? null;
    const defaultColorId =
      activeColors.find((color) => color.id === previewColorId)?.id ??
      activeColors[0]?.id ??
      null;
    setSelectedProduct(product);
    setSelectedImageIndex(0);
    setSelectedQuantity(1);
    setSelectedSize("M");
    setSelectedColorId(defaultColorId);
    setOptionsOpen(true);
  };

  const selectedColor = getColorById(selectedProduct, selectedColorId);
  const selectedImages = !selectedProduct
    ? [FALLBACK_CARD_IMAGE]
    : (() => {
        const baseImages = getProductImages(selectedProduct);
        if (!selectedColor?.preview_image_url) return baseImages;
        return uniqueUrls([selectedColor.preview_image_url, ...baseImages]);
      })();
  const selectedActiveImageIndex = Math.min(
    Math.max(selectedImageIndex, 0),
    Math.max(selectedImages.length - 1, 0)
  );
  const selectedPreviewImage = selectedImages[selectedActiveImageIndex] || FALLBACK_CARD_IMAGE;

  useEffect(() => {
    const handleOpenCart = () => setCartOpen(true);
    window.addEventListener(STORE_CART_OPEN_EVENT, handleOpenCart as EventListener);

    if (window.sessionStorage.getItem(STORE_CART_OPEN_SESSION_KEY) === "1") {
      window.sessionStorage.removeItem(STORE_CART_OPEN_SESSION_KEY);
      window.setTimeout(() => setCartOpen(true), 0);
    }

    return () => {
      window.removeEventListener(STORE_CART_OPEN_EVENT, handleOpenCart as EventListener);
    };
  }, []);

  useEffect(() => {
    writeStoreCartItems(cartItems);
  }, [cartItems]);

  const addToCart = () => {
    if (!selectedProduct) return;

    const quantity = clampQuantity(selectedQuantity);
    const imageUrl = selectedPreviewImage || FALLBACK_CARD_IMAGE;
    const color = getColorById(selectedProduct, selectedColorId);
    const matchKey = `${selectedProduct.id}:${selectedSize}:${color?.id ?? "no-color"}`;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.key === matchKey);
      if (existing) {
        return prev.map((item) =>
          item.key === matchKey
            ? {
                ...item,
                quantity: clampQuantity(item.quantity + quantity),
              }
            : item
        );
      }

      return [
        {
          key: matchKey,
          productId: selectedProduct.id,
          name: selectedProduct.name,
          priceCents: selectedProduct.price_cents,
          imageUrl,
          size: selectedSize,
          colorId: color?.id ?? null,
          colorName: color?.name ?? null,
          colorHex: color?.hex_color ?? null,
          quantity,
        },
        ...prev,
      ];
    });

    setOptionsOpen(false);
    setCartOpen(true);
  };

  const updateCartQuantity = (key: string, quantity: number) => {
    const nextQuantity = clampQuantity(quantity);
    setCartItems((prev) => prev.map((item) => (item.key === key ? { ...item, quantity: nextQuantity } : item)));
  };

  const updateCartSize = (key: string, nextSize: string) => {
    setCartItems((prev) => {
      const current = prev.find((item) => item.key === key);
      if (!current) return prev;
      if (current.size === nextSize) return prev;

      const nextKey = `${current.productId}:${nextSize}:${current.colorId ?? "no-color"}`;
      const existing = prev.find((item) => item.key === nextKey);

      if (!existing) {
        return prev.map((item) => (item.key === key ? { ...item, size: nextSize, key: nextKey } : item));
      }

      return prev
        .filter((item) => item.key !== key && item.key !== nextKey)
        .concat({
          ...existing,
          quantity: clampQuantity(existing.quantity + current.quantity),
        });
    });
  };

  const removeCartItem = (key: string) => {
    setCartItems((prev) => prev.filter((item) => item.key !== key));
  };

  return (
    <>
      <Box
        sx={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
          gap: 3,
        }}
      >
        {products.map((product) => {
          const imageUrls = getProductImages(product);
          const activeColors = getActiveProductColors(product);
          const selectedPreviewColorId = previewColorByProduct[product.id] ?? null;
          const selectedPreviewColor =
            activeColors.find((color) => color.id === selectedPreviewColorId) ?? activeColors[0] ?? null;
          const hasMultipleImages = imageUrls.length > 1;
          const baseImage = selectedPreviewColor?.preview_image_url || imageUrls[0] || FALLBACK_CARD_IMAGE;
          const hoverImage = imageUrls[1] || baseImage;
          const imageSrc =
            hasMultipleImages && hoveredProductId === product.id
              ? hoverImage
              : baseImage;

          return (
            <Box
              key={product.id}
              sx={{
                position: "relative",
                borderRadius: "18px",
                border: "1px solid rgba(255,255,255,0.25)",
                background: "rgba(255,255,255,0.16)",
                backdropFilter: "blur(10px)",
                boxShadow: "0 8px 26px rgba(0,0,0,0.25)",
                p: 1.6,
                display: "grid",
                gap: 1.2,
              }}
            >
              <Box
                sx={{ cursor: "pointer", position: "relative" }}
                onMouseEnter={() => setHoveredProductId(product.id)}
                onMouseLeave={() => setHoveredProductId((prev) => (prev === product.id ? null : prev))}
                onClick={() => openOptions(product)}
              >
                <Box
                  component="img"
                  src={imageSrc}
                  alt={`${product.name} product image`}
                  sx={{
                    width: "100%",
                    height: 320,
                    objectFit: "cover",
                    display: "block",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.28)",
                    backgroundColor: "rgba(20, 0, 0, 0.24)",
                    transition: "filter 180ms ease, transform 220ms ease",
                  }}
                />
              </Box>

              <Box sx={{ px: 0.6, display: "grid", gap: 1 }}>
                <Typography sx={{ color: "white", fontWeight: 800, fontSize: "1.08rem", lineHeight: 1.2 }}>
                  {product.name}
                </Typography>

                {activeColors.length > 0 && (
                  <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap">
                    {activeColors.map((color) => {
                      const selected = selectedPreviewColor?.id === color.id;
                      return (
                        <Tooltip key={color.id} title={color.name}>
                          <IconButton
                            size="small"
                            onClick={(event) => {
                              event.stopPropagation();
                              setPreviewColorByProduct((prev) => ({ ...prev, [product.id]: color.id }));
                            }}
                            sx={{
                              width: 26,
                              height: 26,
                              border: selected
                                ? "2px solid rgba(255,255,255,0.95)"
                                : "1px solid rgba(255,255,255,0.45)",
                              backgroundColor: color.hex_color,
                              boxShadow: selected ? "0 0 0 2px rgba(250,204,21,0.5)" : "none",
                              "&:hover": {
                                backgroundColor: color.hex_color,
                                borderColor: "rgba(255,255,255,0.95)",
                              },
                            }}
                            aria-label={`Preview ${color.name}`}
                          />
                        </Tooltip>
                      );
                    })}
                  </Stack>
                )}

                <Typography sx={{ color: "#ffe48f", fontWeight: 900, fontSize: "1.15rem" }}>
                  {formatUsdFromCents(product.price_cents)}
                </Typography>

                <Button
                  onClick={() => openOptions(product)}
                  sx={{
                    mt: 0.2,
                    borderRadius: "999px",
                    py: 0.95,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    background: "linear-gradient(90deg, #ffd700 0%, #ffea94 100%)",
                    color: "#4a0707",
                    "&:hover": {
                      background: "linear-gradient(90deg, #ffe055 0%, #fff0b0 100%)",
                    },
                  }}
                >
                  Add To Cart
                </Button>
              </Box>
            </Box>
          );
        })}

      </Box>

      <Dialog
        open={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(45,8,8,0.9)",
            color: "white",
            backdropFilter: "blur(10px)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#ffe48f" }}>{selectedProduct?.name || "Select Options"}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1.4 }}>
          <Box
            sx={{
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.08)",
              p: 1.1,
              position: "relative",
            }}
          >
            <Box
              component="img"
              src={selectedPreviewImage}
              alt={selectedProduct ? `${selectedProduct.name} preview` : "Product preview"}
              sx={{
                width: "100%",
                height: 240,
                objectFit: "cover",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.2)",
                display: "block",
              }}
            />
            {selectedImages.length > 1 && (
              <>
                <IconButton
                  aria-label="Previous preview image"
                  size="small"
                  onClick={() => setSelectedImageIndex((prev) => wrapIndex(prev, selectedImages.length, -1))}
                  sx={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "white",
                    bgcolor: "rgba(0,0,0,0.44)",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.6)" },
                  }}
                >
                  <ChevronLeftRoundedIcon fontSize="small" />
                </IconButton>
                <IconButton
                  aria-label="Next preview image"
                  size="small"
                  onClick={() => setSelectedImageIndex((prev) => wrapIndex(prev, selectedImages.length, 1))}
                  sx={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "white",
                    bgcolor: "rgba(0,0,0,0.44)",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.6)" },
                  }}
                >
                  <ChevronRightRoundedIcon fontSize="small" />
                </IconButton>
                <Stack
                  direction="row"
                  spacing={0.8}
                  alignItems="center"
                  sx={{
                    position: "absolute",
                    left: "50%",
                    bottom: 12,
                    transform: "translateX(-50%)",
                    borderRadius: "999px",
                    px: 0.9,
                    py: 0.25,
                    bgcolor: "rgba(0,0,0,0.48)",
                    border: "1px solid rgba(255,255,255,0.24)",
                  }}
                >
                  <Typography sx={{ color: "white", fontWeight: 700, fontSize: "0.74rem" }}>
                    {selectedActiveImageIndex + 1}/{selectedImages.length}
                  </Typography>
                </Stack>
              </>
            )}
          </Box>

          <Box sx={{ display: "grid", gap: 0.6 }}>
            <Typography sx={{ fontSize: "0.84rem", color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
              Size
            </Typography>
            <Select
              value={selectedSize}
              onChange={(event) => setSelectedSize(String(event.target.value))}
              size="small"
              sx={{
                color: "white",
                borderRadius: "10px",
                ".MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.25)" },
                "& .MuiSvgIcon-root": { color: "#ffe48f" },
              }}
            >
              {SIZE_OPTIONS.map((size) => (
                <MenuItem key={size} value={size}>
                  {size}
                </MenuItem>
              ))}
            </Select>
          </Box>

          {selectedProduct && getActiveProductColors(selectedProduct).length > 0 && (
            <Box sx={{ display: "grid", gap: 0.6 }}>
              <Typography sx={{ fontSize: "0.84rem", color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                Color
              </Typography>
              <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap">
                {getActiveProductColors(selectedProduct).map((color) => {
                  const selected = selectedColorId === color.id;
                  return (
                    <Button
                      key={color.id}
                      onClick={() => {
                        setSelectedColorId(color.id);
                        setSelectedImageIndex(0);
                      }}
                      size="small"
                      sx={{
                        borderRadius: "999px",
                        textTransform: "none",
                        px: 1.1,
                        py: 0.45,
                        minHeight: 30,
                        color: "white",
                        border: selected
                          ? "1px solid rgba(255,255,255,0.95)"
                          : "1px solid rgba(255,255,255,0.24)",
                        backgroundColor: selected ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.05)",
                        "&:hover": {
                          borderColor: "rgba(255,255,255,0.9)",
                          backgroundColor: "rgba(255,255,255,0.15)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "999px",
                          backgroundColor: color.hex_color,
                          border: "1px solid rgba(255,255,255,0.5)",
                          mr: 0.6,
                        }}
                      />
                      {color.name}
                    </Button>
                  );
                })}
              </Stack>
            </Box>
          )}

          <Box sx={{ display: "grid", gap: 0.6 }}>
            <Typography sx={{ fontSize: "0.84rem", color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
              Quantity
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <button
                type="button"
                onClick={() => setSelectedQuantity((prev) => clampQuantity(prev - 1))}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.25)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#ffe48f",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={99}
                value={selectedQuantity}
                onChange={(event) => setSelectedQuantity(clampQuantity(Number(event.target.value)))}
                style={{
                  width: 74,
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.25)",
                  background: "rgba(0,0,0,0.3)",
                  color: "white",
                  padding: "6px 10px",
                  textAlign: "center",
                  fontWeight: 700,
                }}
              />
              <button
                type="button"
                onClick={() => setSelectedQuantity((prev) => clampQuantity(prev + 1))}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.25)",
                  background: "rgba(0,0,0,0.3)",
                  color: "#ffe48f",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                +
              </button>
            </Box>
          </Box>

          <Typography sx={{ color: "#ffe48f", fontWeight: 800 }}>
            {selectedProduct ? formatUsdFromCents(selectedProduct.price_cents * selectedQuantity) : ""}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.2 }}>
          <Button onClick={() => setOptionsOpen(false)} sx={{ color: "rgba(255,255,255,0.8)", fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            onClick={addToCart}
            sx={{
              borderRadius: "999px",
              px: 2.2,
              background: "linear-gradient(90deg, #ffd700 0%, #ffea94 100%)",
              color: "#4a0707",
              fontWeight: 800,
            }}
          >
            Add To Cart
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.22)",
            background: "rgba(45,8,8,0.94)",
            color: "white",
            backdropFilter: "blur(10px)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#ffe48f" }}>Size Guide</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.86rem", mb: 1.2 }}>
            Measurements shown in inches.
          </Typography>
          <TableContainer
            sx={{
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.08)",
            }}
          >
            <Table size="small">
              <TableHead sx={{ background: "rgba(255,255,255,0.1)" }}>
                <TableRow>
                  <TableCell sx={{ color: "white", fontWeight: 800 }}>Size</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 800 }}>Length</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 800 }}>Shoulder</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 800 }}>Chest</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 800 }}>Sleeve length</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {SIZE_GUIDE_ROWS.map((row) => (
                  <TableRow key={row.size} sx={{ "& td": { borderColor: "rgba(255,255,255,0.14)" } }}>
                    <TableCell sx={{ color: "white", fontWeight: 700 }}>{row.size}</TableCell>
                    <TableCell sx={{ color: "rgba(255,255,255,0.88)" }}>{row.length}</TableCell>
                    <TableCell sx={{ color: "rgba(255,255,255,0.88)" }}>{row.shoulder}</TableCell>
                    <TableCell sx={{ color: "rgba(255,255,255,0.88)" }}>{row.chest}</TableCell>
                    <TableCell sx={{ color: "rgba(255,255,255,0.88)" }}>{row.sleeveLength}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.2 }}>
          <Button onClick={() => setSizeGuideOpen(false)} sx={{ color: "rgba(255,255,255,0.82)", fontWeight: 700 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Drawer
        anchor="right"
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 430 },
            borderLeft: "1px solid rgba(255,255,255,0.16)",
            background: "linear-gradient(160deg, rgba(116,12,12,0.95), rgba(24,5,5,0.96))",
            color: "white",
            p: 2,
          },
        }}
      >
        <Typography sx={{ fontSize: "1.3rem", fontWeight: 900, color: "#ffe48f" }}>Cart</Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.78)", fontSize: "0.92rem", mb: 1.4 }}>
          Review options, then continue to checkout.
        </Typography>
        <Button
          type="button"
          variant="outlined"
          onClick={() => setSizeGuideOpen(true)}
          sx={{
            alignSelf: "flex-start",
            mb: 1.3,
            borderRadius: "999px",
            borderColor: "rgba(255,255,255,0.28)",
            color: "white",
            textTransform: "none",
            fontWeight: 700,
            "&:hover": { borderColor: "rgba(255,255,255,0.42)", bgcolor: "rgba(255,255,255,0.08)" },
          }}
        >
          Size Guide
        </Button>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.16)", mb: 1.4 }} />

        {cartItems.length === 0 ? (
          <Box
            sx={{
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(255,255,255,0.06)",
              p: 2,
              color: "rgba(255,255,255,0.8)",
            }}
          >
            Your cart is empty.
          </Box>
        ) : (
          <Box sx={{ display: "grid", gap: 1.2 }}>
            {cartItems.map((item) => {
              return (
                <Box
                  key={item.key}
                  sx={{
                    borderRadius: "14px",
                    border: "1px solid rgba(255,255,255,0.16)",
                    background: "rgba(255,255,255,0.08)",
                    p: 1.2,
                    display: "grid",
                    gap: 0.9,
                  }}
                >
                  <Box sx={{ display: "grid", gridTemplateColumns: "64px 1fr", gap: 1 }}>
                    <Box
                      sx={{
                        height: 64,
                        borderRadius: "10px",
                        backgroundImage: `url(${item.imageUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        border: "1px solid rgba(255,255,255,0.2)",
                      }}
                    />
                    <Box>
                      <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>{item.name}</Typography>
                      {item.colorName && (
                        <Stack direction="row" spacing={0.6} alignItems="center" sx={{ mt: 0.4 }}>
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: "999px",
                              border: "1px solid rgba(255,255,255,0.55)",
                              backgroundColor: item.colorHex || "#ffffff",
                            }}
                          />
                          <Typography sx={{ color: "rgba(255,255,255,0.78)", fontSize: "0.75rem" }}>
                            {item.colorName}
                          </Typography>
                        </Stack>
                      )}
                      <Typography sx={{ color: "#ffe48f", fontWeight: 800, mt: 0.3 }}>
                        {formatUsdFromCents(item.priceCents * item.quantity)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.8 }}>
                    <Select
                      value={item.size}
                      size="small"
                      onChange={(event) => updateCartSize(item.key, String(event.target.value))}
                      sx={{
                        color: "white",
                        borderRadius: "10px",
                        background: "rgba(0,0,0,0.22)",
                        ".MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.25)" },
                        "& .MuiSvgIcon-root": { color: "#ffe48f" },
                      }}
                    >
                      {SIZE_OPTIONS.map((size) => (
                        <MenuItem key={size} value={size}>
                          {size}
                        </MenuItem>
                      ))}
                    </Select>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.key, item.quantity - 1)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.25)",
                          background: "rgba(0,0,0,0.3)",
                          color: "#ffe48f",
                          cursor: "pointer",
                          fontWeight: 800,
                        }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={item.quantity}
                        onChange={(event) => updateCartQuantity(item.key, Number(event.target.value))}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.25)",
                          background: "rgba(0,0,0,0.3)",
                          color: "white",
                          padding: "6px 8px",
                          textAlign: "center",
                          fontWeight: 700,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.key, item.quantity + 1)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.25)",
                          background: "rgba(0,0,0,0.3)",
                          color: "#ffe48f",
                          cursor: "pointer",
                          fontWeight: 800,
                        }}
                      >
                        +
                      </button>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap" }}>
                    <Button
                      onClick={() => removeCartItem(item.key)}
                      sx={{
                        borderRadius: "999px",
                        px: 1.8,
                        border: "1px solid rgba(255,255,255,0.28)",
                        color: "white",
                        textTransform: "uppercase",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                      }}
                    >
                      Remove
                    </Button>
                  </Box>
                </Box>
              );
            })}

            <Divider sx={{ borderColor: "rgba(255,255,255,0.16)", mt: 0.4 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.78)", fontWeight: 700 }}>
                Cart Total
              </Typography>
              <Typography sx={{ color: "#ffe48f", fontSize: "1.2rem", fontWeight: 900 }}>
                {formatUsdFromCents(cartTotal)}
              </Typography>
            </Box>
            <Button
              onClick={() => {
                setCartOpen(false);
                router.push("/store/checkout");
              }}
              sx={{
                borderRadius: "999px",
                py: 1.1,
                textTransform: "uppercase",
                fontWeight: 900,
                letterSpacing: "0.08em",
                background: "linear-gradient(90deg, #ffd700 0%, #ffea94 100%)",
                color: "#4a0707",
                "&:hover": {
                  background: "linear-gradient(90deg, #ffe055 0%, #fff0b0 100%)",
                },
              }}
            >
              Checkout
            </Button>
          </Box>
        )}
      </Drawer>
    </>
  );
}
