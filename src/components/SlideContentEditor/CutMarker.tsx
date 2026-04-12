import styles from "./SlideContentEditor.module.css";

interface CutMarkerProps {
  onRemove: () => void;
}

export default function CutMarker({ onRemove }: CutMarkerProps) {
  return (
    <div className={styles.cutMarker}>
      <button
        className={styles.cutMarkerRemove}
        onClick={onRemove}
        title="Supprimer cette coupure"
      >
        ×
      </button>
    </div>
  );
}
