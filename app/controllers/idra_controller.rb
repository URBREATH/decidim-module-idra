class IdraController < Decidim::ApplicationController
  def index

    @api_url = params[:api_url].presence || ENV["API_URL"]
    url = URI(@api_url)

    @api_catalogues_info_url = params[:api_catalogues_info_url] || ENV["API_CATALOGUES_INFO_URL"]
    api_catalogues_info_url = @api_catalogues_info_url


    https = Net::HTTP.new(url.host, url.port)
    https.use_ssl = true
    catalogues_info_url = URI(api_catalogues_info_url)
    catalogues_info_https = Net::HTTP.new(catalogues_info_url.host, catalogues_info_url.port)
    catalogues_info_https.use_ssl = true
    catalogues_info_request = Net::HTTP::Get.new(catalogues_info_url)
    catalogues_info_response = catalogues_info_https.request(catalogues_info_request)
    catalogues_info_data = JSON.parse(catalogues_info_response.body)
    request = Net::HTTP::Post.new(url)
    request["Content-Type"] = "application/json"

    # require "net/http"
    # require "json"

    # url = URI("http://91.109.58.79/Idra/api/v1/client/search")
    # http = Net::HTTP.new(url.host, url.port)

    # catalogues_info_url = URI("http://91.109.58.79/Idra/api/v1/client/cataloguesInfo")
    # catalogues_info_http = Net::HTTP.new(catalogues_info_url.host, catalogues_info_url.port)

    # catalogues_info_request = Net::HTTP::Get.new(catalogues_info_url)
    # catalogues_info_response = catalogues_info_http.request(catalogues_info_request)
    # catalogues_info_data = JSON.parse(catalogues_info_response.body)

    # request = Net::HTTP::Post.new(url)
    # request["Content-Type"] = "application/json"


    #form

    @search_value = params[:search].to_s.strip.split(/\s+/).reject(&:blank?).join(',')

    selected_option = params[:field].presence || "title"
    field = selected_option.presence || "title"
    @rows = (params[:rows].presence || "5").to_i
    @rows = 5 if @rows <= 0

    @page = params[:page].to_i
    @page = 1 if @page <= 0

    if params[:page].blank?
      start_param = (params[:start].presence || "0").to_i
      start_param = 0 if start_param.negative?
      @page = (start_param / @rows) + 1
    end

    @start = (@page - 1) * @rows
    start = @start

    @nodes = []

      catalogues_info_data.each do |catalogue_info|
        id = catalogue_info["id"]
        @nodes << id.to_i
      end

   
    filters = [{
      "field": "ALL",
      "value": @search_value,
    }]
    

    @tags_value = params[:tags_value]

    if @tags_value.present?
      filters.push(
        {
          "field": "tags",
          "value": @tags_value.start_with?(",") ? @tags_value[1..-1] : @tags_value,
        }
      )
    end

    @formats_value = params[:formats_value]

    if @formats_value.present?
      filters.push(
        {
          "field": "distributionFormats",
          "value": @formats_value.start_with?(",") ? @formats_value[1..-1] : @formats_value,
        }
      )
    end

    @licenses_value = params[:licenses_value]

    if @licenses_value.present?
      filters.push(
        {
          "field": "distributionLicenses",
          "value": @licenses_value.start_with?(",") ? @licenses_value[1..-1] : @licenses_value,
        }
      )
    end

    @catalogues_value = params[:catalogues_value]

    if @catalogues_value.present?
      filters.push(
        {
          "field": "catalogues",
          "value": @catalogues_value.start_with?(",") ? @catalogues_value[1..-1] : @catalogues_value,
        }
      )
    end

    @datasetThemes = params[:datasetThemes]

    if @datasetThemes.present?
      filters.push(
        {
          "field": "datasetThemes",
          "value": @datasetThemes.start_with?(",") ? @datasetThemes[1..-1] : @datasetThemes,
        }
      )
    end

    deleted_filter = params[:deleted_filter]

    request.body = JSON.dump({
      "filters": filters,
      "live": false,
      "sort": {
        "field": field,
        "mode": "asc",

      },
      "rows": @rows.to_i,
      "start": start,
      "nodes": @nodes,
      "euroVocFilter": {
        "euroVoc": false,
        "sourceLanguage": "",
        "targetLanguages": [],
      },
    })

    response = https.request(request) #change https to http if use the other configuration

    @api_results = JSON.parse(response.read_body)

    @total_results = @api_results["count"].to_i
    @paginated_results = Kaminari.paginate_array(Array(@api_results["results"]), total_count: @total_results)
                                 .page(@page)
                                 .per(@rows)


    @selected_filters = []

    @deleted_filters = []

    @limit = 10

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

    @tag_cloud_values = tag_cloud_values(@tags_values)

    if params[:tags_value].present?
      @selected_filters << params[:tags_value].split(",")
    end

    if params[:formats_value].present?
      @selected_filters << params[:formats_value].split(",")
    end

    if params[:licenses_value].present?
      @selected_filters << params[:licenses_value].split(",")
    end

    if params[:catalogues_value].present?
      @selected_filters << params[:catalogues_value].split(",")
    end

    if params[:datasetThemes].present?
      @selected_filters << params[:datasetThemes].split(",")
    end

    if params[:deleted_filter].present?
      @selected_filters.delete(deleted_filter)
    end

    @datasets = SavedDatasets.where(decidim_user: current_user)
    @element_count = @datasets.count

    @list = []

    @datasets.each do |data|
      @list << data.dataset_id
    end

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
        @datasets = SavedDatasets.where(decidim_user: current_user)
        render partial: "datasets_list"
      else
        render json: { errors: saved_dataset.errors.full_messages }, status: :unprocessable_entity
      end
    end
    
  
def delete
  dataset_id = params[:selected_dataset_id]
  dataset = SavedDatasets.find_by(dataset_id: dataset_id, decidim_user: current_user)

  if dataset.present? && dataset.destroy
    # Dataset successfully deleted
    render partial: "datasets_list"
  else
    # Handle error if dataset not found or couldn't be deleted
    render json: { error: 'Could not delete dataset' }, status: :unprocessable_entity
  end
end

  
  def update
    @datasets = SavedDatasets.where(decidim_user: current_user)
    render partial: "datasets_list"
  end


  def modal_editor
    @datasets = SavedDatasets.where(decidim_user: current_user)
    render partial: "datasets_list"
  end

  def datasets
    @datasets = SavedDatasets.where(decidim_user: current_user)
    respond_to do |format|
      format.json { render json: @datasets }
    end
  end

  private

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
