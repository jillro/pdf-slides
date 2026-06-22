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
import {
  createZernioPresign,
  createZernioDraft,
  type ZernioPlatform,
} from "../app/zernio";
import { MAX_FORMAT_HEIGHT } from "../lib/formats";
import { createBlurredImage } from "../lib/blur";
import { generateCaption } from "../lib/captions";
import { parseRichText } from "../lib/rich-text-parser";
import type { ContentBgThemeId } from "../lib/contentBgThemes";

// Bluesky caps a single post at 4 images.
const MAX_BLUESKY_IMAGES = 4;

export type PublishTarget = ZernioPlatform;

export type PublishTargetResult = {
  success: boolean;
  error?: string;
  // Non-fatal note, e.g. when slides were dropped to fit a platform limit.
  note?: string;
};

export type PublishStatus = {
  running: boolean;
  results: Partial<Record<PublishTarget, PublishTargetResult>>;
};

// Flatten a rich-text slide to plain text for use as image alt text, using the
// same parser SlidesRenderer uses to draw the slide so the alt matches what's
// rendered.
function slideAltText(content: string): string {
  return parseRichText(content.trim())
    .map((s) => s.text)
    .join("");
}

// Small preview rendered on the home page post list. Kept tiny so it can be
// stored inline (base64) and served without downloading the full-size image.
const THUMB_HEIGHT = 200;

async function resizeImage(
  imgBlob: Blob,
  targetHeight: number = MAX_FORMAT_HEIGHT,
  type?: string,
  quality?: number,
): Promise<string> {
  // Get image current height
  const img = new Image();
  img.src = URL.createObjectURL(imgBlob);
  await new Promise<void>((resolve) => (img.onload = () => resolve()));

  // Scale down the image to target height, keeping the aspect ratio
  const canvas = document.createElement("canvas");
  canvas.height = targetHeight;
  canvas.width = (targetHeight * img.width) / img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL(type, quality);
}

