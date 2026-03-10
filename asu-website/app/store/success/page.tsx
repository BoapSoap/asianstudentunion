import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";

export default function StoreSuccessPage() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        pt: "clamp(12rem, 18vh, 20rem)",
        pb: { xs: 10, md: 12 },
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 960, px: { xs: 2, md: 3 } }}>
        <Paper
          sx={{
            borderRadius: "22px",
            border: "1px solid rgba(251,191,36,0.28)",
            background: "linear-gradient(140deg, rgba(80,10,10,0.58), rgba(18,6,6,0.82))",
            backdropFilter: "blur(10px)",
            boxShadow: "0 14px 36px rgba(0,0,0,0.32)",
            p: { xs: 2.4, md: 3.2 },
            color: "white",
          }}
        >
          <Typography
            sx={{
              color: "rgba(255,226,153,0.9)",
              fontSize: "0.78rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: 800,
            }}
          >
            ASU Store
          </Typography>

          <Typography sx={{ mt: 0.5, fontSize: { xs: "2rem", md: "2.6rem" }, fontWeight: 900, color: "#fef3c7" }}>
            Order confirmed
          </Typography>

          <Typography sx={{ mt: 1.2, color: "rgba(255,255,255,0.88)", fontSize: { xs: "0.97rem", md: "1.08rem" } }}>
            Your order was received. ASU will verify payment, then email you as your order moves through fulfillment.
          </Typography>

          <Alert
            severity="warning"
            sx={{
              mt: 1.5,
              borderRadius: 2,
              bgcolor: "rgba(245,158,11,0.12)",
              color: "#fde68a",
              border: "1px solid rgba(245,158,11,0.42)",
              "& .MuiAlert-icon": { color: "#facc15" },
            }}
          >
            PAY ATTENTION TO YOUR EMAIL. You will be notified when the order is ready for pick up in the ASU room.
          </Alert>

          <Stack
            spacing={1}
            sx={{
              mt: 2,
              p: 1.6,
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(0,0,0,0.24)",
            }}
          >
            <Typography sx={{ color: "rgba(255,255,255,0.88)" }}>1. Order received (payment pending verification)</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.88)" }}>2. Payment verified + in progress</Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.88)" }}>
              3. You will be notified when the order is ready for pick up in the ASU room.
            </Typography>
          </Stack>

          <Box
            sx={{
              mt: 1.6,
              p: 1.4,
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(255,255,255,0.06)",
            }}
          >
            <Typography sx={{ color: "rgba(255,255,255,0.9)", fontWeight: 700 }}>
              Questions?
            </Typography>
            <Typography sx={{ mt: 0.4, color: "rgba(255,255,255,0.82)" }}>
              Reach out on Instagram: <strong>@asianstudentunion.org</strong>
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ mt: 2.1 }}>
            <Button
              href="/store"
              variant="contained"
              sx={{
                borderRadius: 2,
                bgcolor: "#facc15",
                color: "#1f1206",
                textTransform: "none",
                fontWeight: 800,
                px: 2.1,
                py: 0.9,
                "&:hover": { bgcolor: "#fde047" },
              }}
            >
              Keep Shopping
            </Button>
            <Button
              href="/"
              variant="outlined"
              sx={{
                borderRadius: 2,
                borderColor: "rgba(255,255,255,0.28)",
                color: "white",
                textTransform: "none",
                fontWeight: 700,
                px: 2.1,
                py: 0.9,
                "&:hover": { borderColor: "rgba(255,255,255,0.4)", bgcolor: "rgba(255,255,255,0.08)" },
              }}
            >
              Home
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
