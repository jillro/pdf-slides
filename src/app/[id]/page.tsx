import AppView from "../../components/AppView";
import { getPost } from "../storage";

async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);

  return <AppView post={post} />;
}

export default Page;
