class IdraController < Decidim::ApplicationController
  before_action :authenticate_user!, only: %i[create update delete datasets modal_editor]
  before_action :load_datasets, only: %i[update datasets modal_editor]

  def index
    @api_url = resolve_api_url(params[:api_url], ENV["API_URL"])
    @api_catalogues_info_url = resolve_api_url(
      params[:api_catalogues_info_url],
      ENV["API_CATALOGUES_INFO_URL"]
    )
    client = Decidim::Idra::SearchClient.new(
      api_url: @api_url,
      catalogues_info_url: @api_catalogues_info_url
    )
    @nodes = if @api_catalogues_info_url.present?
      Rails.cache.fetch("idra/catalogue_nodes/#{@api_catalogues_info_url}", expires_in: Decidim::Idra.catalogues_cache_ttl) do
        client.catalogue_nodes
      end
    else
      []
    end

    @search_value = params[:search].to_s.strip
    field = params[:field].presence || "title"
    set_pagination
    filters = build_filters
    deleted_filter = params[:deleted_filter]

    @api_results = client.search(
      field: field,
      filters: filters,
      rows: @rows,
      start: @start,
      nodes: @nodes
    )

    @total_results = @api_results["count"].to_i
    @paginated_results = Kaminari.paginate_array(Array(@api_results["results"]), total_count: @total_results)
                                 .page(@page)
                                 .per(@rows)

    @deleted_filters = []
    @limit = 10
    set_facets

    @tag_cloud_values = tag_cloud_values(@tags_values)

    set_selected_filters(deleted_filter)
    load_saved_datasets

    respond_to do |format|
      format.html { render "idra/index" }
      format.json do
        render json: {
          results: @api_results["results"],
          count: @total_results,
          page: @page,
          per_page: @rows,
          start: @start,
          facets: {
            tags: @tags_values,
            formats: @formats_values,
            licenses: @licenses_values,
            catalogues: @catalogues_values,
            categories: @categories_values,
          },
          filters: {
            search: @search_value,
            tags: @tags_value,
            formats: @formats_value,
            licenses: @licenses_value,
            catalogues: @catalogues_value,
            datasetThemes: @datasetThemes,
          },
        }
      end
    end
  end

  def create
    selected_title = params[:selected_titles]
    selected_dataset_id = params[:selected_dataset_id]
    @selected_dataset_id = selected_dataset_id
    selected_url = params[:selected_url]

    saved_dataset = SavedDatasets.find_or_initialize_by(
      dataset_id: selected_dataset_id,
      decidim_user: current_user
    )

    saved_dataset.title = selected_title
    saved_dataset.url = selected_url

    if saved_dataset.save
      load_datasets
      render partial: "datasets_list"
    else
      render json: { errors: saved_dataset.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    render partial: "datasets_list"
  end

  def delete
    dataset_id = params[:selected_dataset_id]
    dataset = SavedDatasets.find_by(dataset_id: dataset_id, decidim_user: current_user)

    if dataset.present? && dataset.destroy
      # Dataset successfully deleted
      load_datasets
      render partial: "datasets_list"
    else
      # Handle error if dataset not found or couldn't be deleted
      render json: { error: "Could not delete dataset" }, status: :unprocessable_entity
    end
  end

  def datasets
    respond_to do |format|
      format.json { render json: @datasets }
    end
  end

  def modal_editor
    render partial: "editor_modal"
  end

  private

  def set_pagination
    default_rows = Decidim::Idra.default_rows.to_i
    default_rows = 5 if default_rows <= 0
    @rows = (params[:rows].presence || default_rows).to_i
    @rows = default_rows if @rows <= 0

    @page = params[:page].to_i
    @page = 1 if @page <= 0

    if params[:page].blank?
      start_param = (params[:start].presence || "0").to_i
      start_param = 0 if start_param.negative?
      @page = (start_param / @rows) + 1
    end

    @start = (@page - 1) * @rows
  end

  def build_filters
    filters = []
    @search_terms = split_search_terms(@search_value).uniq

    # Always include a search filter to preserve the legacy Idra API behavior.
    filters << {
      "field": "ALL",
      "value": @search_value.to_s,
    }

    @tags_value = normalize_param_values(params[:tags_value])
    append_filter(filters, "tags", @tags_value)

    @formats_value = normalize_param_values(params[:formats_value])
    append_filter(filters, "distributionFormats", @formats_value)

    @licenses_value = normalize_param_values(params[:licenses_value])
    append_filter(filters, "distributionLicenses", @licenses_value)

    @catalogues_value = normalize_param_values(params[:catalogues_value])
    append_filter(filters, "catalogues", @catalogues_value)

    @datasetThemes = normalize_param_values(params[:datasetThemes])
    append_filter(filters, "datasetThemes", @datasetThemes)

    filters
  end

  def split_search_terms(value)
    normalize_param_values(value)
  end

  def append_filter(filters, field, value)
    normalized_value = normalize_filter_value(value)
    return if normalized_value.blank?

    filters << {
      "field": field,
      "value": normalized_value,
    }
  end

  def normalize_filter_value(value)
    values = normalize_param_values(value)
    return if values.empty?

    values.join(",")
  end

  def normalize_param_values(value)
    Array(value)
      .flat_map { |item| item.to_s.split(",") }
      .map(&:strip)
      .reject(&:blank?)
  end

  def set_facets
    if @api_results && @api_results["facets"].present? && @api_results["facets"].size >= 5
      @tags = @api_results["facets"][0]
      @formats = @api_results["facets"][1]
      @licenses = @api_results["facets"][2]
      @catalogues = @api_results["facets"][3]
      @categories = @api_results["facets"][4]

      @tags_values = @tags["values"]
      @formats_values = @formats["values"]
      @licenses_values = @licenses["values"]
      @catalogues_values = @catalogues["values"]
      @categories_values = @categories["values"]
    else
      @tags_values = []
      @formats_values = []
      @licenses_values = []
      @catalogues_values = []
      @categories_values = []
    end
  end

  def set_selected_filters(deleted_filter)
    @selected_filters = []
    append_selected_filter(@tags_value)
    append_selected_filter(@formats_value)
    append_selected_filter(@licenses_value)
    append_selected_filter(@catalogues_value)
    append_selected_filter(@datasetThemes)

    deleted_values = normalize_param_values(deleted_filter)
    return if deleted_values.empty?

    @selected_filters = @selected_filters.map do |values|
      values.reject { |value| deleted_values.include?(value) }
    end.reject(&:empty?)
  end

  def append_selected_filter(value)
    values = normalize_param_values(value)
    return if values.empty?

    @selected_filters << values
  end

  def load_datasets
    @datasets = current_user ? SavedDatasets.where(decidim_user: current_user) : SavedDatasets.none
  end

  def load_saved_datasets
    load_datasets
    @element_count = @datasets.count
    @list = @datasets.map(&:dataset_id)
  end

  def resolve_api_url(param_value, env_value)
    param_value = param_value.to_s.strip
    env_value = env_value.to_s.strip

    return nil if param_value.blank? && env_value.blank?
    return env_value if env_value.present? && param_value.blank?
    return param_value if env_value.blank?
    return param_value if allowed_api_url?(param_value, env_value)

    env_value
  end

  def allowed_api_url?(param_value, env_value)
    candidate = URI.parse(param_value)
    fallback = URI.parse(env_value)
    return false unless candidate.is_a?(URI::HTTP) && fallback.is_a?(URI::HTTP)
    return false if candidate.userinfo.present?

    allowed_hosts = [fallback.host] + Array(Decidim::Idra.allowed_api_hosts)
    allowed_hosts += ENV.fetch("IDRA_ALLOWED_API_HOSTS", "").split(",")
    allowed_hosts.map!(&:strip)
    allowed_hosts.reject!(&:empty?)

    allowed_hosts.include?(candidate.host)
  rescue URI::InvalidURIError
    false
  end

  def tag_cloud_values(tags)
    Array(tags).sort_by { |tag| -tag_weight(tag) }.first(30)
  end

  def tag_weight(tag)
    return 0 unless tag.respond_to?(:[])

    facet_text = tag["facet"] || tag[:facet]
    weight_value = facet_text.to_s[/\((\d+)\)/, 1]
    weight_value ||= tag["count"] || tag[:count] || tag["valueCount"] || tag[:valueCount]
    weight_value.to_i
  end
end
