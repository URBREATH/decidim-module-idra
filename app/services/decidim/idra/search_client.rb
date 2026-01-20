# frozen_string_literal: true

module Decidim
  module Idra
    class SearchClient
      EMPTY_RESULT = {
        "results" => [],
        "count" => 0,
        "facets" => [],
      }.freeze

      def initialize(api_url:, catalogues_info_url:)
        @api_url = api_url
        @catalogues_info_url = catalogues_info_url
      end

      def catalogue_nodes
        return [] if @catalogues_info_url.blank?

        response = perform_get(@catalogues_info_url)
        return [] unless response.is_a?(Net::HTTPSuccess)

        data = JSON.parse(response.body)
        Array(data).map { |catalogue_info| catalogue_info["id"].to_i }
      rescue JSON::ParserError => e
        log_error("Unable to parse catalogues info JSON", e)
        []
      end

      def search(field:, filters:, rows:, start:, nodes:)
        return EMPTY_RESULT if @api_url.blank?

        payload = {
          "filters": filters,
          "live": false,
          "sort": {
            "field": field,
            "mode": "asc",
          },
          "rows": rows.to_i,
          "start": start,
          "nodes": nodes,
          "euroVocFilter": {
            "euroVoc": false,
            "sourceLanguage": "",
            "targetLanguages": [],
          },
        }

        response = perform_post(@api_url, payload)
        return EMPTY_RESULT unless response.is_a?(Net::HTTPSuccess)

        JSON.parse(response.body)
      rescue JSON::ParserError => e
        log_error("Unable to parse search response JSON", e)
        EMPTY_RESULT
      end

      private

      def perform_get(url_string)
        url = safe_uri(url_string)
        return if url.nil?

        http = build_http(url)
        request = Net::HTTP::Get.new(url)
        http.request(request)
      rescue StandardError => e
        log_error("GET request failed", e)
        nil
      end

      def perform_post(url_string, payload)
        url = safe_uri(url_string)
        return if url.nil?

        http = build_http(url)
        request = Net::HTTP::Post.new(url)
        request["Content-Type"] = "application/json"
        request.body = JSON.dump(payload)
        http.request(request)
      rescue StandardError => e
        log_error("POST request failed", e)
        nil
      end

      def safe_uri(url_string)
        return if url_string.blank?

        URI.parse(url_string)
      rescue URI::InvalidURIError => e
        log_error("Invalid URL provided", e)
        nil
      end

      def build_http(url)
        http = Net::HTTP.new(url.host, url.port)
        http.use_ssl = url.is_a?(URI::HTTPS)
        http.open_timeout = Decidim::Idra.open_timeout if Decidim::Idra.open_timeout
        http.read_timeout = Decidim::Idra.read_timeout if Decidim::Idra.read_timeout
        http
      end

      def log_error(message, error)
        return unless defined?(Rails) && Rails.logger

        Rails.logger.warn("[Decidim::Idra::SearchClient] #{message}: #{error.class} #{error.message}")
      end
    end
  end
end
