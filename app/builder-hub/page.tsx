import { redirect } from "next/navigation";

const BUILDER_HUB_URL = "https://arc-builder-hub-theta.vercel.app/";

export default function BuilderHubRedirect() {
  redirect(BUILDER_HUB_URL);
}
