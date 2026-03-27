# frozen_string_literal: true

module Decidim
  module Idra
    module CommentsHelperOverride
      def comments_for(resource, options = {})
        append_stylesheet_pack_tag "decidim_idra", media: "all"
        super
      end
    end
  end
end
