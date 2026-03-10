import Link from "next/link";
import { Box } from "@mui/material";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import StoreProductGrid from "@/components/store/StoreProductGrid";
import GradientText from "@/components/store/GradientText";
import CurvedLoop from "@/components/store/CurvedLoop";
import type { ProductRow } from "@/lib/store";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function StorePage() {
  const [settingsResult, productsResult] = await Promise.all([
    supabaseAdmin
      .from("store_settings")
      .select("id,is_enabled")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("products")
      .select("id,name,description,price_cents,image_url,is_active,created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  if (settingsResult.error) {
    console.error("Failed to load store settings", settingsResult.error);
  }
  if (productsResult.error) {
    console.error("Failed to load products", productsResult.error);
  }

  const isStoreEnabled = settingsResult.data?.is_enabled === true;

  if (!isStoreEnabled) {
    return (
      <main className="flex min-h-screen w-full justify-center pb-24 md:pb-32" style={{ paddingTop: "clamp(12rem, 18vh, 20rem)" }}>
        <div className="w-full max-w-3xl px-4">
          <div className="rounded-3xl border border-white/15 bg-white/10 px-8 py-10 text-white shadow-2xl backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/80">ASU Store</p>
            <h1 className="mt-2 text-3xl font-extrabold text-white">Store currently closed</h1>
            <p className="mt-3 text-white/80">
              Merch preorders are not open right now. Check back soon, or contact an ASU officer for the next drop.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-300"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  type ProductImage = {
    id: string;
    product_id: string;
    image_url: string;
    sort_order: number | null;
    is_thumbnail: boolean | null;
    created_at: string;
  };

  type ProductColor = {
    id: string;
    product_id: string;
    name: string;
    hex_color: string;
    preview_image_url: string | null;
    is_active: boolean;
    sort_order: number | null;
    created_at: string;
  };

  const baseProducts = (productsResult.data ?? []) as Pick<
    ProductRow,
    "id" | "name" | "description" | "price_cents" | "image_url" | "created_at"
  >[];
  const productIds = baseProducts.map((product) => product.id);

  const [{ data: productImagesData, error: productImagesError }, { data: productColorsData, error: productColorsError }] =
    await Promise.all([
      productIds.length === 0
        ? Promise.resolve({ data: [] as ProductImage[], error: null })
        : supabaseAdmin
            .from("store_product_images")
            .select("id,product_id,image_url,sort_order,is_thumbnail,created_at")
            .in("product_id", productIds)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true }),
      productIds.length === 0
        ? Promise.resolve({ data: [] as ProductColor[], error: null })
        : supabaseAdmin
            .from("product_colors")
            .select("id,product_id,name,hex_color,preview_image_url,is_active,sort_order,created_at")
            .in("product_id", productIds)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true }),
    ]);

  const missingImagesTable =
    productImagesError?.code === "42P01" ||
    String(productImagesError?.message || "").toLowerCase().includes("store_product_images");

  if (productImagesError && !missingImagesTable) {
    console.error("Failed to load product images", productImagesError);
  }

  const missingColorsTable =
    productColorsError?.code === "42P01" ||
    String(productColorsError?.message || "").toLowerCase().includes("product_colors");

  if (productColorsError && !missingColorsTable) {
    console.error("Failed to load product colors", productColorsError);
  }

  const imagesByProduct = new Map<string, ProductImage[]>();
  for (const image of (productImagesData ?? []) as ProductImage[]) {
    const existing = imagesByProduct.get(image.product_id) ?? [];
    existing.push(image);
    imagesByProduct.set(image.product_id, existing);
  }

  const colorsByProduct = new Map<string, ProductColor[]>();
  for (const color of (productColorsData ?? []) as ProductColor[]) {
    const existing = colorsByProduct.get(color.product_id) ?? [];
    existing.push(color);
    colorsByProduct.set(color.product_id, existing);
  }

  const products = baseProducts.map((product) => {
    const images = imagesByProduct.get(product.id) ?? [];
    const colors = colorsByProduct.get(product.id) ?? [];
    if (images.length > 0) {
      return { ...product, images, colors };
    }
    if (!product.image_url) {
      return { ...product, images: [], colors };
    }
    return {
      ...product,
      colors,
      images: [
        {
          id: `legacy-${product.id}`,
          product_id: product.id,
          image_url: product.image_url,
          sort_order: 0,
          is_thumbnail: true,
          created_at: product.created_at,
        },
      ],
    };
  });

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100dvh",
        display: "flex",
        justifyContent: "center",
        px: { xs: 2, md: 4 },
        pb: 10,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 1220, display: "grid", gap: 2.2 }}>
        <Box
          sx={{
            width: "100dvw",
            ml: "calc(50% - 50dvw)",
            px: { xs: 0.8, md: 0.2 },
            mt: { xs: 0.35, md: 0.2 },
            mb: 1.2,
            minHeight: { xs: 166, md: 212 },
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            gap: 0,
            overflow: "visible",
          }}
        >
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              transform: { xs: "translateY(6px)", md: "translateY(8px)" },
              "& .store-gradient-top": {
                fontSize: "clamp(0.95rem, 4.5vw, 3.9rem)",
                fontWeight: 900,
                letterSpacing: "0.11em",
                textTransform: "uppercase",
                lineHeight: 1.05,
                backdropFilter: "none",
                WebkitBackdropFilter: "none",
              },
            }}
          >
            <Box sx={{ px: { xs: 1, md: 1.5 } }}>
              <GradientText
                colors={["#c61f1f", "#f04b3a", "#c61f1f"]}
                animationSpeed={8}
                showBorder={false}
                className="store-gradient-top"
              >
                ASIAN STUDENT UNION
              </GradientText>
            </Box>
          </Box>
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              mt: { xs: -1.7, md: -2.4 },
              "& .store-gradient-bottom": {
                fontSize: "clamp(1.7rem, 7.4vw, 5.8rem)",
                fontWeight: 900,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                lineHeight: 1,
                backdropFilter: "none",
                WebkitBackdropFilter: "none",
              },
            }}
          >
            <GradientText
              colors={["#f8cb3d", "#ffe487", "#f8cb3d"]}
              animationSpeed={8}
              showBorder={false}
              className="store-gradient-bottom"
            >
              STORE
            </GradientText>
          </Box>
        </Box>

        <Box
          sx={{
            width: "100dvw",
            ml: "calc(50% - 50dvw)",
            mt: { xs: -9.6, md: -18.2 },
            mb: { xs: 0.6, md: -0.8 },
            px: 0,
            "& .curved-loop-jacket": {
              minHeight: { xs: "52px", md: "86px" },
            },
            "& .curved-loop-svg": {
              fontSize: { xs: "1.04rem", md: "2.62rem" },
              fill: "#ffffff",
              opacity: { xs: 0.85, md: 0.9 },
              letterSpacing: { xs: "0.025em", md: "0.06em" },
            },
          }}
        >
          <CurvedLoop
            marqueeText="ACCEPTING ORDERS ✦ SECURE PAYMENT ✦ ONLINE CHECKOUT ✦ YOU WILL BE NOTIFIED WHEN THE ORDER IS READY FOR PICK UP IN THE ASU ROOM ✦"
            speed={1.6}
            curveAmount={260}
            direction="left"
            interactive
            className="store-curved-loop-text"
          />
        </Box>

        <Box sx={{ mt: { xs: 16, md: 22 } }}>
          {products.length === 0 ? (
            <Box
              sx={{
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.1)",
                color: "white",
                px: 2.4,
                py: 2,
              }}
            >
              No products are active right now. Please check back soon.
            </Box>
          ) : (
            <StoreProductGrid products={products} />
          )}
        </Box>
      </Box>
    </Box>
  );
}
