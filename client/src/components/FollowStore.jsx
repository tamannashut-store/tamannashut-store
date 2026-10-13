import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { rememberAuthReturn } from "../utils/authReturn";
export default function FollowStore({ store }) {
  const navigate = useNavigate();
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(() => { try { return Boolean(JSON.parse(localStorage.getItem("user"))?.token); } catch { return false; } });
  const [error, setError] = useState("");
  const endpoint = `${import.meta.env.PROD ? "" : import.meta.env.VITE_API_URL}/api/stores/${store.id}/follow`;
  const session = () => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } };
  const signIn = () => { rememberAuthReturn(); sessionStorage.setItem("followStoreAfterLogin", store.id); navigate("/login"); };
  useEffect(() => {
    let active = true;
    const user = session();
    if (!user?.token) return;
    const pending = sessionStorage.getItem("followStoreAfterLogin") === store.id;
    axios({ url: endpoint, method: pending ? "put" : "get", headers: { Authorization: `Bearer ${user.token}` } })
      .then(({ data }) => { if (active) { setFollowing(data.following); window.dispatchEvent(new CustomEvent("store-follow-changed", { detail: { id: store.id, followerCount: data.followerCount } })); if (pending) sessionStorage.removeItem("followStoreAfterLogin"); } })
      .catch((e) => { if (active) setError(e.response?.status === 401 ? "Please sign in again to follow this store." : e.response?.data?.message || "Could not load your follow status. Please try again."); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [endpoint, store.id]);
  const toggle = async () => {
    const user = session();
    if (!user?.token) return signIn();
    setBusy(true); setError("");
    try { const { data } = await axios({ url: endpoint, method: following ? "delete" : "put", headers: { Authorization: `Bearer ${user.token}` } }); setFollowing(data.following); window.dispatchEvent(new CustomEvent("store-follow-changed", { detail: { id: store.id, followerCount: data.followerCount } })); }
    catch (e) { if (e.response?.status === 401) return signIn(); setError(e.response?.data?.message || "Could not update your follow. Please try again."); }
    finally { setBusy(false); }
  };
  return <div className="mt-5"><button type="button" onClick={toggle} disabled={busy} aria-pressed={following} className={following ? "btn-secondary" : "btn-primary"}>{busy ? "Please wait…" : following ? "Following · Unfollow" : "Follow store"}</button>{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}</div>;
}
