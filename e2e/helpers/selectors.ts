// Centralized selectors for desktop and mobile layouts

export const selectors = {
  // Desktop form inputs
  desktop: {
    title: 'input[name="title"]',
    intro: 'textarea[name="intro"]',
    rubrique: 'select[name="rubrique"]',
    format: 'select[name="format"]',
    image: 'input[name="image"]',
    legendContent: 'textarea[name="legendContent"]',
    imageCaption: 'input[name="imageCaption"]',
    positionTop: "input#top",
    positionBottom: "input#bottom",
    subscribeForMore: "input#subscribeformore",
    importWithContent: "input#importWithContent",
    numero: "input#numero",

    // WordPress import
    wpUrl: 'input[type="url"][placeholder="URL de l\'article"]',
    wpImportButton: 'button:has-text("Importer")',
    wpError: '[class*="importError"]',

    // Download
    downloadButton: 'button:has-text("Télécharger")',

    // Canvas navigation
    canvasPrev: 'button[class*="canvasPrev"]',
    canvasNext: 'button[class*="canvasNext"]',

    // Slide content editor
    editModeButton: 'button:has-text("Modifier")',
    cutCopyModeButton: 'button:has-text("Couper/Copier")',
    slideTextarea: '[class*="SlideContentEditor"] textarea',

    // Unsaved indicator
    unsavedIndicator: ':has-text("⏳")',
  },

  // Mobile tab navigation
  mobile: {
    // Tabs
    tabContenu: 'button:has-text("Contenu")',
    tabSlides: 'button:has-text("Slides")',
    tabImage: 'button:has-text("Image")',
    tabPartager: 'button:has-text("Partager")',
    activeTab: '[aria-current="page"]',
    unsavedDot: '[class*="unsavedDot"]',

    // Form inputs (mobile uses id attributes instead of name)
    title: "input#title",
    intro: "textarea#intro",
    rubrique: "select#rubrique",
    format: "select#format",

    // Download button in Partager tab
    downloadButton: 'button:has-text("Télécharger les slides")',

    // Canvas preview tap area
    canvasPreview: '[class*="canvasPreview"]',

    // Focus mode
    focusModeClose: '[class*="CanvasFocusMode"] button:has-text("×")',
  },
};

// Helper to get appropriate selectors based on viewport
export function getSelectors(isMobile: boolean) {
  return isMobile ? selectors.mobile : selectors.desktop;
}
