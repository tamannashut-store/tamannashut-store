import axios from "axios";
import { requestWithRetry } from "../utils/retryRequest";

const API = axios.create({
  baseURL: import.meta.env.PROD ? "/api" : `${import.meta.env.VITE_API_URL}/api`
});

export const getProducts = (params = {}, {
  signal,
  onRetry,
  attempts = 3,
} = {}) => requestWithRetry(
  () => API.get("/products", { params, signal, timeout: 25000 }),
  {
    attempts,
    delays: [2000, 5000],
    signal,
    onRetry,
  }
);
