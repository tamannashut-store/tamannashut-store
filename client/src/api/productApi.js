import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.PROD ? "/api" : `${import.meta.env.VITE_API_URL}/api`
});

export const getProducts = (params = {}) => API.get("/products", { params });
