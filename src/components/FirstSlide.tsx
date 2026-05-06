"use client";

import { useLogoImage } from "../lib/useLogoImage";
import { useEffect, useRef, useState } from "react";
import type Konva from "konva";
import { Group, Image as KImage, Layer, Stage, Text } from "react-konva";
import useImage from "use-image";
import BackgroundImage from "./BackgroundImage";
import Gradient from "./Gradient";
import { getImageLuminosity, calculateOverlayOpacity } from "../lib/luminosity";
import { NEAR_WHITE, ACCENT } from "../lib/colors";
import { CONTENT_BG_THEMES } from "../lib/contentBgThemes";
import type { FirstSlideLayout } from "../app/storage";

export default function FirstSlide(props: {
  img?: HTMLImageElement;
  imgX: number;
  position: "top" | "bottom";
  rubrique: string;
  title: string;
  intro: string;
  scale: number;
  width: number;
  canvasWidth: number;
  canvasHeight: number;
  firstSlideLayout?: FirstSlideLayout;
  ref: React.Ref<Konva.Stage>;
  display: boolean;
  onImgXChange: (x: number) => void;
  previewMode?: boolean;
  // Optional external state management for shared measurements
  titleHeight?: number;
  introHeight?: number;
  onTitleHeightChange?: (height: number) => void;
  onIntroHeightChange?: (height: number) => void;
}) {
  const {
    title,
    intro,
    titleHeight: externalTitleHeight,
    introHeight: externalIntroHeight,
    onTitleHeightChange,
    onIntroHeightChange,
  } = props;

  const firstSlideLayout = props.firstSlideLayout ?? "gradient";
  const isSplit = firstSlideLayout !== "gradient";
  const splitThemeId =
    firstSlideLayout === "split-dark" ? "alt_bg2" : "alt_bg1";
  const splitTheme = CONTENT_BG_THEMES[splitThemeId];

  const [logo] = useLogoImage(isSplit ? splitTheme.accentColor : undefined);

  const [localTitleHeight, setLocalTitleHeight] = useState<number>(0);
  const [localIntroHeight, setLocalIntroHeight] = useState<number>(0);
  const [gradientOpacity, setGradientOpacity] = useState<number>(1);

  // Use external values if provided, otherwise use local state
  const titleHeight = externalTitleHeight ?? localTitleHeight;
  const introHeight = externalIntroHeight ?? localIntroHeight;

  const titleRef = useRef<Konva.Text>(null);
  const introRef = useRef<Konva.Text>(null);

  useEffect(() => {
    const measuredHeight = titleRef.current?.height() || 0;
    if (externalTitleHeight === undefined) {
      setLocalTitleHeight(measuredHeight);
    }
    onTitleHeightChange?.(measuredHeight);
  }, [title, externalTitleHeight, onTitleHeightChange]);

  useEffect(() => {
    const measuredHeight = introRef.current?.height() || 0;
    if (externalIntroHeight === undefined) {
      setLocalIntroHeight(measuredHeight);
    }
    onIntroHeightChange?.(measuredHeight);
  }, [intro, externalIntroHeight, onIntroHeightChange]);

  useEffect(() => {
    if (props.img) {
      // Sample luminosity from the region where text will be displayed
      const region = props.position === "top" ? "top" : "bottom";
      const luminosity = getImageLuminosity(props.img, region);
      const opacity = calculateOverlayOpacity(luminosity, 0.5, 0.9);
      setGradientOpacity(opacity);
    } else {
      setGradientOpacity(1);
    }
  }, [props.img, props.position]);

  // Extra margin for story format (1920px height) to leave room for Instagram UI
  const isStoryFormat = props.canvasHeight === 1920;
  const storyMargin = isStoryFormat ? 100 : 0;

  const [splitPatternImg] = useImage(
    isSplit && splitTheme.src ? splitTheme.src : "",
    "anonymous",
  );
  const halfHeight = props.canvasHeight / 2;
  const photoY = props.position === "top" ? 0 : halfHeight;
  const panelY = props.position === "top" ? halfHeight : 0;
  const splitTitleY = panelY + 200 + storyMargin;
  const splitIntroY = panelY + 250 + titleHeight + storyMargin;

  return (
    <Stage
      scaleX={props.scale}
      scaleY={props.scale}
      width={props.width}
      height={
        props.width ? (props.width * props.canvasHeight) / props.canvasWidth : 0
      }
      ref={props.ref}
      style={{ display: props.display ? "block" : "none" }}
    >
      <Layer background={"white"}>
        {!isSplit && props.img && (
          <BackgroundImage
            x={props.imgX}
            image={props.img}
            canvasWidth={props.canvasWidth}
            canvasHeight={props.canvasHeight}
            onCoordinateChange={props.onImgXChange}
          />
        )}
        {isSplit && (
          <>
            {splitPatternImg && (
              <KImage
                image={splitPatternImg}
                x={0}
                y={panelY}
                width={props.canvasWidth}
                height={halfHeight}
              />
            )}
            {props.img && (
              <Group
                y={photoY}
                clipX={0}
                clipY={0}
                clipWidth={props.canvasWidth}
                clipHeight={halfHeight}
              >
                <BackgroundImage
                  x={props.imgX}
                  image={props.img}
                  canvasWidth={props.canvasWidth}
                  canvasHeight={halfHeight}
                  onCoordinateChange={props.onImgXChange}
                />
              </Group>
            )}
          </>
        )}
        {!props.previewMode && !isSplit && (
          <Gradient
            position={props.position}
            height={titleHeight + introHeight + 400 + storyMargin}
            maxOpacity={gradientOpacity}
            canvasHeight={props.canvasHeight}
          />
        )}
        {!props.previewMode && (
          <KImage
            image={logo}
            x={150}
            y={
              isSplit
                ? panelY + 87 + storyMargin
                : props.position === "top"
                  ? 87 + storyMargin
                  : props.canvasHeight -
                    233 -
                    introHeight -
                    titleHeight -
                    storyMargin
            }
            width={80}
            height={60}
          />
        )}
        <Text
          text={props.rubrique}
          x={260}
          y={
            isSplit
              ? panelY + 85 + storyMargin
              : props.position === "top"
                ? 85 + storyMargin
                : props.canvasHeight -
                  235 -
                  introHeight -
                  titleHeight -
                  storyMargin
          }
          fill={isSplit ? splitTheme.accentColor : ACCENT}
          wrap={"word"}
          fontSize={64}
          fontFamily={"Rubik"}
          letterSpacing={-0.5}
        />
        <Text
          text={props.title}
          x={150}
          y={
            isSplit
              ? splitTitleY
              : props.position === "top"
                ? 200 + storyMargin
                : props.canvasHeight -
                  150 -
                  titleHeight -
                  introHeight -
                  storyMargin
          }
          ref={titleRef}
          width={props.canvasWidth - 150 * 2}
          fill={isSplit ? splitTheme.textColor : NEAR_WHITE}
          wrap={"word"}
          fontSize={80}
          fontFamily={"Atkinson Hyperlegible Next"}
          fontVariant={"bold"}
          lineHeight={1.1}
          letterSpacing={-1.5}
        />

        <Text
          text={props.intro}
          x={150}
          y={
            isSplit
              ? splitIntroY
              : props.position === "top"
                ? 250 + titleHeight + storyMargin
                : props.canvasHeight - 100 - introHeight - storyMargin
          }
          ref={introRef}
          width={props.canvasWidth - 150 * 2}
          fill={isSplit ? splitTheme.textColor : NEAR_WHITE}
          wrap={"word"}
          fontSize={64}
          fontFamily={"Atkinson Hyperlegible Next"}
          fontStyle={"500"}
          lineHeight={1.15}
          letterSpacing={-0.5}
        />
      </Layer>
    </Stage>
  );
}
