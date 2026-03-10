"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { formatUsdFromCents } from "@/lib/store";
import { readStoreCartItems, writeStoreCartItems } from "@/lib/storeCart";

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

type PaymentMethod = "venmo" | "zelle";

type StoreSettings = {
  is_enabled: boolean;
  pickup_instructions: string | null;
  venmo_username: string | null;
  venmo_qr_image_url: string | null;
  zelle_handle: string | null;
  zelle_display_name: string | null;
};
const DEFAULT_PICKUP_INSTRUCTIONS =
  "You will be notified when the order is ready for pick up in the ASU room.";

const pagePadTop = "clamp(11rem, 16vh, 18rem)";

const frostedCardSx = {
  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,0.22)",
  background: "linear-gradient(140deg, rgba(255,255,255,0.14), rgba(255,255,255,0.07))",
  backdropFilter: "blur(10px)",
  boxShadow: "0 12px 34px rgba(0,0,0,0.28)",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    color: "white",
    borderRadius: "12px",
    background: "rgba(0,0,0,0.28)",
    "& fieldset": { borderColor: "rgba(255,255,255,0.22)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.34)" },
    "&.Mui-focused fieldset": { borderColor: "rgba(255,219,112,0.75)" },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.78)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "rgba(255,219,112,0.95)" },
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

function clampQuantity(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(99, Math.max(1, Math.trunc(value)));
}

