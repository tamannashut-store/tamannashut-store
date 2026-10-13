import { useParams } from "react-router-dom";
import Shop from "./Shop";

export default function SellerStore() {
  const { storeId } = useParams();
  return <Shop key={storeId}/>;
}
