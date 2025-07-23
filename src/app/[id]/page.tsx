import AppView from "../../components/AppView";
import { getPost } from "../storage";

async function Page(params: { id: string }) {
  const { id } = params;
  const post = await getPost(id);

  return <AppView post={post} />;
}

export default Page;
