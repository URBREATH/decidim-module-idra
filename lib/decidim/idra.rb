# frozen_string_literal: true

require "decidim/idra/admin"
require "decidim/idra/engine"
require "decidim/idra/admin_engine"
require "decidim/idra/component"

module Decidim
  # This namespace holds the logic of the `Idra` component. This component
  # allows users to create idra in a participatory space.
  module Idra
    mattr_accessor :open_timeout, :read_timeout, :default_rows, :catalogues_cache_ttl, :allowed_api_hosts
    self.open_timeout = 5
    self.read_timeout = 10
    self.default_rows = 5
    self.catalogues_cache_ttl = 600
    self.allowed_api_hosts = []
  end
end
