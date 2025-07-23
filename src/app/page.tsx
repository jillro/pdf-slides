import { redirect, RedirectType } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function Page() {
  const id = Math.random().toString(36).substring(7);

  redirect(`/${id}`, RedirectType.replace);
}

export default Page;
