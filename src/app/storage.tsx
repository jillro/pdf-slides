"use server";

export type Post = {
  id: string;
  img: string | null; // data-url
  title: string;
  intro: string;
  rubrique: string;
  slidesContent: string[];
  position: "top" | "bottom";
};

const memory: { [key: string]: Post } = {};

export async function getPost(id: string) {
  return (
    memory[id] || {
      id,
      img: null,
      title: "",
      intro: "",
      rubrique: "",
      slidesContent: [],
      position: "top",
    }
  );
}

export async function savePost(post: Post) {
  "use server";

  memory[post.id] = post;
}
