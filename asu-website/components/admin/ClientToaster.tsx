"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ClientToaster() {
    return (
        <ToastContainer
            position="top-right"
            autoClose={2200}
            newestOnTop
            closeOnClick
            pauseOnHover
            theme="dark"
        />
    );
}
