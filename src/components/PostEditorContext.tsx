"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import JSZip from "jszip";
import type Konva from "konva";
import useImage from "use-image";
import { useInterval } from "usehooks-ts";

import { Post, savePost } from "../app/storage";
import { createUploadUrl } from "../app/s3";
import { importFromWordPress } from "../app/wordpress";
import { MAX_FORMAT_HEIGHT } from "../lib/formats";
import { slideCount } from "../lib/slides";
import { createBlurredImage } from "../lib/blur";
import type { ContentBgThemeId } from "../lib/contentBgThemes";

async function resizeImage(imgBlob: Blob): Promise<string> {
  // Get image current height
  const img = new Image();
  img.src = URL.createObjectURL(imgBlob);
  await new Promise<void>((resolve) => (img.onload = () => resolve()));

  // Scale down the image to target height, keeping the aspect ratio
  const canvas = document.createElement("canvas");
  canvas.height = MAX_FORMAT_HEIGHT;
  canvas.width = (MAX_FORMAT_HEIGHT * img.width) / img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL();
}

async function uploadImage(postId: string, file: Blob): Promise<string> {
  const dataUrl = await resizeImage(file);
  const blob = await (await fetch(dataUrl)).blob();
  const ext = blob.type.split("/")[1] || "png";
  const presigned = await createUploadUrl({
    postId,
    contentType: blob.type,
    ext,
  });
  if (!presigned) return dataUrl;

  const res = await fetch(presigned.uploadUrl, {
    method: "PUT",
    body: blob,
    headers: { "Content-Type": blob.type },
  });
  if (!res.ok) throw new Error(`S3 upload failed: ${res.status}`);
  return presigned.publicUrl;
}

interface PostEditorContextValue {
  post: Post;
  unsaved: Partial<Post>;
  setField: <K extends keyof Post>(key: K, value: Post[K]) => void;
  setSlidesAndThemes: (content: string[], themes: ContentBgThemeId[]) => void;
  img: HTMLImageElement | undefined;
  blurredImg: HTMLImageElement | null;
  handleImageUpload: (file: File) => Promise<void>;
  currentSlide: number;
  setCurrentSlide: (slide: number) => void;
  wpLoading: boolean;
  wpError: string | null;
  setWpError: (error: string | null) => void;
  importWithContent: boolean;
  setImportWithContent: (value: boolean) => void;
  handleDownload: () => Promise<void>;
  handleWordPressImport: () => Promise<void>;
  stagesRef: MutableRefObject<unknown[]>;
}

const PostEditorContext = createContext<PostEditorContextValue | null>(null);