async function uploadImage(
  postId: string,
  file: Blob,
): Promise<{ full: string; thumb: string }> {
  const thumb = await resizeImage(file, THUMB_HEIGHT, "image/jpeg", 0.7);

  const dataUrl = await resizeImage(file);
  const blob = await (await fetch(dataUrl)).blob();
  const ext = blob.type.split("/")[1] || "png";
  const presigned = await createUploadUrl({
    postId,
    contentType: blob.type,
    ext,
  });
  if (!presigned) return { full: dataUrl, thumb };

  const res = await fetch(presigned.uploadUrl, {
    method: "PUT",
    body: blob,
    headers: { "Content-Type": blob.type },
  });
  if (!res.ok) throw new Error(`S3 upload failed: ${res.status}`);
  return { full: presigned.publicUrl, thumb };
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
  publishDrafts: (targets: PublishTarget[]) => Promise<void>;
  publishStatus: PublishStatus;
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
  const [thumbDataUrl, setThumbDataUrl] = useState<string>(
    initialPost.thumb || "",
  );
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
        thumb: thumbDataUrl,
      });
    })();
  }, [id, imgDataUrl, thumbDataUrl]);

  const [currentSlide, setCurrentSlide] = useState<number>(0);

  // WordPress import transient state
  const [wpLoading, setWpLoading] = useState(false);
  const [wpError, setWpError] = useState<string | null>(null);
  const [importWithContent, setImportWithContent] = useState(false);

  const stagesRef = useRef<unknown[]>([]);

  const [publishStatus, setPublishStatus] = useState<PublishStatus>({
    running: false,
    results: {},
  });

  // Render every slide stage to a PNG Blob at 2x the original canvas resolution
  // (regardless of display scale). Shared by download and push-to-drafts.
  const exportSlideBlobs = async (): Promise<Blob[]> => {
    const stages = stagesRef.current as Konva.Stage[];
    const getPixelRatio = (stage: Konva.Stage) => 2 / (stage.scaleX() || 1);
    return Promise.all(
      stages.map(
        (stage) =>
          stage.toBlob({ pixelRatio: getPixelRatio(stage) }) as Promise<Blob>,
      ),
    );
  };

  const handleDownload = async () => {
    const blobs = await exportSlideBlobs();

    if (blobs.length === 1) {
      // Single slide: export as PNG directly
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blobs[0]);
      link.download = "slide.png";
      link.click();
    } else {
      // Multiple slides: export as ZIP of PNGs
      const zip = new JSZip();
      blobs.forEach((blob, i) => zip.file(`${i}.png`, blob));
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = "slides.zip";
      link.click();
    }
  };

  // Push the rendered slides + per-network captions as drafts to the selected
  // platforms. Each target is independent: one failing leaves the others intact.
  const publishDrafts = async (targets: PublishTarget[]) => {
    if (targets.length === 0) return;

    setPublishStatus({ running: true, results: {} });

    const blobs = await exportSlideBlobs();
    const { legendContent, imageCaption, articleUrl, title } = post;

    // Per-slide alt text, aligned 1:1 with the exported blobs (stage order:
    // index 0 = title slide, index i+1 = slidesContent[i], last = sub-slide).
    const altTexts = [
      title,
      ...post.slidesContent.map(slideAltText),
      ...(post.subForMore ? ["Abonne-toi pour lire la suite"] : []),
    ];

    const results: PublishStatus["results"] = {};
    const setResult = (target: PublishTarget, result: PublishTargetResult) => {
      results[target] = result;
      setPublishStatus({ running: true, results: { ...results } });
    };

    if (targets.length > 0) {
      // Upload each slide once to Zernio storage, reuse the public URLs across
      // every Zernio platform. The server action throws (and logs) on a real
      // Zernio failure; here we only surface a generic message to the user.
      let urls: string[];
      try {
        urls = await Promise.all(
          blobs.map(async (blob, i) => {
            const contentType = blob.type || "image/png";
            const presigned = await createZernioPresign({
              filename: `slide-${i}.png`,
              contentType,
            });
            if (!presigned) throw new Error("Zernio non configuré");
            const res = await fetch(presigned.uploadUrl, {
              method: "PUT",
              body: blob,
              headers: { "Content-Type": contentType },
            });
            if (!res.ok) throw new Error(`Zernio upload failed: ${res.status}`);
            return presigned.publicUrl;
          }),
        );
      } catch (err) {
        console.error(err);
        for (const platform of targets) {
          setResult(platform, {
            success: false,
            error: "Échec de l'envoi des images",
          });
        }
        setPublishStatus({ running: false, results: { ...results } });
        return;
      }

      const media = urls.map((url, i) => ({
        url,
        altText: altTexts[i] || undefined,
      }));

      // Instagram + Facebook share a single Zernio draft (one post, two
      // account targets, each keeping its own caption). Bluesky stays its own
      // draft: different caption and a 4-image cap.
      const igFb = targets.filter((t) => t === "instagram" || t === "facebook");
      const blueskyTargets = targets.filter((t) => t === "bluesky");

      let blueskyMedia = media;
      let blueskyNote: string | undefined;
      if (media.length > MAX_BLUESKY_IMAGES) {
        blueskyMedia = media.slice(0, MAX_BLUESKY_IMAGES);
        blueskyNote = `Bluesky limité à ${MAX_BLUESKY_IMAGES} images (${media.length - MAX_BLUESKY_IMAGES} ignorée(s))`;
      }

      const groups: {
        targets: ZernioPlatform[];
        media: typeof media;
        note?: string;
      }[] = [];
      if (igFb.length > 0) groups.push({ targets: igFb, media });
      if (blueskyTargets.length > 0) {
        groups.push({
          targets: blueskyTargets,
          media: blueskyMedia,
          note: blueskyNote,
        });
      }

      for (const group of groups) {
        const platforms = group.targets.map((platform) => ({
          platform,
          content: generateCaption(
            platform,
            legendContent,
            imageCaption,
            articleUrl,
          ),
        }));
        try {
          await createZernioDraft({
            platforms,
            media: group.media,
          });
          for (const platform of group.targets) {
            setResult(platform, { success: true, note: group.note });
          }
        } catch (err) {
          console.error(err);
          for (const platform of group.targets) {
            setResult(platform, {
              success: false,
              error: "Échec de la création du brouillon",
            });
          }
        }
      }
    }

    setPublishStatus({ running: false, results: { ...results } });
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
      const { full, thumb } = await uploadImage(id, blob);
      setImgDataUrl(full);
      setThumbDataUrl(thumb);
    }

    setWpLoading(false);
  };

  const handleImageUpload = async (file: File) => {
    const { full, thumb } = await uploadImage(id, file);
    setImgDataUrl(full);
    setThumbDataUrl(thumb);
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
    publishDrafts,
    publishStatus,
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
