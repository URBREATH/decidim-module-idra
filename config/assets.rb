# frozen_string_literal: true

base_path = File.expand_path("..", __dir__)

Decidim::Webpacker.register_path("#{base_path}/app/packs", prepend: true)

Decidim::Webpacker.register_entrypoints(
  decidim_idra: "#{base_path}/app/packs/entrypoints/decidim_idra.js",
  decidim_idra_editor: "#{base_path}/app/packs/entrypoints/decidim_idra_editor.js"
)
