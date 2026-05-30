import { redirect } from "next/navigation";
import * as ROUTES from "../../constants/routes";

export default function ProfileRedirect() {
  redirect(ROUTES.PROFILES);
}
