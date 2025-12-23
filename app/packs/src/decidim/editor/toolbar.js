import { getDictionary } from "src/decidim/i18n";
import html from "src/decidim/editor/utilities/html";

import iconsUrl from "images/decidim/remixicon.symbol.svg";

const createIcon = (iconName) => {
  return `<svg class="editor-toolbar-icon" role="img" aria-hidden="true">
    <use href="${iconsUrl}#ri-${iconName}" />
  </svg>`;
};

const createEditorToolbarGroup = () => {
  return html("div").dom((el) => el.classList.add("editor-toolbar-group"));
};

const createEditorToolbarToggle = (editor, { type, label, icon, action, activatable = true, text ='' }) => {
  return html("button").dom((ctrl) => {
    ctrl.classList.add("editor-toolbar-control");
    ctrl.dataset.editorType = type;
    if (activatable) {
      ctrl.dataset.editorSelectionType = type;
    }
    ctrl.type = "button";
    ctrl.ariaLabel = label;
    ctrl.title = label;
    if (icon) {
      ctrl.innerHTML = createIcon(icon);
    }
    else if (text) {
      ctrl.innerHTML = `<span class="toolbar-text">${text}</span>`;
    };
    ctrl.addEventListener("click", (ev) => {
      ev.preventDefault();
      editor.commands.focus();
      action();
    })
  });
};

const createEditorToolbarSelect = (editor, { type, label, options, action, activatable = true }) => {
  return html("select").dom((ctrl) => {
    ctrl.classList.add("editor-toolbar-control", "!pr-8");
    ctrl.dataset.editorType = type;
    if (activatable) {
      ctrl.dataset.editorSelectionType = type;
    }
    ctrl.ariaLabel = label;
    ctrl.title = label;
    options.forEach(({ label: optionLabel, value }) => {
      const option = document.createElement("option");
      option.setAttribute("value", value);
      option.textContent = optionLabel;
      ctrl.appendChild(option);
    });
    ctrl.addEventListener("change", () => {
      editor.commands.focus();
      action(ctrl.value);
    });
  })
};

/**
 * Creates the editor toolbar for the given editor instance.
 *
 * @param {Editor} editor An instance of the rich text editor.
 * @returns {HTMLElement} The toolbar element
 */
