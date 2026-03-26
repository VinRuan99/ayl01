import { Extension } from '@tiptap/core';
import '@tiptap/extension-text-style';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      /**
       * Set the font size
       */
      setFontSize: (size: string) => ReturnType;
      /**
       * Unset the font size
       */
      unsetFontSize: () => ReturnType;
    };
    lineHeight: {
      /**
       * Set the line height
       */
      setLineHeight: (lineHeight: string) => ReturnType;
      /**
       * Unset the line height
       */
      unsetLineHeight: () => ReturnType;
    };
    paragraphSpacing: {
      /**
       * Set the paragraph spacing (margin-bottom)
       */
      setParagraphSpacing: (spacing: string) => ReturnType;
      /**
       * Unset the paragraph spacing
       */
      unsetParagraphSpacing: () => ReturnType;
    };
  }
}

export const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }

              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize: fontSize => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run();
      },
    };
  },
});

export const LineHeight = Extension.create({
  name: 'lineHeight',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'listItem'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: element => element.style.lineHeight || null,
            renderHTML: attributes => {
              if (!attributes.lineHeight) {
                return {};
              }

              return {
                style: `line-height: ${attributes.lineHeight}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight: lineHeight => ({ commands }) => {
        let applied = false;
        this.options.types.forEach((type: string) => {
          if (commands.updateAttributes(type, { lineHeight })) {
            applied = true;
          }
        });
        return applied;
      },
      unsetLineHeight: () => ({ commands }) => {
        let applied = false;
        this.options.types.forEach((type: string) => {
          if (commands.resetAttributes(type, 'lineHeight')) {
            applied = true;
          }
        });
        return applied;
      },
    };
  },
});

export const ParagraphSpacing = Extension.create({
  name: 'paragraphSpacing',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'listItem'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          paragraphSpacing: {
            default: null,
            parseHTML: element => element.style.marginBottom || null,
            renderHTML: attributes => {
              if (!attributes.paragraphSpacing) {
                return {};
              }

              return {
                style: `margin-bottom: ${attributes.paragraphSpacing} !important; margin-top: 0 !important;`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setParagraphSpacing: spacing => ({ commands }) => {
        let applied = false;
        this.options.types.forEach((type: string) => {
          if (commands.updateAttributes(type, { paragraphSpacing: spacing })) {
            applied = true;
          }
        });
        return applied;
      },
      unsetParagraphSpacing: () => ({ commands }) => {
        let applied = false;
        this.options.types.forEach((type: string) => {
          if (commands.resetAttributes(type, 'paragraphSpacing')) {
            applied = true;
          }
        });
        return applied;
      },
    };
  },
});
