# frozen_string_literal: true

require "spec_helper"

RSpec.describe Decidim::Idra::SearchClient do
  let(:api_url) { "https://example.test/api/search" }
  let(:catalogues_url) { "https://example.test/api/catalogues" }
  subject(:client) { described_class.new(api_url: api_url, catalogues_info_url: catalogues_url) }

  describe "#catalogue_nodes" do
    it "returns ids from the response" do
      response = Net::HTTPSuccess.new("1.1", "200", "OK")
      allow(response).to receive(:body).and_return('[{"id":1},{"id":"2"}]')
      allow(client).to receive(:perform_get).with(catalogues_url).and_return(response)

      expect(client.catalogue_nodes).to eq([1, 2])
    end

    it "returns an empty array when the url is blank" do
      blank_client = described_class.new(api_url: api_url, catalogues_info_url: nil)

      expect(blank_client.catalogue_nodes).to eq([])
    end
  end

  describe "#search" do
    let(:filters) { [] }
    let(:nodes) { [] }

    it "returns parsed results on success" do
      response = Net::HTTPSuccess.new("1.1", "200", "OK")
      allow(response).to receive(:body).and_return('{"count":1,"results":[{"id":1}],"facets":[]}')
      allow(client).to receive(:perform_post).with(api_url, kind_of(Hash)).and_return(response)

      result = client.search(field: "title", filters: filters, rows: 5, start: 0, nodes: nodes)

      expect(result["count"]).to eq(1)
      expect(result["results"].first["id"]).to eq(1)
    end

    it "returns an empty result when the response is not successful" do
      response = Net::HTTPInternalServerError.new("1.1", "500", "Error")
      allow(response).to receive(:body).and_return("oops")
      allow(client).to receive(:perform_post).with(api_url, kind_of(Hash)).and_return(response)

      result = client.search(field: "title", filters: filters, rows: 5, start: 0, nodes: nodes)

      expect(result).to eq(described_class::EMPTY_RESULT)
    end
  end
end