export function PostEditorProvider({
  post: initialPost,
  children,
}: {
  post: Post;
  children: ReactNode;
}) {
  const id = initialPost.id;

  const [post, setPost] = useState<Post>(initialPost);

  // Debounced save machinery
  const [scheduledChanges, setScheduledChanges] = useState<Partial<Post>>({});
  // Use a ref to capture changes atomically, avoiding stale closure issues
  const pendingChangesRef = useRef<Partial<Post>>({});

  const scheduleSave = useCallback(
    <K extends keyof Post>(key: K, value: Post[K]) => {
      // Update both ref (for immediate access in interval) and state (for UI)
      pendingChangesRef.current = {
        ...pendingChangesRef.current,
        [key]: value,
      };
      setScheduledChanges((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  useInterval(async () => {
    const changes = pendingChangesRef.current;
    if (Object.keys(changes).length === 0) return;
    // Clear ref immediately to capture any new changes during save
    pendingChangesRef.current = {};
    await savePost({ ...changes, id });
    setScheduledChanges({});
  }, 1000);

  const setField = useCallback(
    <K extends keyof Post>(key: K, value: Post[K]) => {
      setPost((p) => ({ ...p, [key]: value }));
      scheduleSave(key, value);
    },
    [scheduleSave],
  );

  const setSlidesAndThemes = useCallback(
    (content: string[], themes: ContentBgThemeId[]) => {
      setPost((p) => ({
        ...p,
        slidesContent: content,
        slideThemes: themes,
      }));
      scheduleSave("slidesContent", content);
      scheduleSave("slideThemes", themes);
    },
    [scheduleSave],
  );

  // Image state stays separate from the debounced Post object: it is saved
  // immediately (not through scheduleSave).
  const [imgDataUrl, setImgDataUrl] = useState<string>(initialPost.img || "");
  const [img] = useImage(imgDataUrl, "anonymous");
  const [blurredImg, setBlurredImg] = useState<HTMLImageElement | null>(null);

  // Generate blurred image when original image loads
  useEffect(() => {
    if (img) {
      createBlurredImage(img, 100).then(setBlurredImg);
    } else {
      setBlurredImg(null);
    }
  }, [img]);

  useEffect(() => {
    // This is only for saving the image
    (async () => {
      if (!imgDataUrl) return;
      await savePost({
        id,
        img: imgDataUrl,
      });
    })();
  }, [id, imgDataUrl]);

  const [currentSlide, setCurrentSlide] = useState<number>(0);

  // WordPress import transient state
  const [wpLoading, setWpLoading] = useState(false);
  const [wpError, setWpError] = useState<string | null>(null);
  const [importWithContent, setImportWithContent] = useState(true);

  const stagesRef = useRef<unknown[]>([]);

  const handleDownload = async () => {
    const isSingleSlide = slideCount(post.slidesContent, post.subForMore) === 1;
    const stages = stagesRef.current as Konva.Stage[];

    // Export at 2x the original canvas resolution regardless of display scale
    const getPixelRatio = (stage: Konva.Stage) => 2 / (stage.scaleX() || 1);

    if (isSingleSlide) {
      // Single slide: export as PNG directly
      const stage = stages[0];
      const blob = await stage.toBlob({ pixelRatio: getPixelRatio(stage) });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob as Blob);
      link.download = "slide.png";
      link.click();
    } else {
      // Multiple slides: export as ZIP of PNGs
      const zip = new JSZip();
      await Promise.all(
        stages.map(async (stage, i) => {
          zip.file(
            `${i}.png`,
            (await stage.toBlob({ pixelRatio: getPixelRatio(stage) })) as Blob,
          );
        }),
      );
      zip.generateAsync({ type: "blob" }).then((content) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = "slides.zip";
        link.click();
      });
    }
  };

  const handleWordPressImport = async () => {
    if (!post.wpUrl.trim()) {
      setWpError("URL invalide");
      return;
    }

    setWpLoading(true);
    setWpError(null);

    const result = await importFromWordPress(post.wpUrl);

    if (result.success === false) {
      setWpError(result.error);
      setWpLoading(false);
      return;
    }

    const {
      title: importedTitle,
      content,
      imageDataUrl,
      rubrique: importedRubrique,
      legendContent: importedLegendContent,
      articleUrl: importedArticleUrl,
      imageCaption: importedImageCaption,
    } = result.data;

    setField("title", importedTitle);
    if (importWithContent) {
      setSlidesAndThemes([content], []);
    }

    if (importedRubrique) {
      setField("rubrique", importedRubrique);
    }

    // Set legend-related fields
    setField("legendContent", importedLegendContent);
    setField("articleUrl", importedArticleUrl || null);
    setField("imageCaption", importedImageCaption);

    if (imageDataUrl) {
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      setImgDataUrl(await uploadImage(id, blob));
    }

    setWpLoading(false);
  };

  const handleImageUpload = async (file: File) => {
    setImgDataUrl(await uploadImage(id, file));
  };

  const value: PostEditorContextValue = {
    post,
    unsaved: scheduledChanges,
    setField,
    setSlidesAndThemes,
    img,
    blurredImg,
    handleImageUpload,
    currentSlide,
    setCurrentSlide,
    wpLoading,
    wpError,
    setWpError,
    importWithContent,
    setImportWithContent,
    handleDownload,
    handleWordPressImport,
    stagesRef,
  };

  return (
    <PostEditorContext.Provider value={value}>
      {children}
    </PostEditorContext.Provider>
  );
}

export function usePostEditor(): PostEditorContextValue {
  const ctx = useContext(PostEditorContext);
  if (!ctx) {
    throw new Error("usePostEditor must be used within a PostEditorProvider");
  }
  return ctx;
}

export function usePostField<K extends keyof Post>(
  key: K,
): [Post[K], boolean, (value: Post[K]) => void] {
  const ctx = usePostEditor();
  return [
    ctx.post[key],
    key in ctx.unsaved,
    (v: Post[K]) => ctx.setField(key, v),
  ];
}
