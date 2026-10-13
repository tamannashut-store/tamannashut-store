export const safeReturnPath = (value) => typeof value === "string" && /^\/(?![\\/])/.test(value) && ![...value].some((char) => char.charCodeAt(0) < 32) && !/^\/(login|register)(?:[/?#]|$)/.test(value) ? value : "/";
export const rememberAuthReturn = () => sessionStorage.setItem("redirectAfterLogin", safeReturnPath(`${window.location.pathname}${window.location.search}${window.location.hash}`));
export const consumeAuthReturn = () => { const path = safeReturnPath(sessionStorage.getItem("redirectAfterLogin")); sessionStorage.removeItem("redirectAfterLogin"); return path; };
