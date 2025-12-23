const csrfToken = () => document.querySelector("meta[name=csrf-token]")?.content
const createExternalWarning = () => {
  let overlay = document.getElementById("idra-external-warning")
  if (overlay) return overlay
  overlay = document.createElement("div")
  overlay.id = "idra-external-warning"
  overlay.className = "external-warning-overlay"
  overlay.innerHTML = `
    <div class="external-warning-modal">
      <h3>External link</h3>
      <p>You are leaving Decidim to visit an external site. Do you want to continue?</p>
      <div class="external-actions">
        <button type="button" class="button button__sm button__secondary" data-idra-external-cancel>Cancel</button>
        <button type="button" class="button button__sm" data-idra-external-continue>Continue</button>
      </div>
    </div>
  `
  document.body.appendChild(overlay)
  return overlay
}

const showExternalWarning = (url) => {
  const overlay = createExternalWarning()
  const cancel = overlay.querySelector("[data-idra-external-cancel]")
  const cont = overlay.querySelector("[data-idra-external-continue]")
  const close = () => overlay.classList.remove("is-visible")
  cancel?.addEventListener("click", close, { once: true })
  cont?.addEventListener("click", () => {
    window.open(url, "_blank", "noopener")
    close()
  }, { once: true })
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close()
  }, { once: true })
  overlay.classList.add("is-visible")
}

window.IdraExternalWarning = showExternalWarning

const toggleModal = (open) => {
  const modal = document.querySelector(".idra-modal-overlay")
  if (!modal) return
  modal.classList.toggle("is-visible", open)
  modal.setAttribute("aria-hidden", open ? "false" : "true")
}

const bindModal = () => {
  document.querySelectorAll("[data-idra-modal-open]").forEach((btn) => {
    btn.addEventListener("click", () => toggleModal(true))
  })
  document.querySelectorAll("[data-idra-modal-close]").forEach((btn) => {
    btn.addEventListener("click", () => toggleModal(false))
  })
}

const bindSearchTriggers = () => {
  document.querySelectorAll(".search-trigger").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const value = (trigger.dataset.label || trigger.textContent.trim().replace(/_/g, " "))
      const input = document.querySelector('input[name="search"]')
      if (!input) return
      input.value = value
      const form = trigger.closest("form") || document.querySelector(".search-form")
      form?.submit()
    })
  })
}

const bindFacetToggles = () => {
  document.querySelectorAll(".show-more-button a").forEach((button) => {
    button.addEventListener("click", () => {
      const facetType = button.dataset.facet
      const items = Array.from(document.querySelectorAll(`.facet-item-${facetType}`))
      const hiddenItems = items.filter((el) => el.classList.contains("hidden"))
      const isExpanded = hiddenItems.length === 0
      if (isExpanded) {
        items.forEach((item, index) => item.classList.toggle("hidden", index >= 10))
      } else {
        items.forEach((item) => item.classList.remove("hidden"))
      }
      button.textContent = isExpanded ? button.dataset.labelMore : button.dataset.labelLess
    })
  })
}

const bindExpandCards = () => {
  document.querySelectorAll(".expand-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault()
      const target = document.getElementById(link.dataset.cardTarget)
      if (!target) return
      const isHidden = target.style.display === "none" || target.style.display === ""
      target.style.display = isHidden ? "block" : "none"
      link.textContent = isHidden ? link.dataset.labelClose : link.dataset.labelOpen
    })
  })
}

const bindDetailButtons = () => {
  document.querySelectorAll(".show-more-details-button").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault()
      const target = document.getElementById(button.dataset.target)
      if (!target) return
      const isVisible = target.classList.contains("show")
      target.classList.toggle("show", !isVisible)
      button.innerHTML = isVisible ? '<i class="icon icon-info"></i> Details' : '<i class="icon icon-eye-close"></i> Hide Details'
    })
  })
}

const updatePartialView = () => {
  fetch("/idra_update")
    .then((response) => response.text())
    .then((html) => {
      const container = document.getElementById("partial-view-container")
      if (!container) return
      container.innerHTML = html
      bindDatasetList()
    })
    .catch((error) => console.error("Error fetching partial view:", error))
}

const updateCounters = (value) => {
  document.querySelectorAll("[data-idra-counter]").forEach((node) => {
    node.textContent = value
  })
}

const setSavedVisualState = (datasetId, isSaved) => {
  document.querySelectorAll(`[data-idra-save][data-dataset-id="${datasetId}"]`).forEach((btn) => {
    btn.dataset.star = isSaved ? "1" : "0"
    btn.classList.toggle("is-saved", isSaved)
    btn.innerHTML = isSaved ? "★" : "☆"
  })
}

