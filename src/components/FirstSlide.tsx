"use client";

import useImage from "use-image";
import logoUrl from "../assets/logo.svg";
import { useEffect, useRef, useState } from "react";
import type Konva from "konva";
import { Image as KImage, Layer, Stage, Text } from "react-konva";
import BackgroundImage from "./BackgroundImage";
import Gradient from "./Gradient";
import { getImageLuminosity, calculateOverlayOpacity } from "../lib/luminosity";

export default function FirstSlide(props: {
  img?: HTMLImageElement;
  imgX: number;
  position: "top" | "bottom";
  rubrique: string;
  title: string;
  intro: string;
  scale: number;
  width: number;
  ref: React.Ref<Konva.Stage>;
  display: boolean;
  onImgXChange: (x: number) => void;
}) {
  const [logo] = useImage(logoUrl.src, "anonymous");
  const [titleHeight, setTitleHeight] = useState<number>(0);
  const [introHeight, setIntroHeight] = useState<number>(0);
  const [gradientOpacity, setGradientOpacity] = useState<number>(1);

  const titleRef = useRef<Konva.Text>(null);
  const introRef = useRef<Konva.Text>(null);

  useEffect(() => {
    setTitleHeight(titleRef.current?.height() || 0);
  }, [titleRef, props.title]);

  useEffect(() => {
    setIntroHeight(introRef.current?.height() || 0);
  }, [introRef, props.intro]);

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

  return (
    <Stage
      scaleX={props.scale}
      scaleY={props.scale}
      width={props.width}
      height={props.width ? (props.width * 1350) / 1080 : 0}
      ref={props.ref}
      style={{ display: props.display ? "block" : "none" }}
    >
      <Layer background={"white"}>
        {props.img && (
          <BackgroundImage
            x={props.imgX}
            image={props.img}
            onCoordinateChange={props.onImgXChange}
          />
        )}
        <Gradient
          position={props.position}
          height={titleHeight + introHeight + 400}
          maxOpacity={gradientOpacity}
        />
        <KImage
          image={logo}
          x={150}
          y={
            props.position === "top"
              ? 70
              : 1350 - 250 - introHeight - titleHeight
          }
          width={80}
        />
        <Text
          text={props.rubrique}
          x={260}
          y={
            props.position === "top"
              ? 85
              : 1350 - 235 - introHeight - titleHeight
          }
          fill={"#ffd9af"}
          wrap={"word"}
          fontSize={64}
          fontFamily={"Rubik"}
        />
        <Text
          text={props.title}
          x={150}
          y={
            props.position === "top"
              ? 200
              : 1350 - 150 - titleHeight - introHeight
          }
          ref={titleRef}
          width={1080 - 150 * 2}
          fill={"white"}
          wrap={"word"}
          fontSize={80}
          fontFamily={"Atkinson Hyperlegible"}
          fontVariant={"bold"}
        />

        <Text
          text={props.intro}
          x={150}
          y={
            props.position === "top"
              ? 250 + titleHeight
              : 1350 - 100 - introHeight
          }
          ref={introRef}
          width={1080 - 150 * 2}
          fill={"white"}
          wrap={"word"}
          fontSize={64}
          fontFamily={"Atkinson Hyperlegible"}
        />
      </Layer>
    </Stage>
  );
}
