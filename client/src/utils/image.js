const cloudinaryUploadUrl = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.hostname === "res.cloudinary.com" && parsed.pathname.includes("/upload/");
  } catch {
    return false;
  }
};

export const optimizedImage = (url, width = 800) => {
  if (!cloudinaryUploadUrl(url)) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto:eco,c_limit,w_${width}/`);
};

export const imageSrcSet = (url, widths = [360, 640, 900, 1200]) => (
  cloudinaryUploadUrl(url)
    ? widths.map((width) => `${optimizedImage(url, width)} ${width}w`).join(", ")
    : undefined
);
