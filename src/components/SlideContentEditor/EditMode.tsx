import styles from "./SlideContentEditor.module.css";

interface EditModeProps {
  value: string;
  onChange: (value: string) => void;
  unsaved: boolean;
}

export default function EditMode({ value, onChange, unsaved }: EditModeProps) {
  return (
    <textarea
      className={`${styles.editTextarea} ${unsaved ? styles.unsaved : ""}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Collez votre texte ici..."
    />
  );
}
