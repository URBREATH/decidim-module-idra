import { getDictionary } from "src/decidim/i18n";
import html from "src/decidim/editor/utilities/html";
import "stylesheets/decidim/idra/idra.scss";

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

  async function openModal(editor) {
    const MODAL_ENDPOINT = "/idra_modal_editor";
    const MODAL_SELECTOR = "[data-idra-editor-modal]";

    const closeModal = (modalElement) => {
      if (modalElement) modalElement.remove();
    };

    const resolveModalFromHtml = (rawHtml) => {
      const modalWrapper = document.createElement("div");
      modalWrapper.innerHTML = rawHtml.trim();
      return modalWrapper.querySelector(MODAL_SELECTOR);
    };

    const bindModal = (modalElement) => {
      if (modalElement.dataset.editorBound === "true") return;
      modalElement.dataset.editorBound = "true";

      const searchBar = modalElement.querySelector("#idra-datasets-search");
      const linksContainer = modalElement.querySelector("#linksContainer");

      searchBar?.addEventListener("input", () => {
        const query = searchBar.value.toLowerCase();
        const listItems = modalElement.querySelectorAll(".dataset-item");
        listItems.forEach((item) => {
          const title = item.querySelector("a")?.textContent?.toLowerCase() || "";
          item.style.display = title.includes(query) ? "flex" : "none";
        });
      });

      linksContainer?.addEventListener("click", (event) => {
        const button = event.target.closest(".copy-button");
        if (button) {
          const url = button.dataset.url;
          const title = button.dataset.title;

          button.textContent = "Done";
          button.disabled = true;
          button.style.color = "grey";
          button.style.cursor = "not-allowed";
          button.style.opacity = "0.6";
          button.style.border = "1px solid grey";
          button.style.backgroundColor = "transparent";

          if (editor && url && title) {
            const linkHTML = `<a href="${url}" target="_blank">${title}</a>`;
            editor.commands.insertContent(linkHTML);
            editor.commands.insertContent("<p><br></p>");
          }
        }
      });

      modalElement.addEventListener("click", (event) => {
        if (event.target === modalElement) {
          closeModal(modalElement);
        }
      });
      modalElement.querySelector("[data-idra-modal-close]")?.addEventListener("click", () => closeModal(modalElement));

      if (window.Decidim && typeof window.Decidim.externalLinks === "function") {
        window.Decidim.externalLinks();
      }

      linksContainer?.addEventListener("click", (event) => {
        const link = event.target.closest('a[data-external-link="true"]');
        if (!link) return;
        if (window.Decidim && typeof window.Decidim.externalLinks === "function") {
          return;
        }
        event.preventDefault();
        if (window.IdraExternalWarning) {
          window.IdraExternalWarning(link.href);
        } else {
          window.open(link.href, "_blank", "noopener");
        }
      });
    };

    try {
      closeModal(document.querySelector(MODAL_SELECTOR));

      const response = await fetch(MODAL_ENDPOINT, {
        headers: { Accept: "text/html", "X-Requested-With": "XMLHttpRequest" },
        credentials: "same-origin"
      });

      const redirectedToSignIn = response.redirected && response.url && response.url.includes("/users/sign_in");
      if (response.status === 401 || response.status === 403 || redirectedToSignIn) {
        window.location.assign(response.url || "/users/sign_in");
        return null;
      }

      if (!response.ok) throw new Error(`Failed to fetch the updated content (${response.status})`);

      const responseHtml = await response.text();
      const modalElement = resolveModalFromHtml(responseHtml);
      if (!modalElement) throw new Error("Unexpected response while loading editor modal");

      document.body.appendChild(modalElement);
      bindModal(modalElement);

      return modalElement;
    } catch (error) {
      console.error("Errore nel caricare i dati:", error);
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
