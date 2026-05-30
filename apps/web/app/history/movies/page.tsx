import { redirect } from "next/navigation";
import * as ROUTES from "../../../constants/routes";

export default function MovieHistoryRedirect() {
  redirect(ROUTES.HISTORY);
}
