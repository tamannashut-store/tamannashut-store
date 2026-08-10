export const optimizedImage = (url, width = 800) => {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/f_auto,q_auto:eco,c_limit,w_${width}/`);
};

export const imageSrcSet = (url, widths = [360, 640, 900, 1200]) => (
  url?.includes("res.cloudinary.com")
    ? widths.map((width) => `${optimizedImage(url, width)} ${width}w`).join(", ")
    : undefined
);
