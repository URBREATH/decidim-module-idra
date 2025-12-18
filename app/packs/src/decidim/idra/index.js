const csrfToken = () => document.querySelector("meta[name=csrf-token]")?.content

const toggleModal = (open) => {
  const modal = document.querySelector(".modal-overlay")
  if (!modal) return
  modal.style.display = open ? "block" : "none"
}

const bindModal = () => {
  document.querySelectorAll("[data-idra-modal-open]").forEach((btn) => {
    btn.addEventListener("click", () => toggleModal(true))
  })
  document.querySelectorAll("[data-idra-modal-close]").forEach((btn) => {
    btn.addEventListener("click", () => toggleModal(false))
  })
}

const shuffleCloud = () => {
  const spans = document.querySelectorAll(".cloud span")
  if (!spans.length) return
  const colors = ["--primary", "--secondary", "--warning"]
  const weights = Array.from(spans).map((span) => parseInt(span.dataset.weight || "0", 10))
  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  const minSize = 14
  const maxSize = 30
  spans.forEach((span, index) => {
    span.style.color = `var(${colors[index % colors.length]})`
    const weight = parseInt(span.dataset.weight || "0", 10)
    const fontSize =
      minWeight === maxWeight
        ? (minSize + maxSize) / 2
        : minSize + ((weight - minWeight) / (maxWeight - minWeight)) * (maxSize - minSize)
    span.style.fontSize = `${fontSize}px`
  })
  const shuffled = [...spans].sort(() => Math.random() - 0.5)
  const parent = document.querySelector(".cloud")
  parent.innerHTML = ""
  shuffled.forEach((span) => parent.appendChild(span))
}

const bindSearchTriggers = () => {
  document.querySelectorAll(".search-trigger").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const value = trigger.textContent.trim()
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
  const searchBar = document.getElementById("search-bar")
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
  shuffleCloud()
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
