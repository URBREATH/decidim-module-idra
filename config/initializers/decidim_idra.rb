# frozen_string_literal: true

Decidim::Idra.open_timeout = ENV.fetch("IDRA_OPEN_TIMEOUT", 5).to_i
Decidim::Idra.read_timeout = ENV.fetch("IDRA_READ_TIMEOUT", 10).to_i
Decidim::Idra.default_rows = ENV.fetch("IDRA_DEFAULT_ROWS", 5).to_i
Decidim::Idra.catalogues_cache_ttl = ENV.fetch("IDRA_CATALOGUES_CACHE_TTL", 600).to_i
Decidim::Idra.allowed_api_hosts = ENV.fetch("IDRA_ALLOWED_API_HOSTS", "").split(",").map(&:strip)