export default function StoreCheckoutPage() {
  const router = useRouter();

  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [cartItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    return readStoreCartItems()
      .filter(isCartItem)
      .map((item) => ({
        ...item,
        colorId: item.colorId ?? null,
        colorName: item.colorName ?? null,
        colorHex: item.colorHex ?? null,
        quantity: clampQuantity(item.quantity),
      }));
  });

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("venmo");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [didPay, setDidPay] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const response = await fetch("/api/store/settings", { cache: "no-store" });
        const payload = (await response.json()) as { settings?: StoreSettings; error?: string };

        if (!response.ok || !payload.settings) {
          throw new Error(payload.error || "Failed to load store settings");
        }

        if (!active) return;

        setSettings(payload.settings);

        const methods: PaymentMethod[] = [];
        if (payload.settings.venmo_username?.trim()) methods.push("venmo");
        if (payload.settings.zelle_handle?.trim()) methods.push("zelle");

        if (methods.length > 0) {
          setPaymentMethod(methods[0]);
        }
      } catch (error) {
        if (!active) return;
        setErrorMessage(error instanceof Error ? error.message : "Failed to load checkout settings");
      } finally {
        if (active) {
          setLoadingSettings(false);
        }
      }
    }

    void loadSettings();

    return () => {
      active = false;
    };
  }, []);

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.priceCents * item.quantity, 0),
    [cartItems]
  );

  const availableMethods = useMemo<PaymentMethod[]>(() => {
    if (!settings) return [];
    const methods: PaymentMethod[] = [];
    if (settings.venmo_username?.trim()) methods.push("venmo");
    if (settings.zelle_handle?.trim()) methods.push("zelle");
    return methods;
  }, [settings]);

  const pickupInstructions = settings?.pickup_instructions?.trim() || DEFAULT_PICKUP_INSTRUCTIONS;

  async function submitOrder() {
    setErrorMessage(null);

    if (!settings?.is_enabled) {
      setErrorMessage("Store is currently closed.");
      return;
    }

    if (cartItems.length === 0) {
      setErrorMessage("Your cart is empty.");
      return;
    }

    if (!customerEmail.trim()) {
      setErrorMessage("Please enter your personal email.");
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!availableMethods.includes(paymentMethod)) {
      setErrorMessage("Selected payment method is unavailable.");
      return;
    }

    if (!paymentMessage.trim()) {
      setErrorMessage(
        "Please enter the payment message you used (example: First Last - Purchase reason)."
      );
      return;
    }

    if (!didPay) {
      setErrorMessage("Please confirm that payment has been sent.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          customer_email: customerEmail,
          payment_method: paymentMethod,
          payment_reference: paymentMessage,
          items: cartItems.map((item) => ({
            product_id: item.productId,
            quantity: item.quantity,
            size: item.size,
            color_id: item.colorId,
          })),
        }),
      });

      const payload = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Failed to confirm order");
      }

      writeStoreCartItems([]);
      router.push("/store/success");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to confirm order");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingSettings) {
    return (
      <Box component="main" sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", pt: pagePadTop, pb: { xs: 10, md: 12 } }}>
        <Box sx={{ width: "100%", maxWidth: 960, px: 2 }}>
          <Paper sx={{ ...frostedCardSx, p: 3 }}>
            <Typography sx={{ color: "white" }}>Loading checkout...</Typography>
          </Paper>
        </Box>
      </Box>
    );
  }

  if (!settings?.is_enabled) {
    return (
      <Box component="main" sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", pt: pagePadTop, pb: { xs: 10, md: 12 } }}>
        <Box sx={{ width: "100%", maxWidth: 760, px: 2 }}>
          <Paper sx={{ ...frostedCardSx, p: { xs: 3, md: 4 } }}>
            <Typography variant="h4" sx={{ color: "white", fontWeight: 800 }}>
              Store currently closed
            </Typography>
            <Typography sx={{ mt: 1.5, color: "rgba(255,255,255,0.82)" }}>Checkout is unavailable right now.</Typography>
            <Button
              component={Link}
              href="/store"
              sx={{ mt: 3, borderRadius: 2, bgcolor: "#facc15", color: "#1d0b0b", fontWeight: 800, px: 2.2, py: 0.9, "&:hover": { bgcolor: "#fde047" } }}
            >
              Back to Store
            </Button>
          </Paper>
        </Box>
      </Box>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Box component="main" sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", pt: pagePadTop, pb: { xs: 10, md: 12 } }}>
        <Box sx={{ width: "100%", maxWidth: 760, px: 2 }}>
          <Paper sx={{ ...frostedCardSx, p: { xs: 3, md: 4 } }}>
            <Typography variant="h4" sx={{ color: "white", fontWeight: 800 }}>
              Your cart is empty
            </Typography>
            <Typography sx={{ mt: 1.5, color: "rgba(255,255,255,0.82)" }}>
              Add items from the store before checking out.
            </Typography>
            <Button
              component={Link}
              href="/store"
              sx={{ mt: 3, borderRadius: 2, bgcolor: "#facc15", color: "#1d0b0b", fontWeight: 800, px: 2.2, py: 0.9, "&:hover": { bgcolor: "#fde047" } }}
            >
              Return to Store
            </Button>
          </Paper>
        </Box>
      </Box>
    );
  }

  return (
    <Box component="main" sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", pt: pagePadTop, pb: { xs: 10, md: 12 } }}>
      <Box sx={{ width: "100%", maxWidth: 1200, px: { xs: 2, md: 3 } }}>
        <Paper sx={{ ...frostedCardSx, p: { xs: 2.4, md: 3 }, mb: 2 }}>
          <Typography sx={{ color: "rgba(255,226,153,0.9)", fontSize: "0.78rem", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 800 }}>
            ASU Store
          </Typography>
          <Typography sx={{ mt: 0.5, color: "#fde68a", fontWeight: 900, fontSize: { xs: "1.9rem", md: "2.45rem" } }}>
            Checkout
          </Typography>
          <Typography sx={{ mt: 1, color: "rgba(255,255,255,0.82)", maxWidth: 860 }}>
            Complete payment using Venmo or Zelle, then confirm your order. ASU will verify payment before fulfillment.
          </Typography>
          <Alert
            severity="warning"
            sx={{
              mt: 1.4,
              borderRadius: 2,
              bgcolor: "rgba(245,158,11,0.12)",
              color: "#fde68a",
              border: "1px solid rgba(245,158,11,0.42)",
              "& .MuiAlert-icon": { color: "#facc15" },
            }}
          >
            PAY ATTENTION TO YOUR EMAIL. ASU will send updates there for payment verification, processing, and pickup readiness.
          </Alert>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
            <Chip label="1. Send payment" sx={{ bgcolor: "rgba(0,0,0,0.35)", color: "white", border: "1px solid rgba(255,255,255,0.18)", fontWeight: 700 }} />
            <Chip label="2. Confirm order" sx={{ bgcolor: "rgba(0,0,0,0.35)", color: "white", border: "1px solid rgba(255,255,255,0.18)", fontWeight: 700 }} />
            <Chip label="3. Watch email for pickup notice" sx={{ bgcolor: "rgba(0,0,0,0.35)", color: "white", border: "1px solid rgba(255,255,255,0.18)", fontWeight: 700 }} />
          </Stack>
        </Paper>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" } }}>
          <Paper sx={{ ...frostedCardSx, p: 2.4 }}>
            <Stack spacing={2}>
              <Box sx={{ p: 2, borderRadius: 2, border: "1px solid rgba(255,255,255,0.16)", bgcolor: "rgba(0,0,0,0.22)" }}>
                <Typography sx={{ mb: 1.2, color: "rgba(255,226,153,0.92)", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.8rem", fontWeight: 800 }}>
                  Contact
                </Typography>
                <Stack spacing={1.3}>
                  <TextField label="Full name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} required fullWidth sx={fieldSx} />
                  <TextField
                    label="Personal email"
                    type="email"
                    helperText="Use your personal email so ASU can reliably contact you."
                    value={customerEmail}
                    onChange={(event) => setCustomerEmail(event.target.value)}
                    required
                    fullWidth
                    sx={fieldSx}
                  />
                </Stack>
              </Box>

              <Box sx={{ p: 2, borderRadius: 2, border: "1px solid rgba(255,255,255,0.16)", bgcolor: "rgba(0,0,0,0.22)" }}>
                <Typography variant="h6" sx={{ color: "#fde68a", fontWeight: 800 }}>
                  Payment
                </Typography>
                <Typography sx={{ mt: 0.5, color: "rgba(255,255,255,0.76)", fontSize: "0.92rem" }}>
                  Send payment first using one of the methods below, then confirm order.
                </Typography>
                <Typography sx={{ mt: 0.5, color: "rgba(255,255,255,0.74)", fontSize: "0.83rem" }}>
                  In the Venmo/Zelle payment message, include your first and last name plus purchase reason.
                  Example: Jane Doe - Spring Gala Ticket.
                </Typography>

                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.4 }}>
                  {availableMethods.map((method) => (
                    <Button
                      key={method}
                      type="button"
                      variant={paymentMethod === method ? "contained" : "outlined"}
                      onClick={() => setPaymentMethod(method)}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 700,
                        ...(paymentMethod === method
                          ? {
                              bgcolor: "rgba(255,214,102,0.26)",
                              color: "#fef3c7",
                              border: "1px solid rgba(255,214,102,0.65)",
                              "&:hover": { bgcolor: "rgba(255,214,102,0.36)" },
                            }
                          : {
                              color: "rgba(255,255,255,0.85)",
                              borderColor: "rgba(255,255,255,0.26)",
                              "&:hover": { borderColor: "rgba(255,255,255,0.4)", bgcolor: "rgba(255,255,255,0.08)" },
                            }),
                      }}
                    >
                      {method === "venmo" ? "Venmo" : "Zelle"}
                    </Button>
                  ))}
                </Stack>

                {availableMethods.length === 0 ? (
                  <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 2 }}>
                    No payment methods are configured right now. Please contact ASU.
                  </Alert>
                ) : null}

                {paymentMethod === "venmo" && (
                  <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, border: "1px solid rgba(255,255,255,0.16)", bgcolor: "rgba(255,255,255,0.05)" }}>
                    <Typography sx={{ color: "rgba(255,255,255,0.9)", fontSize: "0.93rem" }}>
                      <strong>Venmo:</strong> {settings.venmo_username || "Not configured"}
                    </Typography>
                    {settings.venmo_qr_image_url ? (
                      <Box
                        role="img"
                        aria-label="Venmo QR code"
                        sx={{
                          mt: 1.2,
                          width: 208,
                          height: 208,
                          borderRadius: 2,
                          border: "1px solid rgba(255,255,255,0.2)",
                          backgroundImage: `url(${settings.venmo_qr_image_url})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                    ) : (
                      <Typography sx={{ mt: 1, color: "rgba(255,255,255,0.65)", fontSize: "0.8rem" }}>QR code not configured.</Typography>
                    )}
                  </Box>
                )}

                {paymentMethod === "zelle" && (
                  <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, border: "1px solid rgba(255,255,255,0.16)", bgcolor: "rgba(255,255,255,0.05)" }}>
                    <Typography sx={{ color: "rgba(255,255,255,0.9)", fontSize: "0.93rem" }}>
                      <strong>Zelle:</strong> {settings.zelle_handle || "Not configured"}
                    </Typography>
                    {settings.zelle_display_name ? (
                      <Typography sx={{ color: "rgba(255,255,255,0.82)", fontSize: "0.88rem", mt: 0.5 }}>
                        <strong>Recipient:</strong> {settings.zelle_display_name}
                      </Typography>
                    ) : null}
                  </Box>
                )}

                <TextField
                  label="Payment message used"
                  value={paymentMessage}
                  onChange={(event) => setPaymentMessage(event.target.value)}
                  fullWidth
                  sx={{ ...fieldSx, mt: 1.5 }}
                  placeholder="First Last - Purchase reason"
                />

                <FormControlLabel
                  sx={{ mt: 0.8, color: "rgba(255,255,255,0.9)" }}
                  control={<Checkbox checked={didPay} onChange={(event) => setDidPay(event.target.checked)} sx={{ color: "rgba(255,255,255,0.75)" }} />}
                  label="I sent payment and understand ASU will verify before processing."
                />
              </Box>

              <Box sx={{ p: 2, borderRadius: 2, border: "1px solid rgba(255,255,255,0.16)", bgcolor: "rgba(0,0,0,0.22)" }}>
                <Typography sx={{ color: "rgba(255,226,153,0.92)", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.8rem", fontWeight: 800 }}>
                  Pickup
                </Typography>
                <Typography sx={{ mt: 1, color: "rgba(255,255,255,0.85)" }}>{pickupInstructions}</Typography>
                <Typography sx={{ mt: 1, color: "rgba(255,255,255,0.78)", fontWeight: 700 }}>
                  You will be notified when the order is ready for pick up in the ASU room.
                </Typography>
              </Box>

              {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <Button
                  type="button"
                  onClick={submitOrder}
                  disabled={submitting}
                  variant="contained"
                  sx={{
                    borderRadius: 2,
                    fontWeight: 800,
                    textTransform: "none",
                    bgcolor: "#facc15",
                    color: "#2a1105",
                    px: 2.2,
                    py: 1,
                    "&:hover": { bgcolor: "#fde047" },
                  }}
                >
                  {submitting ? "Confirming..." : "Confirm Order"}
                </Button>
                <Button
                  component={Link}
                  href="/store"
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 700,
                    borderColor: "rgba(255,255,255,0.28)",
                    color: "white",
                    "&:hover": { borderColor: "rgba(255,255,255,0.45)", bgcolor: "rgba(255,255,255,0.08)" },
                  }}
                >
                  Back to Store
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <Paper sx={{ ...frostedCardSx, p: 2.4 }}>
            <Stack spacing={1.6}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <Typography variant="h6" sx={{ color: "#fde68a", fontWeight: 800 }}>
                  Order Summary
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {cartItems.length} item(s)
                </Typography>
              </Box>

              <Stack spacing={1}>
                {cartItems.map((item) => (
                  <Box
                    key={item.key}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "72px 1fr",
                      gap: 1.2,
                      p: 1.2,
                      borderRadius: 2,
                      border: "1px solid rgba(255,255,255,0.15)",
                      bgcolor: "rgba(0,0,0,0.24)",
                    }}
                  >
                    <Box
                      sx={{
                        height: 72,
                        borderRadius: 1.5,
                        border: "1px solid rgba(255,255,255,0.2)",
                        backgroundImage: `url(${item.imageUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                    <Box>
                      <Typography sx={{ color: "white", fontWeight: 700, lineHeight: 1.2 }}>{item.name}</Typography>
                      <Typography sx={{ mt: 0.6, color: "rgba(255,255,255,0.72)", fontSize: "0.78rem" }}>Size: {item.size}</Typography>
                      <Stack direction="row" spacing={0.7} alignItems="center" sx={{ mt: 0.35 }}>
                        <Typography sx={{ color: "rgba(255,255,255,0.72)", fontSize: "0.78rem" }}>
                          Color: {item.colorName || "—"}
                        </Typography>
                        {item.colorName && (
                          <Box
                            sx={{
                              width: 11,
                              height: 11,
                              borderRadius: "999px",
                              border: "1px solid rgba(255,255,255,0.5)",
                              backgroundColor: item.colorHex || "#ffffff",
                            }}
                          />
                        )}
                      </Stack>
                      <Typography sx={{ color: "rgba(255,255,255,0.72)", fontSize: "0.78rem" }}>Qty: {item.quantity}</Typography>
                      <Typography sx={{ mt: 0.6, color: "#fde68a", fontWeight: 800, fontSize: "0.95rem" }}>
                        {formatUsdFromCents(item.priceCents * item.quantity)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />

              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.2, borderRadius: 2, bgcolor: "rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.18)" }}>
                <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Total
                </Typography>
                <Typography sx={{ color: "#fde68a", fontWeight: 900, fontSize: "1.3rem" }}>
                  {formatUsdFromCents(cartTotal)}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