const deleteConfirmModal = () => ({
  overlay: document.getElementById("idra-delete-confirm"),
  confirm: document.querySelector("[data-idra-delete-confirm]"),
  cancel: document.querySelector("[data-idra-delete-cancel]"),
})

let pendingDelete = null

const openDeleteModal = (datasetId, counter) => {
  const modal = deleteConfirmModal()
  pendingDelete = { datasetId, counter }
  modal.overlay?.classList.add("is-visible")
  modal.overlay?.setAttribute("aria-hidden", "false")
}

const closeDeleteModal = () => {
  const modal = deleteConfirmModal()
  pendingDelete = null
  modal.overlay?.classList.remove("is-visible")
  modal.overlay?.setAttribute("aria-hidden", "true")
}

const performDeleteDataset = (datasetId, counter) => {
  setSavedVisualState(datasetId, false)
  counter.value = Math.max(0, counter.value - 1)
  updateCounters(counter.value)

  fetch("/idra_delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken(),
    },
    body: JSON.stringify({ selected_dataset_id: datasetId }),
  })
    .then((response) => {
      if (!response.ok) throw new Error("Failed to delete dataset")
      updatePartialView()
    })
    .catch((error) => {
      setSavedVisualState(datasetId, true)
      counter.value += 1
      updateCounters(counter.value)
      console.error(error)
      alert("Failed to delete item. Please try again.")
    })
}

const saveDataset = ({ title, url, id }, button, counter) => {
  setSavedVisualState(id, true)
  counter.value += 1
  updateCounters(counter.value)

  fetch("/idra_create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken(),
    },
    body: JSON.stringify({ selected_titles: title, selected_url: url, selected_dataset_id: id }),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((data) => {
          throw new Error(data?.errors?.join(", ") || "Failed to save dataset")
        })
      }
      updatePartialView()
    })
    .catch((error) => {
      setSavedVisualState(id, false)
      counter.value = Math.max(0, counter.value - 1)
      updateCounters(counter.value)
      console.error(error)
      alert(error.message || "Failed to save dataset. Please try again.")
    })
    .finally(() => {
      button.disabled = false
    })
}

const bindSaveButtons = () => {
  const counter = { value: Number(document.querySelector("[data-idra-root]")?.dataset.savedCount || 0) }
  updateCounters(counter.value)
  document.querySelectorAll("[data-idra-save]").forEach((button) => {
    button.addEventListener("click", () => {
      const isStar = button.dataset.star === "1"
      const payload = {
        title: button.dataset.title,
        url: button.dataset.url,
        id: button.dataset.datasetId,
      }
      if (isStar) {
        performDeleteDataset(payload.id, counter)
      } else {
        saveDataset(payload, button, counter)
      }
    })
  })
}

const bindDatasetList = () => {
  const searchBar = document.getElementById("idra-datasets-search")
  const list = document.getElementById("datasets-list")
  const counter = { value: Number(document.querySelector("[data-idra-root]")?.dataset.savedCount || 0) }
  if (searchBar && list) {
    searchBar.addEventListener("input", () => {
      const filter = searchBar.value.toLowerCase()
      list.querySelectorAll(".dataset-item").forEach((item) => {
        const text = item.textContent.toLowerCase()
        item.style.display = text.includes(filter) ? "" : "none"
      })
    })
  }

  document.querySelectorAll("[data-dataset-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      const datasetId = button.dataset.datasetId
      if (!datasetId) return
      openDeleteModal(datasetId, counter)
    })
  })
}

const bindFilters = () => {
  document.querySelectorAll(".filter-item a").forEach((link) => {
    link.addEventListener("click", () => toggleModal(false))
  })
}

const bindExternalLinkWarnings = () => {
  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[data-external-link="true"]')
    if (!link) return
    event.preventDefault()
    showExternalWarning(link.href)
  })
}

const fetchSearchJson = () => {
  const url = new URL(window.location.href)
  url.searchParams.set("format", "json")
  fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      window.idraSearchData = data
      // Useful for debugging in devtools without altering UI
      console.debug("IDRA search JSON", data)
    })
    .catch((error) => {
      console.warn("Unable to fetch IDRA search JSON", error)
    })
}

document.addEventListener("DOMContentLoaded", () => {
  bindModal()
  bindSearchTriggers()
  bindFacetToggles()
  bindExpandCards()
  bindDetailButtons()
  bindSaveButtons()
  bindDatasetList()
  bindFilters()
  bindExternalLinkWarnings()
  fetchSearchJson()

  const modal = deleteConfirmModal()
  modal.cancel?.addEventListener("click", () => closeDeleteModal())
  modal.confirm?.addEventListener("click", () => {
    if (!pendingDelete) return closeDeleteModal()
    const { datasetId, counter } = pendingDelete
    closeDeleteModal()
    performDeleteDataset(datasetId, counter)
  })
})
