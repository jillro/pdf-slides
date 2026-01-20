"use client";

import { useTheme } from "./ThemeProvider";
import styles from "./ThemeToggle.module.css";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "system") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  const getIcon = () => {
    switch (theme) {
      case "light":
        return "\u2600"; // Sun
      case "dark":
        return "\u263E"; // Moon
      default:
        return "\u2699"; // Gear for system
    }
  };

  const getLabel = () => {
    switch (theme) {
      case "light":
        return "Clair";
      case "dark":
        return "Sombre";
      default:
        return "Auto";
    }
  };

  return (
    <button
      className={styles.toggle}
      onClick={cycleTheme}
      title={`Theme: ${getLabel()}`}
      aria-label={`Current theme: ${getLabel()}. Click to change.`}
    >
      <span className={styles.icon}>{getIcon()}</span>
      <span className={styles.label}>{getLabel()}</span>
    </button>
  );
}
