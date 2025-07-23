import useImage from "use-image";
import logoUrl from "../assets/logo.svg";
import { useEffect, useRef, useState } from "react";
import Konva from "konva";
import { Image, Layer, Text } from "react-konva";
import { BackgroundImage } from "./BackgroundImage.tsx";
import { Gradient } from "./Gradient.tsx";

export function FisrtSlide(props: {
  img?: HTMLImageElement;
  position: "top" | "bottom";
  rubrique: string;
  title: string;
  intro: string;
}) {
  const [logo] = useImage(logoUrl, "anonymous");
  const [titleHeight, setTitleHeight] = useState<number>(0);
  const [introHeight, setIntroHeight] = useState<number>(0);

  const titleRef = useRef<Konva.Text>(null);
  const introRef = useRef<Konva.Text>(null);

  useEffect(() => {
    setTitleHeight(titleRef.current?.height() || 0);
  }, [titleRef, props.title]);

  useEffect(() => {
    setIntroHeight(introRef.current?.height() || 0);
  }, [introRef, props.intro]);

  return (
    <Layer background={"white"}>
      {props.img && <BackgroundImage image={props.img} />}
      <Gradient
        position={props.position}
        height={titleHeight + introHeight + 350}
      />
      <Image
        image={logo}
        x={150}
        y={
          props.position === "top" ? 70 : 1350 - 250 - introHeight - titleHeight
        }
        width={80}
      />
      <Text
        text={props.rubrique}
        x={260}
        y={
          props.position === "top" ? 85 : 1350 - 235 - introHeight - titleHeight
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
  );
}