export default function createEditorToolbar(editor) {
  const i18n = getDictionary("editor.toolbar");
  const ensureExternalWarning = () => {
    let overlay = document.getElementById("idra-external-warning");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "idra-external-warning";
      overlay.className = "external-warning-overlay";
      overlay.innerHTML = `
        <div class="external-warning-modal">
          <h3>External link</h3>
          <p>You are leaving Decidim to visit an external site. Do you want to continue?</p>
          <div class="external-actions">
            <button type="button" class="button button__sm button__secondary" data-idra-external-cancel>Cancel</button>
            <button type="button" class="button button__sm" data-idra-external-continue>Continue</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }
    return overlay;
  };

  const showExternalWarning = (url) => {
    if (window.IdraExternalWarning) {
      window.IdraExternalWarning(url);
      return;
    }
    const overlay = ensureExternalWarning();
    const cancel = overlay.querySelector("[data-idra-external-cancel]");
    const cont = overlay.querySelector("[data-idra-external-continue]");
    const close = () => overlay.classList.remove("is-visible");
    cancel?.addEventListener("click", close, { once: true });
    cont?.addEventListener("click", () => {
      window.open(url, "_blank", "noopener");
      close();
    }, { once: true });
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close();
    }, { once: true });
    overlay.classList.add("is-visible");
  };

  const supported = { nodes: [], marks: [], extensions: [] };
  editor.extensionManager.extensions.forEach((ext) => {
    if (ext.type === "node") {
      supported.nodes.push(ext.name);
    } else if (ext.type === "mark") {
      supported.marks.push(ext.name);
    } else if (ext.type === "extension") {
      supported.extensions.push(ext.name);
    }
  });

  // Create the toolbar element
  const toolbar = html("div").
    dom((el) => el.classList.add("editor-toolbar")).
    append(
      // Text style controls
      createEditorToolbarGroup(editor).append(
        createEditorToolbarSelect(editor, {
          type: "heading",
          label: i18n["control.heading"],
          options: [
            { value: "normal", label: i18n["textStyle.normal"] },
            { value: 2, label: i18n["textStyle.heading"].replace("%level%", 2) },
            { value: 3, label: i18n["textStyle.heading"].replace("%level%", 3) },
            { value: 4, label: i18n["textStyle.heading"].replace("%level%", 4) },
            { value: 5, label: i18n["textStyle.heading"].replace("%level%", 5) },
            { value: 6, label: i18n["textStyle.heading"].replace("%level%", 6) }
          ],
          action: (value) => {
            if (value === "normal") {
              editor.commands.setParagraph();
            } else {
              editor.commands.toggleHeading({ level: parseInt(value, 10) });
            }
          }
        }).render(supported.nodes.includes("heading"))
      )
    ).
    append(
      // Basic styling controls
      createEditorToolbarGroup(editor).append(
        createEditorToolbarToggle(editor, {
          type: "bold",
          icon: "bold",
          label: i18n["control.bold"],
          action: () => editor.commands.toggleBold()
        }).render(supported.marks.includes("bold")),
        createEditorToolbarToggle(editor, {
          type: "italic",
          icon: "italic",
          label: i18n["control.italic"],
          action: () => editor.commands.toggleItalic()
        }).render(supported.marks.includes("italic")),
        createEditorToolbarToggle(editor, {
          type: "underline",
          icon: "underline",
          label: i18n["control.underline"],
          action: () => editor.commands.toggleUnderline()
        }).render(supported.marks.includes("underline")),
        createEditorToolbarToggle(editor, {
          type: "hardBreak",
          icon: "text-wrap",
          label: i18n["control.hardBreak"],
          activatable: false,
          action: () => editor.commands.setHardBreak()
        }).render(supported.nodes.includes("hardBreak"))
      )
    ).
    append(
      // List controls
      createEditorToolbarGroup(editor).append(
        createEditorToolbarToggle(editor, {
          type: "orderedList",
          icon: "list-ordered",
          label: i18n["control.orderedList"],
          action: () => editor.commands.toggleOrderedList()
        }).render(supported.nodes.includes("orderedList")),
        createEditorToolbarToggle(editor, {
          type: "bulletList",
          icon: "list-unordered",
          label: i18n["control.bulletList"],
          action: () => editor.commands.toggleBulletList()
        }).render(supported.nodes.includes("bulletList"))
      )
    ).
    append(
      // Link and erase styles
      createEditorToolbarGroup(editor).append(
        createEditorToolbarToggle(editor, {
          type: "link",
          icon: "link",
          label: i18n["control.link"],
          action: () => editor.commands.linkDialog()
        }).render(supported.marks.includes("link")),
        createEditorToolbarToggle(editor, {
          type: "common:eraseStyles",
          icon: "eraser-line",
          label: i18n["control.common.eraseStyles"],
          activatable: false,
          action: () => {
            if (editor.isActive("link") && editor.view.state.selection.empty) {
              const originalPos = editor.view.state.selection.anchor;
              editor.chain().focus().extendMarkRange("link").unsetLink().setTextSelection(originalPos).run();
            } else {
              editor.chain().focus().clearNodes().unsetAllMarks().run();
            }
          }
        }).render(
          supported.nodes.includes("heading") ||
          supported.marks.includes("bold") ||
          supported.marks.includes("italic") ||
          supported.marks.includes("underline") ||
          supported.nodes.includes("hardBreak") ||
          supported.nodes.includes("orderedList") ||
          supported.nodes.includes("bulletList") ||
          supported.marks.includes("link")
        )
      )
    ).
    append(
      // Block styling
      createEditorToolbarGroup(editor).append(
        createEditorToolbarToggle(editor, {
          type: "codeBlock",
          icon: "code-line",
          label: i18n["control.codeBlock"],
          action: () => editor.commands.toggleCodeBlock()
        }).render(supported.nodes.includes("codeBlock")),
        createEditorToolbarToggle(editor, {
          type: "blockquote",
          icon: "double-quotes-l",
          label: i18n["control.blockquote"],
          action: () => editor.commands.toggleBlockquote()
        }).render(supported.nodes.includes("blockquote"))
      )
    ).
    append(
      // Indent and outdent
      createEditorToolbarGroup(editor).append(
        createEditorToolbarToggle(editor, {
          type: "indent:indent",
          icon: "indent-increase",
          label: i18n["control.indent.indent"],
          activatable: false,
          action: () => editor.commands.indent()
        }).render(supported.extensions.includes("indent")),
        createEditorToolbarToggle(editor, {
          type: "indent:outdent",
          icon: "indent-decrease",
          label: i18n["control.indent.outdent"],
          activatable: false,
          action: () => editor.commands.outdent()
        }).render(supported.extensions.includes("indent"))
      )
    ).
    append(
      // Multimedia
      createEditorToolbarGroup(editor).append(
        createEditorToolbarToggle(editor, {
          type: "videoEmbed",
          icon: "video-line",
          label: i18n["control.videoEmbed"],
          action: () => editor.commands.videoEmbedDialog()
        }).render(supported.nodes.includes("videoEmbed")),
        createEditorToolbarToggle(editor, {
          type: "image",
          icon: "image-line",
          label: i18n["control.image"],
          action: () => editor.commands.imageDialog()
        }).render(supported.nodes.includes("image"))
      )
    ).append(
      // SavedDatasets
      createEditorToolbarGroup(editor).append(
        createEditorToolbarToggle(editor, {
          type: "customButton",
          text: "<span style='color: #f1c232; display: inline-block; transform: translateY(-4px);'>★</span>",
          label: "Saved Datasets",
          action: () => openModal(editor)
        })
      )
    ).
    render()
  ;

  // Inject modal styles (aligned with Idra) if not already available in this context
  const ensureEditorModalStyles = () => {
    if (document.getElementById("idra-editor-modal-styles")) return;
    const style = document.createElement("style");
    style.id = "idra-editor-modal-styles";
    style.textContent = `
      .idra-modal-overlay {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1200;
      }
      .idra-modal-overlay.is-visible { display: flex; }
      .idra-modal {
        position: relative;
        background-color: #fff;
        padding: 28px 28px 24px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
        width: min(1080px, 95%);
        max-height: 85vh;
        border-radius: 16px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .idra-modal-theme h2 {
        margin: 0;
        text-align: center;
        font-size: 24px;
        font-weight: 700;
      }
      .idra-modal-theme .close { position: static; font-size: 24px; line-height: 1; }
      .idra-modal-theme .idra-modal-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .idra-modal-theme .idra-modal-header h2 { flex: 1; text-align: center; }
      .idra-modal-theme .idra-modal-search {
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 8px;
        width: 320px;
        max-width: 100%;
        align-self: flex-start;
      }
      .idra-modal-theme .idra-modal-scroll { height: 60vh; margin-top: 0; padding: 12px; border: 1px solid lightgray; border-radius: 8px; overflow-y: auto; }
      .idra-modal-theme .dataset-item { display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; transition: background-color 0.2s ease; }
      .idra-modal-theme .dataset-item a {
        font-weight: 700;
        color: var(--text-primary, #333);
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .idra-modal-theme .dataset-item a:hover { color: var(--primary, #0059b3) !important; }
      .idra-modal-theme .dataset-item .external-icon { width: 16px; height: 16px; color: inherit; fill: currentColor; }
      .idra-modal-theme .dataset-item:hover { background-color: rgba(0, 0, 0, 0.06); }
      .idra-modal-theme .copy-button { margin-left: 10px; }
      .idra-modal-theme .button {
        background: transparent;
        border: 1px solid transparent;
        color: var(--secondary, #5b4db3);
        transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
      }
      .idra-modal-theme .button:hover {
        background: rgba(91, 77, 179, 0.08);
        border-color: var(--secondary, #5b4db3);
        color: var(--secondary, #5b4db3);
      }
      .idra-modal-theme .button__secondary {
        background: transparent;
        color: var(--secondary, #5b4db3);
      }
    `;
    document.head.appendChild(style);
  };

  async function openModal(editor) {
    try {
      ensureEditorModalStyles();
      const response = await fetch("/idra_modal_editor", { headers: { Accept: "text/html" } })
      if (!response.ok) throw new Error("Failed to fetch the updated content")
      const html = await response.text()
      const modalWrapper = document.createElement("div")
      modalWrapper.innerHTML = html.trim()
      const modalElement = modalWrapper.firstElementChild
      if (!modalElement) return null
      document.body.appendChild(modalElement)
    
      // Aggiungi hover effect ai dataset items del modale
      const datasetItems = modalElement.querySelectorAll('.dataset-item');
      datasetItems.forEach((item) => {
        item.addEventListener('mouseenter', () => {
          item.style.backgroundColor = 'rgba(0, 0, 0, 0.06)';
        });
        item.addEventListener('mouseleave', () => {
          item.style.backgroundColor = '';
        });
      });
    
      // Aggiungi gli event listener
      const searchBar = modalElement.querySelector('#idra-editor-search');
      searchBar?.addEventListener('input', () => {
        const query = searchBar.value.toLowerCase();
        const listItems = modalElement.querySelectorAll('.dataset-item');
        listItems.forEach(item => {
          const title = item.querySelector('a').textContent.toLowerCase();
          item.style.display = title.includes(query) ? 'flex' : 'none';
        });
      });

      modalElement.querySelector('#linksContainer').addEventListener('click', (event) => {
        if (event.target.classList.contains('copy-button')) {
          const button = event.target;
          const url = button.dataset.url;
          const title = button.dataset.title;
          
          // Log per verificare che il clic sia stato registrato
          console.log('Cliccato sul pulsante "Copy"', { url, title });
      
          // Aggiorna lo stile del pulsante
          button.textContent = 'Done';
          button.disabled = true;
          button.style.color = 'grey';
          button.style.cursor = 'not-allowed';
          button.style.opacity = '0.6';
          button.style.border = '1px solid grey';
          button.style.backgroundColor = 'transparent';
          
          // Verifica se l'editor è disponibile
          if (editor) {
            console.log('Editor trovato, inserendo il link');
            // Inserisci il link nell'editor
            const linkHTML = `<a href="${url}" target="_blank">${title}</a>`;
            editor.commands.insertContent(linkHTML); // Assicurati che il comando sia valido
            editor.commands.insertContent('<p><br></p>');
          } else {
            console.error('Editor non trovato');
          }
        }
      });
    
      // Chiusura del modale cliccando all'esterno o sul close
      modalElement.addEventListener('click', (event) => {
        if (event.target === modalElement) {
          modalElement.remove();
        }
      });
      modalElement.querySelector('[data-idra-modal-close]')?.addEventListener('click', () => modalElement.remove());

      // Rebind Decidim external link warning if available
      if (window.Decidim && typeof window.Decidim.externalLinks === "function") {
        window.Decidim.externalLinks();
      }

      // Fallback: ensure external link warning fires in this modal
      modalElement.querySelector('#linksContainer')?.addEventListener('click', (event) => {
        const link = event.target.closest('a[data-external-link="true"]');
        if (!link) return;
        if (window.Decidim && typeof window.Decidim.externalLinks === "function") {
          // Let Decidim handler manage it
          return;
        }
        event.preventDefault();
        if (window.IdraExternalWarning) {
          window.IdraExternalWarning(link.href);
        } else {
          window.open(link.href, "_blank", "noopener");
        }
      });

      return modalElement;
    } catch (error) {
      console.error('Errore nel caricare i dati:', error);
      return null;
    }
  }
  
  


  const selectionControls = toolbar.querySelectorAll(".editor-toolbar-control[data-editor-selection-type]");
  const headingSelect = toolbar.querySelector(".editor-toolbar-control[data-editor-type='heading']");
  const selectionUpdated = () => {
    if (editor.isActive("heading")) {
      const { level } = editor.getAttributes("heading");
      headingSelect.value = `${level}`;
    } else if (headingSelect) {
      headingSelect.value = "normal";
    }

    selectionControls.forEach((ctrl) => {
      if (editor.isActive(ctrl.dataset.editorSelectionType)) {
        ctrl.classList.add("active");
      } else {
        ctrl.classList.remove("active");
      }
    });
  }
  editor.on("update", selectionUpdated);
  editor.on("selectionUpdate", selectionUpdated);

  return toolbar;
};
