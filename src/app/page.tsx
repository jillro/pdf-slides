import { redirect, RedirectType } from "next/navigation";

function Page() {
  const id = Math.random().toString(36).substring(7);

  redirect(`/${id}`, RedirectType.replace);
}

export default Page;
